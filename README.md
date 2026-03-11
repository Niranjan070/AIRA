# AIRA — AI Risk Assessment Platform

> **Four Pillars AI** · Multi-agent business intelligence powered entirely by **local GPU models** — no API keys, no cloud costs, full data privacy.

AIRA runs four specialised AI agents (Finance, Risk, Compliance, Market) sequentially on a single consumer GPU using 4-bit quantisation. Each agent analyses your business scenario with real Indian financial, legal, and market datasets and returns structured, readable insights.

---

## Screenshots

| Analysis Workspace | Trade-off Matrix |
|---|---|
| Enter scenario → select analysis type → get AI output | Cross-agent investment vs risk breakdown |

---

## Key Features

- **Four Specialised Agents** — Finance, Risk, Compliance, and Market agents each powered by a different LLM tuned for their domain
- **Fully Local Inference** — All models run on your own GPU via HuggingFace Transformers + 4-bit NF4 quantisation (BitsAndBytes). No API key required.
- **Sequential GPU Loading** — One model on GPU at a time; VRAM never exceeds ~4 GB even during comprehensive 4-agent analysis
- **Real Indian Datasets** — Agents are grounded with actual data:
  - Government financial data (expenditure, GSDP, fiscal deficits)
  - NSE TATA Global stock data
  - Indian legal Q&A database (IndicLegal 10K)
  - Social sector expenditure data
- **Five Analysis Modes** — Comprehensive (all 4 agents) or individual agent focus
- **Readable Structured Output** — Responses formatted with `##` section headers, bullet points, confidence scores
- **WebSocket Support** — Real-time streaming of analysis progress
- **Interactive Dashboard** — React + TypeScript UI with agent status, confidence metrics, trade-off matrix, and collaborative insights

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Port 5173)                 │
│              React + TypeScript + Tailwind CSS          │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────────┐
│              Node.js + Express (Port 8000)              │
│  • Receives scenario + analysis_focus from frontend     │
│  • Builds agent prompts with dataset context            │
│  • Calls Python model server sequentially               │
│  • Extracts confidence scores, returns structured JSON  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (localhost:8001)
┌───────────────────────▼─────────────────────────────────┐
│            Python FastAPI Model Server (Port 8001)      │
│  • Loads one HuggingFace model at a time onto GPU       │
│  • 4-bit NF4 quantisation via BitsAndBytes              │
│  • Auto-unloads model after generation to free VRAM     │
│  • Sequential: Finance→Risk→Compliance→Market            │
└───────────────────────┬─────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │   NVIDIA GPU       │
              │  (CUDA, 8 GB VRAM) │
              └───────────────────┘
```

---

## AI Models

| Agent | Model | Parameters | VRAM (4-bit) | Speed |
|-------|-------|-----------|-------------|-------|
| Finance | `Qwen/Qwen2.5-3B-Instruct` | 3B | ~1.8 GB | ~15 tok/s |
| Risk | `Qwen/Qwen2.5-3B-Instruct` | 3B | reused ♻️ | ~15 tok/s |
| Compliance | `Qwen/Qwen2.5-3B-Instruct` | 3B | reused ♻️ | ~15 tok/s |
| Market | `HuggingFaceTB/SmolLM2-1.7B-Instruct` | 1.7B | ~1.0 GB | ~17 tok/s |

> Finance, Risk, and Compliance share the same model — on comprehensive runs, Qwen2.5-3B is loaded once and reused, saving significant time.

**Total comprehensive analysis time:** ~2.5–3 minutes on RTX 5050 (8 GB VRAM)

---

## GPU Requirements

| Requirement | Minimum | Tested |
|-------------|---------|--------|
| VRAM | 6 GB | 8 GB (RTX 5050 Laptop) |
| CUDA | 11.8+ | 12.8 (cu128) |
| Architecture | Ampere+ | Blackwell (sm_120) |

> **Blackwell GPU users (RTX 50xx):** You must use PyTorch with cu128. Standard cu124/cu126 wheels do not support sm_120.

---

## Prerequisites

- **Python 3.10+** (tested on 3.12.10)
- **Node.js 18+**
- **NVIDIA GPU** with CUDA support
- **~8 GB free disk space** for model weights (auto-downloaded on first run)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Niranjan070/AIRA.git
cd AIRA
```

### 2. Create Python virtual environment

```bash
python -m venv .venv
```

Activate it:
- **Windows:** `.\.venv\Scripts\Activate.ps1`
- **Linux/Mac:** `source .venv/bin/activate`

### 3. Install PyTorch (GPU)

**Standard (Ampere / Ada / Hopper — RTX 30xx, 40xx, A100, H100):**
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu124
```

**Blackwell (RTX 50xx — requires cu128):**
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu128
```

### 4. Install Python model server dependencies

```bash
pip install -r backend/model_server/requirements.txt
pip install transformers==4.57.6 huggingface-hub==0.36.2
```

> `transformers==4.57.6` is pinned for compatibility.

### 5. Install Node.js backend dependencies

```bash
cd backend
npm install
cd ..
```

### 6. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Running AIRA

### Option A — One-command startup (Windows, recommended)

```powershell
.\start-aira.ps1
```

This opens three separate PowerShell windows:
- 🤖 **Model Server** (port 8001) — Python FastAPI
- 🔧 **Backend** (port 8000) — Node.js Express
- 🎨 **Frontend** (port 5173) — React Vite

### Option B — Manual startup (three terminals)

**Terminal 1 — Python model server:**
```bash
.\.venv\Scripts\python.exe backend/model_server/server.py
```

**Terminal 2 — Node.js backend:**
```bash
cd backend
npm start
```

**Terminal 3 — React frontend:**
```bash
cd frontend
npm run dev
```

### Access the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Model Server | http://localhost:8001 |
| Health Check | http://localhost:8000/health |
| API Status | http://localhost:8000/status |

---

## Usage

1. Open **http://localhost:5173** in your browser
2. Navigate to **Analysis Workspace** from the sidebar
3. Type your business scenario in the text area
4. Select an **Analysis Type** from the dropdown:
   - `Comprehensive (All Agents)` — runs all 4 agents (~3 min)
   - `Financial Analysis` — Finance agent only (~45s)
   - `Risk Assessment` — Risk agent only (~30s)
   - `Compliance Review` — Compliance agent only (~35s)
   - `Market Intelligence` — Market agent only (~30s)
5. Click **Run Analysis**
6. Results appear in the **Analysis Results** tab as formatted sections
7. Switch to **Collaborative Insights** for cross-agent synthesis and **Trade-off Matrix** for investment vs risk comparison

### Example Scenarios

**Market entry:**
> We want to launch a SaaS platform for Indian SMEs offering AI-powered accounting and GST compliance automation, priced at ₹999/month. Target: 10,000 subscribers in year 1 with a ₹3 crore marketing budget.

**Investment decision:**
> A mid-size IT company is considering acquiring a fintech startup for $2M to expand its digital payments portfolio in India.

**Expansion:**
> Our manufacturing company (annual revenue ₹500 crore) is evaluating a ₹50 crore investment to build a new EV battery components facility in Gujarat.

---

## Project Structure

```
AIRA/
├── .venv/                          # Python virtual environment
├── start-aira.ps1                  # One-click startup (Windows)
│
├── backend/
│   ├── server.js                   # Node.js Express API + WebSocket server
│   ├── dataLoader.js               # CSV/JSON dataset loader & formatter
│   ├── package.json
│   │
│   ├── model_server/
│   │   ├── server.py               # Python FastAPI — GPU inference server
│   │   └── requirements.txt        # Python dependencies
│   │
│   └── datasets/
│       ├── financial/
│       │   ├── Aggregate_Expenditure.csv
│       │   ├── Capital_Expenditure.csv
│       │   ├── Gross_Fiscal_Deficits.csv
│       │   ├── Nominal_GSDP_Series.csv
│       │   ├── Own_Tax_Revenues.csv
│       │   ├── Revenue_Deficits.csv
│       │   └── Revenue_Expenditure.csv
│       ├── legal/
│       │   └── IndicLegalQA Dataset_10K_Revised.json
│       ├── market/
│       │   └── NSE-TATAGLOBAL11.csv
│       └── social/
│           └── Social_Sector_Expenditure.csv
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx                 # Router (/, /dashboard, /workspace, /reports)
        ├── pages/
        │   ├── Dashboard.tsx       # Executive dashboard with KPIs
        │   ├── Workspace.tsx       # Analysis input + results (main page)
        │   ├── Agents.tsx          # Agent status cards
        │   └── Reports.tsx         # Historical analysis reports
        ├── components/
        │   ├── layout/             # Header, Sidebar, Layout
        │   └── ui/                 # shadcn/ui component library
        ├── contexts/
        │   └── AgentContext.tsx    # Global agent state management
        ├── hooks/
        │   ├── useAnalysis.ts      # Analysis execution + state
        │   └── useReports.ts       # Reports data access
        └── services/
            └── api.ts              # HTTP client for backend API
```

---

## API Reference

### `POST /analyze`

Run AI analysis on a business scenario.

**Request:**
```json
{
  "scenario": "Your business scenario text",
  "analysis_focus": "comprehensive"
}
```

`analysis_focus` options: `comprehensive` | `financial` | `risk` | `compliance` | `market`

**Response:**
```json
{
  "scenario": "...",
  "analysis_focus": "comprehensive",
  "timestamp": "2026-03-11T...",
  "execution_time_seconds": 165.4,
  "agents_utilized": ["Finance", "Compliance", "Risk", "Market"],
  "finance": {
    "agent": "Finance",
    "model": "Qwen 2.5 3B Instruct (Finance)",
    "analysis": "## 💰 FINANCIAL VIABILITY\n• ...",
    "confidence": 0.82,
    "execution_time": 44.1,
    "device": "GPU (CUDA)",
    "tokens_generated": 487
  },
  "risk": { ... },
  "compliance": { ... },
  "market": { ... }
}
```

### `GET /health`
Returns server health and model server connectivity status.

### `GET /status`
Returns detailed agent status, model assignments, and system info.

### `GET /datasets`
Returns information about loaded datasets and record counts.

### `GET /analyze/types`
Returns all available analysis types with descriptions.

---

## Datasets

| Dataset | Records | Used By | Source |
|---------|---------|---------|--------|
| Government Expenditure (7 files) | Multi-year state-wise | Finance, Risk | Reserve Bank of India |
| NSE TATA Global Stock | Daily OHLCV | Market | NSE India |
| IndicLegal Q&A | 10,000 pairs | Compliance | IndicLegal dataset |
| Social Sector Expenditure | Multi-year | Risk | RBI / Government |

---

## Troubleshooting

**Model server won't start / CUDA not available:**
```bash
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```
If `False`, reinstall PyTorch with the correct CUDA wheel for your GPU.

**RTX 50xx / Blackwell — `sm_120` not supported:**
```bash
pip uninstall torch -y
pip install torch --index-url https://download.pytorch.org/whl/cu128
```

**`DynamicCache` / `seen_tokens` error (if using Phi-3.5):**
```bash
pip install transformers==4.57.6 huggingface-hub==0.36.2
```

**OOM (out of memory):**
- Reduce `max_new_tokens` in `backend/model_server/server.py` from `512` to `384`
- Close other GPU applications before running

**Frontend can't reach backend (CORS error):**
- Ensure backend is running on port 8000
- Check `CORS_ORIGIN` in `backend/.env` matches your frontend URL

**Analysis hangs / timeout:**
- The Node.js backend has a 10-minute timeout per agent call
- First run is slower because model weights download from HuggingFace (~1–4 GB per model)
- Subsequent runs skip the download and only load from disk cache

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI |
| Backend API | Node.js 18, Express, WebSocket (ws) |
| AI Inference | Python 3.12, FastAPI, Uvicorn |
| ML Framework | PyTorch 2.10 (cu128), HuggingFace Transformers 4.57.6 |
| Quantisation | BitsAndBytes 0.49 (4-bit NF4) |
| Model Loading | Accelerate 1.13 |
| State Management | React Context API |
| Routing | React Router v6 |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [HuggingFace](https://huggingface.co) for model hosting and Transformers library
- [Qwen Team / Alibaba](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct) for Qwen2.5-3B-Instruct
- [HuggingFace Research](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct) for SmolLM2
- [BitsAndBytes](https://github.com/TimDettmers/bitsandbytes) for 4-bit quantisation
- Reserve Bank of India and NSE for public financial datasets

