import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Agent } from 'undici';
import dataLoader from './dataLoader.js';

dotenv.config();

// Custom undici agent with extended timeouts for slow GPU inference
const slowAgent = new Agent({
  headersTimeout: 900_000,  // 15 minutes
  bodyTimeout: 900_000,     // 15 minutes
  connectTimeout: 30_000,   // 30 seconds
});

const app = express();
const PORT = process.env.PORT || 8000;
const MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:8001';

// Gemini API Configuration (fallback for local model failures)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const INFERENCE_MODE = process.env.INFERENCE_MODE || 'auto'; // auto | local | gemini

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Agent prompt templates
const AGENT_PROMPTS = {
  finance: `You are a Finance Agent specialized in financial analysis and investment strategy.

Analyze this business scenario. Provide a CONCISE analysis (max 300 words) using ONLY the structure below.

## 💰 FINANCIAL VIABILITY
• [2-3 concise bullet points - max 25 words each]

## 📊 KEY METRICS
• [Metric 1]: [Value and brief insight]
• [Metric 2]: [Value and brief insight]
• [Metric 3]: [Value and brief insight]

## 💡 INVESTMENT ANALYSIS
• Capital Required: [Amount/estimate]
• Expected ROI: [Percentage and timeframe]
• Funding Strategy: [1 sentence]

## ⚠️ FINANCIAL RISKS
• [Risk 1] - [Brief mitigation]
• [Risk 2] - [Brief mitigation]

## 📈 RECOMMENDATION
[2-3 clear sentences with actionable advice]

RULES:
- Use ONLY bullet points (•), NO paragraphs
- Keep each point under 25 words
- DO NOT mention "sample data" or "dataset limitations"
- Use specific numbers when available
- Be direct and actionable

IMPORTANT: At the end, provide confidence score:
CONFIDENCE_SCORE: 0.XX`,

  risk: `You are a Risk Agent specialized in risk assessment and mitigation strategies.

Analyze this business scenario. Provide a CONCISE assessment (max 300 words) using ONLY the structure below.

## 🛡️ RISK OVERVIEW
[1-2 sentences on overall risk level: LOW/MEDIUM/HIGH]

## 🎯 CRITICAL RISKS (Top 3)
1. **[Risk Name]** - Severity: HIGH/MEDIUM/LOW
   • Impact: [Brief 15-word description]
   
2. **[Risk Name]** - Severity: HIGH/MEDIUM/LOW
   • Impact: [Brief 15-word description]
   
3. **[Risk Name]** - Severity: HIGH/MEDIUM/LOW
   • Impact: [Brief 15-word description]

## 📋 RISK CATEGORIES
• Market Risk: [Severity] - [10-word description]
• Operational Risk: [Severity] - [10-word description]
• Financial Risk: [Severity] - [10-word description]

## ✅ MITIGATION STRATEGIES
• [Strategy 1 - actionable, specific]
• [Strategy 2 - actionable, specific]
• [Strategy 3 - actionable, specific]

## 📊 OVERALL RISK SCORE
[Score 1-100] - [Brief justification]

RULES:
- Use ONLY bullet points (•) and numbered lists
- Keep each point under 20 words
- Be specific and actionable
- NO paragraphs or long explanations

IMPORTANT: At the end, provide confidence score:
CONFIDENCE_SCORE: 0.XX`,

  compliance: `You are a Compliance Agent specialized in legal and regulatory analysis.

Analyze this business scenario. Provide a CONCISE analysis (max 300 words) using ONLY the structure below.

## ⚖️ COMPLIANCE OVERVIEW
[2 sentences on compliance landscape and readiness level]

## 📜 KEY REGULATIONS
• [Regulation 1] - [Brief requirement in 10 words]
• [Regulation 2] - [Brief requirement in 10 words]
• [Regulation 3] - [Brief requirement in 10 words]

## ✓ COMPLIANCE REQUIREMENTS
• **Licensing**: [Specific license needed]
• **Certifications**: [Required certifications]
• **Documentation**: [Key documents needed]

## ⚠️ COMPLIANCE RISKS
• [Risk 1] - Severity: HIGH/MEDIUM/LOW
• [Risk 2] - Severity: HIGH/MEDIUM/LOW

## 📋 PRIORITY ACTIONS
1. [Immediate action - specific and clear]
2. [Short-term action - specific and clear]
3. [Long-term action - specific and clear]

## 💯 COMPLIANCE SCORE
[Score 1-100] - [Brief justification]

RULES:
- Use ONLY bullet points (•) and numbered lists
- Keep each point under 20 words
- Be specific with regulation names and requirements
- NO paragraphs

IMPORTANT: At the end, provide confidence score:
CONFIDENCE_SCORE: 0.XX`,

  market: `You are a Market Agent specialized in market intelligence and competitive analysis.

Analyze this business scenario. Provide a CONCISE analysis (max 300 words) using ONLY the structure below.

## 📊 MARKET OVERVIEW
• Market Size: [Value with growth rate]
• Growth Rate: [Percentage and trend]
• Key Opportunity: [1 sentence]

## 🎯 TARGET MARKET
• Primary Segment: [Description in 10 words]
• Market Size: [Specific estimate]
• Growth Potential: [Percentage with timeframe]

## 🏢 COMPETITIVE LANDSCAPE
• [Competitor 1]: [10-word description]
• [Competitor 2]: [10-word description]
• [Competitor 3]: [10-word description]

## 💪 MARKET POSITION
**Strengths:**
• [Strength 1]
• [Strength 2]

**Opportunities:**
• [Opportunity 1]
• [Opportunity 2]

**Threats:**
• [Threat 1]
• [Threat 2]

## 🚀 GO-TO-MARKET STRATEGY
• [Recommendation 1 - specific and actionable]
• [Recommendation 2 - specific and actionable]
• [Recommendation 3 - specific and actionable]

## 📈 MARKET SCORE
[Score 1-100] - [Brief justification]

RULES:
- Use ONLY bullet points (•), NO paragraphs
- Keep each point under 15 words
- DO NOT mention dataset limitations or data availability
- Be specific with numbers and recommendations

IMPORTANT: At the end, provide confidence score:
CONFIDENCE_SCORE: 0.XX`
};

// Agent metadata
const AGENT_METADATA = {
  finance: {
    name: 'Finance Agent',
    model: 'Phi-3.5 Mini Instruct (3.8B, 4-bit)',
    model_id: 'microsoft/Phi-3.5-mini-instruct',
    description: 'Financial analysis and investment strategy',
    duration: '15-25 seconds',
    device: 'GPU (CUDA)',
    capabilities: ['Financial Modeling', 'Revenue Projections', 'ROI Analysis', 'Budget Planning']
  },
  risk: {
    name: 'Risk Agent',
    model: 'Qwen 2.5 3B Instruct (3B, 4-bit)',
    model_id: 'Qwen/Qwen2.5-3B-Instruct',
    description: 'Risk assessment and mitigation strategies',
    duration: '10-20 seconds',
    device: 'GPU (CUDA)',
    capabilities: ['Risk Scoring', 'Threat Analysis', 'Mitigation Planning', 'Impact Assessment']
  },
  compliance: {
    name: 'Compliance Agent',
    model: 'Phi-3.5 Mini Instruct (3.8B, 4-bit)',
    model_id: 'microsoft/Phi-3.5-mini-instruct',
    description: 'Legal and regulatory compliance analysis',
    duration: '10-20 seconds',
    device: 'GPU (CUDA)',
    capabilities: ['Regulatory Analysis', 'Legal Compliance', 'Privacy Assessment', 'License Requirements']
  },
  market: {
    name: 'Market Agent',
    model: 'SmolLM2 1.7B Instruct (1.7B, 4-bit)',
    model_id: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
    description: 'Market intelligence and competitive analysis',
    duration: '10-15 seconds',
    device: 'GPU (CUDA)',
    capabilities: ['Market Sizing', 'Competitor Analysis', 'Trend Identification', 'Strategy Recommendations']
  }
};

// Helper function to call local model server with agent-specific prompt and dataset context
async function callLocalAgent(agentType, scenario) {
  const startTime = Date.now();
  const metadata = AGENT_METADATA[agentType];
  
  try {
    // Get relevant dataset context for this agent
    let datasetContext = '';
    
    switch(agentType) {
      case 'finance':
        datasetContext = dataLoader.formatFinancialDataForPrompt();
        break;
      case 'risk':
        // Risk analysis can use financial and social data
        datasetContext = dataLoader.formatFinancialDataForPrompt() + '\n' + 
                        dataLoader.formatSocialDataForPrompt();
        break;
      case 'compliance':
        datasetContext = dataLoader.formatLegalDataForPrompt();
        break;
      case 'market':
        datasetContext = dataLoader.formatMarketDataForPrompt();
        break;
    }
    
    const prompt = `${AGENT_PROMPTS[agentType]}

${datasetContext}

IMPORTANT: Use the above datasets in your analysis. Reference specific data points, trends, and figures from these datasets to support your recommendations.

Business Scenario:
${scenario}

Provide your analysis:`;
    
    // Call local model server with extended timeout
    // Uses custom undici agent to avoid default 300s headers timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900000); // 15 min hard limit

    const response = await fetch(`${MODEL_SERVER_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: agentType, prompt }),
      signal: controller.signal,
      dispatcher: slowAgent,
    });

    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Model server returned ${response.status}`);
    }
    
    const result = await response.json();
    const analysis = result.text;
    
    // Extract confidence score from AI response
    let confidence = 0.85; // Default fallback
    const confidenceMatch = analysis.match(/CONFIDENCE_SCORE:\s*(\d+\.?\d*)/i);
    if (confidenceMatch && confidenceMatch[1]) {
      confidence = parseFloat(confidenceMatch[1]);
      // Ensure it's between 0 and 1
      if (confidence > 1) confidence = confidence / 100;
      if (confidence < 0.5) confidence = 0.5; // Minimum threshold
      if (confidence > 1) confidence = 1.0; // Maximum cap
    }
    
    const executionTime = (Date.now() - startTime) / 1000;
    
    return {
      agent: agentType.charAt(0).toUpperCase() + agentType.slice(1),
      model: metadata.model,
      model_id: metadata.model_id,
      analysis: analysis,
      confidence: confidence,
      execution_time: executionTime,
      device: 'GPU (CUDA)',
      tokens_generated: result.tokens_generated,
      tokens_per_second: result.tokens_per_second,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error calling ${agentType} agent:`, error);
    return {
      agent: agentType.charAt(0).toUpperCase() + agentType.slice(1),
      model: metadata.model,
      analysis: `Error: ${error.message}`,
      confidence: 0,
      execution_time: (Date.now() - startTime) / 1000,
      device: 'GPU (CUDA)',
      error: error.message
    };
  }
}

// ── Gemini API Agent ────────────────────────────────────────────────────────

async function callGeminiAgent(agentType, scenario) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured in backend/.env');
  }

  const metadata = AGENT_METADATA[agentType];
  const startTime = Date.now();

  // Build prompt with dataset context (same datasets as local models)
  let datasetContext = '';
  switch (agentType) {
    case 'finance':
      datasetContext = dataLoader.formatFinancialDataForPrompt();
      break;
    case 'risk':
      datasetContext = dataLoader.formatFinancialDataForPrompt() + '\n' + dataLoader.formatSocialDataForPrompt();
      break;
    case 'compliance':
      datasetContext = dataLoader.formatLegalDataForPrompt();
      break;
    case 'market':
      datasetContext = dataLoader.formatMarketDataForPrompt();
      break;
  }

  const prompt = `${AGENT_PROMPTS[agentType]}

${datasetContext}

IMPORTANT: Use the above datasets in your analysis. Reference specific data points, trends, and figures.

Business Scenario:
${scenario}

Provide your analysis:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      throw new Error('No text generated by Gemini API');
    }

    // Extract confidence score
    let confidence = 0.85;
    const confidenceMatch = analysis.match(/CONFIDENCE_SCORE:\s*(\d+\.?\d*)/i);
    if (confidenceMatch && confidenceMatch[1]) {
      confidence = parseFloat(confidenceMatch[1]);
      if (confidence > 1) confidence = confidence / 100;
      if (confidence < 0.5) confidence = 0.5;
      if (confidence > 1) confidence = 1.0;
    }

    const executionTime = (Date.now() - startTime) / 1000;

    return {
      agent: agentType.charAt(0).toUpperCase() + agentType.slice(1),
      model: `Gemini 2.0 Flash (API)`,
      model_id: GEMINI_MODEL,
      analysis,
      confidence,
      execution_time: executionTime,
      device: 'Cloud (Google AI)',
      inference_mode: 'gemini',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ Gemini API failed for ${agentType}:`, error.message);
    return {
      agent: agentType.charAt(0).toUpperCase() + agentType.slice(1),
      model: `Gemini 2.0 Flash (API)`,
      analysis: `Error: ${error.message}`,
      confidence: 0,
      execution_time: (Date.now() - startTime) / 1000,
      device: 'Cloud (Google AI)',
      inference_mode: 'gemini',
      error: error.message,
    };
  }
}

// ── Smart Inference Router ──────────────────────────────────────────────────

async function isModelServerHealthy() {
  try {
    const res = await fetch(`${MODEL_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function resolveInferenceMode() {
  if (INFERENCE_MODE === 'gemini') return 'gemini';
  if (INFERENCE_MODE === 'local') return 'local';
  // auto: prefer local if model server is running, else Gemini
  const healthy = await isModelServerHealthy();
  if (healthy) return 'local';
  if (GEMINI_API_KEY) return 'gemini';
  return 'unavailable';
}

async function callAgentWithFallback(agentType, scenario, primaryMode) {
  const primaryFn = primaryMode === 'gemini' ? callGeminiAgent : callLocalAgent;
  const result = await primaryFn(agentType, scenario);

  // If primary failed and Gemini fallback is available
  if (result.error && primaryMode === 'local' && GEMINI_API_KEY) {
    console.log(`⚠️  [${agentType}] Local model failed: ${result.error}`);
    console.log(`🔄 [${agentType}] Falling back to Gemini API...`);
    const fallbackResult = await callGeminiAgent(agentType, scenario);
    fallbackResult.fallback = true;
    fallbackResult.local_error = result.error;
    return fallbackResult;
  }

  result.inference_mode = result.inference_mode || primaryMode;
  return result;
}

// Routes

// Root endpoint
app.get('/', (req, res) => {
  const datasetSummary = dataLoader.getDatasetSummary();
  
  res.json({
    message: '🚀 Four Pillars AI - Multi-Model Backend with Real Datasets',
    status: 'operational',
    version: '3.0.0',
    framework: 'Node.js + Express + Local GPU Models + Real Datasets',
    agents: ['Finance', 'Risk', 'Compliance', 'Market'],
    models: Object.values(AGENT_METADATA).map(a => a.model),
    datasets: datasetSummary,
    endpoints: ['/analyze', '/status', '/health', '/examples', '/analyze/types', '/datasets'],
    documentation: 'API endpoints available for business analysis with real TATA data'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    framework: 'Local Multi-Model GPU + Gemini API Fallback',
    version: '3.1.0',
    inference_mode: INFERENCE_MODE,
    gemini_configured: !!GEMINI_API_KEY,
    orchestration: 'Node.js Express + Python Model Server + Gemini API',
    agents: ['Finance', 'Risk', 'Compliance', 'Market'],
    model_server: MODEL_SERVER_URL,
    system_optimization: 'Sequential GPU Inference (4-bit Quantized) with Gemini Fallback'
  });
});

// Configuration endpoint
app.get('/config', async (req, res) => {
  const modelServerUp = await isModelServerHealthy();
  const effectiveMode = await resolveInferenceMode();
  res.json({
    inference_mode: INFERENCE_MODE,
    effective_mode: effectiveMode,
    gemini_api_key_configured: !!GEMINI_API_KEY,
    gemini_model: GEMINI_MODEL,
    model_server_url: MODEL_SERVER_URL,
    model_server_online: modelServerUp,
    explanation: {
      auto: 'Try local GPU first, fall back to Gemini API if local fails',
      local: 'Use local GPU models only (requires model server)',
      gemini: 'Use Gemini API only (fast, cloud-based)',
    },
    how_to_change: 'Set INFERENCE_MODE in backend/.env to: auto, local, or gemini',
  });
});

// Detailed status endpoint
app.get('/status', (req, res) => {
  res.json({
    initialized: true,
    framework: 'Local Multi-Model GPU',
    version: '3.0.0',
    agents: [
      { id: 'finance', ...AGENT_METADATA.finance, status: 'ready' },
      { id: 'risk', ...AGENT_METADATA.risk, status: 'ready' },
      { id: 'compliance', ...AGENT_METADATA.compliance, status: 'ready' },
      { id: 'market', ...AGENT_METADATA.market, status: 'ready' }
    ],
    crew_status: 'All agents operational',
    device_allocation: {
      finance: 'GPU (CUDA) - Phi-3.5 Mini',
      risk: 'GPU (CUDA) - Qwen 2.5 3B',
      compliance: 'GPU (CUDA) - Phi-3.5 Mini',
      market: 'GPU (CUDA) - SmolLM2 1.7B'
    },
    system_info: {
      platform: 'Node.js + Python Model Server',
      ai_provider: 'Local HuggingFace Models',
      models: Object.fromEntries(Object.entries(AGENT_METADATA).map(([k, v]) => [k, v.model])),
      inference: 'Sequential GPU (4-bit Quantized)',
      model_server: MODEL_SERVER_URL
    }
  });
});

// Dataset information endpoint
app.get('/datasets', (req, res) => {
  const summary = dataLoader.getDatasetSummary();
  
  res.json({
    status: 'success',
    message: 'TATA datasets loaded and available for analysis',
    datasets: {
      financial: {
        ...summary.financial,
        files: [
          'Aggregate_Expenditure.csv',
          'Capital_Expenditure.csv', 
          'Gross_Fiscal_Deficits.csv',
          'Nominal_GSDP_Series.csv',
          'Own_Tax_Revenues.csv',
          'Revenue_Deficits.csv',
          'Revenue_Expenditure.csv'
        ],
        description: 'Government financial data including expenditure, revenue, and GSDP metrics'
      },
      legal: {
        ...summary.legal,
        files: ['IndicLegalQA_Dataset_10K_Revised.json'],
        description: 'Indian legal Q&A database for compliance and regulatory analysis'
      },
      market: {
        ...summary.market,
        files: ['NSE-TATAGLOBAL11.csv'],
        description: 'TATA Global stock market data from NSE'
      },
      social: {
        ...summary.social,
        files: ['Social_Sector_Expenditure.csv'],
        description: 'Social sector expenditure data for CSR and impact analysis'
      }
    },
    usage: 'All agents automatically use relevant datasets in their analysis',
    note: 'Datasets are embedded in agent prompts for context-aware responses'
  });
});

// Main analysis endpoint
app.post('/analyze', async (req, res) => {
  const { scenario, analysis_focus = 'comprehensive' } = req.body;

  if (!scenario) {
    return res.status(400).json({ error: 'Scenario is required' });
  }

  // Resolve inference mode (auto picks best available backend)
  const mode = await resolveInferenceMode();

  if (mode === 'unavailable') {
    return res.status(503).json({
      error: 'No inference backend available. Either start the model server (python backend/model_server/server.py) or add GEMINI_API_KEY to backend/.env',
    });
  }

  if (mode === 'gemini' && !GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured in backend/.env' });
  }

  const startTime = Date.now();

  try {
    console.log(`🎯 Starting ${analysis_focus} analysis | mode: ${mode} | scenario: ${scenario.substring(0, 50)}...`);

    let results = {};
    let agents_utilized = [];

    // Run analysis based on focus
    if (analysis_focus === 'comprehensive') {
      if (mode === 'gemini') {
        // Gemini: run all 4 agents in PARALLEL (no GPU constraint — fast!)
        console.log('🚀 Running all agents in parallel (Gemini API)');
        const [finance, compliance, risk, market] = await Promise.all([
          callAgentWithFallback('finance', scenario, 'gemini'),
          callAgentWithFallback('compliance', scenario, 'gemini'),
          callAgentWithFallback('risk', scenario, 'gemini'),
          callAgentWithFallback('market', scenario, 'gemini'),
        ]);
        results = { finance, risk, compliance, market };
      } else {
        // Local GPU: sequential (one model on GPU at a time)
        console.log('🖥️  Running agents sequentially (local GPU)');
        const finance = await callAgentWithFallback('finance', scenario, 'local');
        const compliance = await callAgentWithFallback('compliance', scenario, 'local');
        const risk = await callAgentWithFallback('risk', scenario, 'local');
        const market = await callAgentWithFallback('market', scenario, 'local');
        results = { finance, risk, compliance, market };
      }
      agents_utilized = ['Finance', 'Risk', 'Compliance', 'Market'];
    } else if (analysis_focus === 'financial') {
      const finance = await callAgentWithFallback('finance', scenario, mode);
      results = { finance };
      agents_utilized = ['Finance'];
    } else if (analysis_focus === 'risk') {
      const risk = await callAgentWithFallback('risk', scenario, mode);
      results = { risk };
      agents_utilized = ['Risk'];
    } else if (analysis_focus === 'compliance') {
      const compliance = await callAgentWithFallback('compliance', scenario, mode);
      results = { compliance };
      agents_utilized = ['Compliance'];
    } else if (analysis_focus === 'market') {
      const market = await callAgentWithFallback('market', scenario, mode);
      results = { market };
      agents_utilized = ['Market'];
    } else {
      return res.status(400).json({ 
        error: 'Invalid analysis_focus. Must be one of: comprehensive, financial, risk, compliance, market' 
      });
    }

    const executionTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Analysis completed in ${executionTime.toFixed(2)}s (mode: ${mode})`);

    res.json({
      scenario,
      analysis_focus,
      inference_mode: mode,
      timestamp: new Date().toISOString(),
      execution_time_seconds: executionTime,
      framework: mode === 'gemini' ? 'Gemini API (Cloud)' : 'Local Multi-Model GPU',
      crew_result: JSON.stringify(results, null, 2),
      agents_utilized,
      device_allocation: {
        finance: 'GPU (CUDA) - Phi-3.5 Mini',
        risk: 'GPU (CUDA) - Qwen 2.5 3B',
        compliance: 'GPU (CUDA) - Phi-3.5 Mini',
        market: 'GPU (CUDA) - SmolLM2 1.7B'
      },
      system_info: {
        platform: 'Node.js + Python Model Server',
        ai_provider: 'Local HuggingFace Models',
        inference: 'Sequential GPU (4-bit Quantized)'
      },
      performance_metrics: {
        total_execution_time: executionTime,
        api_calls: agents_utilized.length,
        average_time_per_agent: executionTime / agents_utilized.length
      },
      ...results
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    res.status(500).json({
      error: error.message,
      scenario,
      analysis_focus,
      timestamp: new Date().toISOString()
    });
  }
});

// Analysis types endpoint
app.get('/analyze/types', (req, res) => {
  res.json({
    analysis_types: {
      comprehensive: {
        description: 'Complete Four Pillars analysis with all agents',
        agents: ['finance', 'risk', 'compliance', 'market'],
        duration: '60-120 seconds (sequential GPU)',
        use_case: 'Full business evaluation and strategy',
        output: 'Complete business assessment with all aspects covered',
        device_allocation: 'GPU (CUDA) - 4 Models Sequential'
      },
      financial: {
        description: 'Financial analysis and investment strategy',
        agents: ['finance'],
        duration: '15-25 seconds',
        use_case: 'Funding, revenue projections, financial planning',
        output: 'Detailed financial analysis and recommendations',
        device_allocation: 'GPU (CUDA) - Phi-3.5 Mini'
      },
      risk: {
        description: 'Risk assessment and mitigation strategies',
        agents: ['risk'],
        duration: '10-20 seconds',
        use_case: 'Risk management and contingency planning',
        output: 'Comprehensive risk analysis with mitigation plans',
        device_allocation: 'GPU (CUDA) - Qwen 2.5 3B'
      },
      compliance: {
        description: 'Legal and regulatory compliance analysis',
        agents: ['compliance'],
        duration: '20-35 seconds',
        use_case: 'Legal requirements and governance frameworks',
        output: 'Compliance roadmap and legal considerations',
        device_allocation: 'GPU (CUDA) - Phi-3.5 Mini'
      },
      market: {
        description: 'Market intelligence and competitive analysis',
        agents: ['market'],
        duration: '10-15 seconds',
        use_case: 'Market strategy, competition, and positioning',
        output: 'Market analysis with strategic recommendations',
        device_allocation: 'GPU (CUDA) - SmolLM2 1.7B'
      }
    },
    framework_info: {
      orchestration: 'Node.js Express + Python FastAPI Model Server',
      process: 'Sequential GPU inference (one model loaded at a time)',
      optimization: '4-bit NF4 quantization via bitsandbytes',
      models: Object.fromEntries(Object.entries(AGENT_METADATA).map(([k, v]) => [k, v.model]))
    }
  });
});

// Example scenarios endpoint
app.get('/examples', (req, res) => {
  res.json({
    example_scenarios: [
      {
        title: 'AI Food Delivery Startup',
        scenario: 'A tech startup wants to launch an AI-powered food delivery app that optimizes delivery routes and predicts customer preferences in major urban markets. The platform will use machine learning for demand forecasting and real-time logistics optimization.',
        recommended_analysis: 'comprehensive',
        focus_areas: ['financial modeling', 'market entry strategy', 'regulatory compliance', 'operational risks'],
        estimated_duration: '45-60 seconds'
      },
      {
        title: 'SaaS Analytics Platform',
        scenario: 'A B2B SaaS company is developing a business intelligence platform for small to medium enterprises with real-time analytics, automated reporting, and predictive insights. The platform targets companies with 50-500 employees.',
        recommended_analysis: 'financial',
        focus_areas: ['subscription pricing', 'customer acquisition', 'revenue projections', 'market sizing'],
        estimated_duration: '15-20 seconds'
      },
      {
        title: 'FinTech Payment Solution',
        scenario: 'A fintech startup is creating a blockchain-based cross-border payment solution for emerging markets with lower transaction fees, faster settlement times, and better exchange rates than traditional banks.',
        recommended_analysis: 'compliance',
        focus_areas: ['regulatory requirements', 'financial licensing', 'data protection', 'international compliance'],
        estimated_duration: '15-20 seconds'
      },
      {
        title: 'Green Energy Marketplace',
        scenario: 'An environmental startup is building an online marketplace connecting solar panel manufacturers with residential customers, including financing options, installation services, and energy monitoring systems.',
        recommended_analysis: 'market',
        focus_areas: ['competitive landscape', 'market trends', 'customer segments', 'growth opportunities'],
        estimated_duration: '15-20 seconds'
      },
      {
        title: 'EdTech Learning Platform',
        scenario: 'An education technology company is developing an AI-powered personalized learning platform for K-12 students that adapts to individual learning styles and provides real-time progress tracking for parents and teachers.',
        recommended_analysis: 'risk',
        focus_areas: ['market risks', 'technology risks', 'regulatory risks', 'execution challenges'],
        estimated_duration: '15-20 seconds'
      }
    ],
    usage_tips: {
      comprehensive: 'Best for complete business evaluation and investor presentations',
      specific_focus: 'Use targeted analysis for specific decision-making needs',
      iterative: 'Run multiple focused analyses to deep-dive into specific areas',
      api_optimization: 'Each agent uses a specialized HuggingFace model for domain-specific analysis'
    }
  });
});

// System info endpoint
app.get('/system/info', (req, res) => {
  res.json({
    framework: 'Local Multi-Model GPU',
    orchestration: 'Node.js Express + Python FastAPI Model Server',
    architecture: 'Multi-Model Sequential GPU Inference',
    optimization: {
      models: Object.fromEntries(Object.entries(AGENT_METADATA).map(([k, v]) => [k, { model: v.model, model_id: v.model_id }])),
      quantization: '4-bit NF4 (bitsandbytes)',
      parallel_processing: false,
      sequential_gpu: true,
      memory_enabled: false,
      planning_enabled: false,
      cloud_based: false
    },
    capabilities: {
      multi_model_agents: true,
      structured_workflows: true,
      role_based_agents: true,
      local_gpu_inference: true,
      domain_specialized_models: true
    },
    deployment: {
      backend: 'Node.js + Express',
      model_server: 'Python FastAPI + HuggingFace Transformers',
      inference: 'PyTorch + CUDA + bitsandbytes',
      datasets: 'Real Datasets (Financial, Legal, Market, Social)',
      data_integration: 'Context-embedded prompts',
      node_version: process.version,
      platform: process.platform
    },
    performance: {
      comprehensive_analysis: '60-120 seconds (sequential)',
      single_agent_analysis: '10-35 seconds',
      gpu_acceleration: 'NVIDIA CUDA (4-bit quantized)',
      concurrent_requests: 'Sequential (one model at a time)'
    }
  });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { scenario, analysis_focus = 'comprehensive' } = data;

      const mode = await resolveInferenceMode();

      ws.send(JSON.stringify({
        type: 'analysis_started',
        scenario,
        framework: mode === 'gemini' ? 'Gemini API' : 'Local Multi-Model GPU',
        inference_mode: mode,
        analysis_focus,
        timestamp: new Date().toISOString()
      }));

      const startTime = Date.now();
      let results = {};
      let agents_utilized = [];

      if (analysis_focus === 'comprehensive') {
        if (mode === 'gemini') {
          const [finance, compliance, risk, market] = await Promise.all([
            callAgentWithFallback('finance', scenario, 'gemini'),
            callAgentWithFallback('compliance', scenario, 'gemini'),
            callAgentWithFallback('risk', scenario, 'gemini'),
            callAgentWithFallback('market', scenario, 'gemini'),
          ]);
          results = { finance, risk, compliance, market };
        } else {
          const finance = await callAgentWithFallback('finance', scenario, 'local');
          const compliance = await callAgentWithFallback('compliance', scenario, 'local');
          const risk = await callAgentWithFallback('risk', scenario, 'local');
          const market = await callAgentWithFallback('market', scenario, 'local');
          results = { finance, risk, compliance, market };
        }
        agents_utilized = ['Finance', 'Risk', 'Compliance', 'Market'];
      } else {
        const result = await callAgentWithFallback(analysis_focus, scenario, mode);
        results = { [analysis_focus]: result };
        agents_utilized = [analysis_focus.charAt(0).toUpperCase() + analysis_focus.slice(1)];
      }

      const executionTime = (Date.now() - startTime) / 1000;

      ws.send(JSON.stringify({
        type: 'analysis_complete',
        result: {
          scenario,
          analysis_focus,
          timestamp: new Date().toISOString(),
          execution_time_seconds: executionTime,
          agents_utilized,
          ...results
        },
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      ws.send(JSON.stringify({
        type: 'analysis_error',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n🚀 Four Pillars AI Backend - Multi-Model Inference');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`⚙️  Inference Mode: ${INFERENCE_MODE.toUpperCase()}`);
  if (INFERENCE_MODE === 'auto') {
    console.log(`   → Local GPU (primary) + Gemini API (fallback)`);
  } else if (INFERENCE_MODE === 'gemini') {
    console.log(`   → Gemini API only (${GEMINI_MODEL})`);
  } else {
    console.log(`   → Local GPU models only`);
  }
  console.log(`🤖 Model Server: ${MODEL_SERVER_URL}`);
  console.log(`☁️  Gemini API: ${GEMINI_API_KEY ? 'Configured ✓' : 'Not configured ✗'}`);
  console.log(`💡 Models (local GPU):`);
  for (const [agent, meta] of Object.entries(AGENT_METADATA)) {
    console.log(`   ${agent.padEnd(12)} → ${meta.model}`);
  }
  console.log(`\n📚 Available Endpoints:`);
  console.log(`   GET  /              - API information`);
  console.log(`   GET  /health        - Health check`);
  console.log(`   GET  /status        - Detailed system status`);
  console.log(`   GET  /config        - Current inference configuration`);
  console.log(`   POST /analyze       - Run business analysis`);
  console.log(`   GET  /analyze/types - Get analysis types`);
  console.log(`   GET  /examples      - Get example scenarios`);
  console.log(`   GET  /system/info   - Get system information`);
  console.log(`   WS   /ws            - WebSocket real-time updates`);
  console.log(`\n✨ Ready to analyze business scenarios!\n`);
});
