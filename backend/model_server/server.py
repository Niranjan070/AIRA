"""
AIRA Multi-Model Inference Server
Loads 4 specialized HuggingFace models sequentially on GPU for each agent.

Models:
  - Finance:    microsoft/Phi-3.5-mini-instruct  (3.8B, 4-bit)
  - Risk:       Qwen/Qwen2.5-3B-Instruct         (3B, 4-bit)
  - Compliance: microsoft/Phi-3.5-mini-instruct   (3.8B, 4-bit)
  - Market:     google/gemma-2-2b-it               (2.6B, 4-bit)

Architecture: Sequential model loading — one model in GPU at a time.
"""

import gc
import time
import logging
from contextlib import asynccontextmanager

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("model_server")

# ── Model Configuration ──────────────────────────────────────────────────────

MODEL_CONFIG = {
    "finance": {
        "model_id": "microsoft/Phi-3.5-mini-instruct",
        "display_name": "Phi-3.5 Mini Instruct",
        "params": "3.8B",
        "vram_estimate": "~2.1 GB (4-bit)",
        "max_new_tokens": 1024,
        "temperature": 0.7,
        "top_p": 0.9,
    },
    "risk": {
        "model_id": "Qwen/Qwen2.5-3B-Instruct",
        "display_name": "Qwen 2.5 3B Instruct",
        "params": "3B",
        "vram_estimate": "~1.8 GB (4-bit)",
        "max_new_tokens": 1024,
        "temperature": 0.7,
        "top_p": 0.9,
    },
    "compliance": {
        "model_id": "microsoft/Phi-3.5-mini-instruct",
        "display_name": "Phi-3.5 Mini Instruct (Compliance)",
        "params": "3.8B",
        "vram_estimate": "~2.4 GB (4-bit)",
        "max_new_tokens": 1024,
        "temperature": 0.6,
        "top_p": 0.9,
    },
    "market": {
        "model_id": "HuggingFaceTB/SmolLM2-1.7B-Instruct",
        "display_name": "SmolLM2 1.7B Instruct",
        "params": "1.7B",
        "vram_estimate": "~1.0 GB (4-bit)",
        "max_new_tokens": 1024,
        "temperature": 0.7,
        "top_p": 0.9,
    },
}

# 4-bit quantization config (same for all models)
QUANTIZATION_CONFIG = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
)

# ── Global State ─────────────────────────────────────────────────────────────

current_agent: str | None = None
current_model = None
current_tokenizer = None


# ── Model Management ─────────────────────────────────────────────────────────

def unload_model():
    """Free GPU memory by unloading the current model."""
    global current_model, current_tokenizer, current_agent

    if current_model is not None:
        logger.info(f"Unloading model for agent: {current_agent}")
        del current_model
        del current_tokenizer
        current_model = None
        current_tokenizer = None
        current_agent = None
        gc.collect()
        torch.cuda.empty_cache()
        logger.info(f"VRAM freed. Available: {torch.cuda.mem_get_info()[0] / 1024**3:.2f} GB")


def load_model(agent: str):
    """Load a model onto GPU for the specified agent."""
    global current_model, current_tokenizer, current_agent

    if current_agent == agent and current_model is not None:
        logger.info(f"Model for {agent} already loaded, reusing.")
        return

    # Skip reload if the same model_id is already loaded (e.g. finance & compliance both use Phi-3.5)
    config = MODEL_CONFIG[agent]
    if current_agent is not None and current_model is not None:
        current_model_id = MODEL_CONFIG[current_agent]["model_id"]
        if current_model_id == config["model_id"]:
            logger.info(f"Same model ({config['model_id']}) already loaded for {current_agent}, reusing for {agent}.")
            current_agent = agent
            return

    # Unload previous model first
    unload_model()

    config = MODEL_CONFIG[agent]
    model_id = config["model_id"]
    logger.info(f"Loading {config['display_name']} ({config['params']}) for {agent} agent...")

    start = time.time()

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=QUANTIZATION_CONFIG,
        device_map="auto",
        trust_remote_code=True,
    )

    elapsed = time.time() - start
    current_model = model
    current_tokenizer = tokenizer
    current_agent = agent

    vram_used = (torch.cuda.mem_get_info()[1] - torch.cuda.mem_get_info()[0]) / 1024**3
    logger.info(f"Loaded {config['display_name']} in {elapsed:.1f}s — VRAM used: {vram_used:.2f} GB")


def generate_text(agent: str, prompt: str) -> dict:
    """Run inference on the currently loaded model."""
    config = MODEL_CONFIG[agent]

    load_model(agent)

    start = time.time()

    # Use chat template if the tokenizer supports it
    if hasattr(current_tokenizer, "apply_chat_template"):
        messages = [{"role": "user", "content": prompt}]
        text_input = current_tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = current_tokenizer(text_input, return_tensors="pt", truncation=True, max_length=4096)
    else:
        inputs = current_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=4096)

    inputs = {k: v.to(current_model.device) for k, v in inputs.items()}

    # Generate
    with torch.no_grad():
        try:
            outputs = current_model.generate(
                **inputs,
                max_new_tokens=config["max_new_tokens"],
                temperature=config["temperature"],
                top_p=config["top_p"],
                do_sample=True,
                pad_token_id=current_tokenizer.eos_token_id,
            )
        except AttributeError:
            # Fallback: some models have cache incompatibilities
            outputs = current_model.generate(
                **inputs,
                max_new_tokens=config["max_new_tokens"],
                temperature=config["temperature"],
                top_p=config["top_p"],
                do_sample=True,
                pad_token_id=current_tokenizer.eos_token_id,
                use_cache=False,
            )

    # Decode only the new tokens (exclude the prompt)
    input_length = inputs["input_ids"].shape[1]
    generated_tokens = outputs[0][input_length:]
    text = current_tokenizer.decode(generated_tokens, skip_special_tokens=True)

    elapsed = time.time() - start
    tokens_generated = len(generated_tokens)

    logger.info(f"[{agent}] Generated {tokens_generated} tokens in {elapsed:.1f}s ({tokens_generated/elapsed:.1f} tok/s)")

    return {
        "text": text,
        "model": config["display_name"],
        "model_id": config["model_id"],
        "tokens_generated": tokens_generated,
        "generation_time": round(elapsed, 2),
        "tokens_per_second": round(tokens_generated / elapsed, 1) if elapsed > 0 else 0,
    }


# ── FastAPI App ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("AIRA Multi-Model Server Starting")
    logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
    logger.info(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    logger.info(f"PyTorch: {torch.__version__}")
    logger.info("Models configured:")
    for agent, cfg in MODEL_CONFIG.items():
        logger.info(f"  {agent:12s} → {cfg['model_id']} ({cfg['params']}, {cfg['vram_estimate']})")
    logger.info("=" * 60)
    logger.info("Server ready. Models load on first request (sequential).")
    yield
    # Cleanup on shutdown
    unload_model()
    logger.info("Server shutdown. GPU memory released.")


app = FastAPI(title="AIRA Model Server", version="1.0.0", lifespan=lifespan)


class GenerateRequest(BaseModel):
    agent: str
    prompt: str


class HealthResponse(BaseModel):
    status: str
    gpu: str
    vram_total_gb: float
    vram_used_gb: float
    vram_free_gb: float
    pytorch_version: str
    current_model: str | None
    models: dict


@app.get("/health")
def health():
    vram_free, vram_total = torch.cuda.mem_get_info()
    vram_used = vram_total - vram_free
    return HealthResponse(
        status="healthy",
        gpu=torch.cuda.get_device_name(0),
        vram_total_gb=round(vram_total / 1024**3, 2),
        vram_used_gb=round(vram_used / 1024**3, 2),
        vram_free_gb=round(vram_free / 1024**3, 2),
        pytorch_version=torch.__version__,
        current_model=current_agent,
        models={
            agent: {
                "model_id": cfg["model_id"],
                "display_name": cfg["display_name"],
                "params": cfg["params"],
                "vram_estimate": cfg["vram_estimate"],
            }
            for agent, cfg in MODEL_CONFIG.items()
        },
    )


@app.post("/generate")
def generate(req: GenerateRequest):
    agent = req.agent.lower()
    if agent not in MODEL_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agent '{agent}'. Must be one of: {list(MODEL_CONFIG.keys())}",
        )

    try:
        result = generate_text(agent, req.prompt)
        return {
            "agent": agent,
            **result,
        }
    except torch.cuda.OutOfMemoryError:
        unload_model()
        raise HTTPException(
            status_code=503,
            detail="GPU out of memory. Model unloaded. Try again.",
        )
    except Exception as e:
        logger.error(f"Generation failed for {agent}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/unload")
def unload():
    """Manually unload the current model to free VRAM."""
    unload_model()
    return {"status": "unloaded", "message": "GPU memory freed."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
