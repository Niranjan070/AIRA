import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dataLoader from './dataLoader.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

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
    model: 'Gemini 1.5 Pro',
    description: 'Financial analysis and investment strategy',
    duration: '10-20 seconds',
    device: 'Cloud API',
    capabilities: ['Financial Modeling', 'Revenue Projections', 'ROI Analysis', 'Budget Planning']
  },
  risk: {
    name: 'Risk Agent',
    model: 'Gemini 1.5 Pro',
    description: 'Risk assessment and mitigation strategies',
    duration: '10-20 seconds',
    device: 'Cloud API',
    capabilities: ['Risk Scoring', 'Threat Analysis', 'Mitigation Planning', 'Impact Assessment']
  },
  compliance: {
    name: 'Compliance Agent',
    model: 'Gemini 1.5 Pro',
    description: 'Legal and regulatory compliance analysis',
    duration: '10-20 seconds',
    device: 'Cloud API',
    capabilities: ['Regulatory Analysis', 'Legal Compliance', 'Privacy Assessment', 'License Requirements']
  },
  market: {
    name: 'Market Agent',
    model: 'Gemini 1.5 Pro',
    description: 'Market intelligence and competitive analysis',
    duration: '10-20 seconds',
    device: 'Cloud API',
    capabilities: ['Market Sizing', 'Competitor Analysis', 'Trend Identification', 'Strategy Recommendations']
  }
};

// Helper function to call Gemini API with agent-specific prompt and dataset context
async function callGeminiAgent(agentType, scenario) {
  const startTime = Date.now();
  
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
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
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
      model: 'Gemini 1.5 Pro',
      analysis: analysis,
      confidence: confidence,
      execution_time: executionTime,
      device: 'Cloud API',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error calling ${agentType} agent:`, error);
    return {
      agent: agentType.charAt(0).toUpperCase() + agentType.slice(1),
      model: 'Gemini 1.5 Pro',
      analysis: `Error: ${error.message}`,
      confidence: 0,
      execution_time: (Date.now() - startTime) / 1000,
      device: 'Cloud API',
      error: error.message
    };
  }
}

// Routes

// Root endpoint
app.get('/', (req, res) => {
  const datasetSummary = dataLoader.getDatasetSummary();
  
  res.json({
    message: '🚀 Four Pillars AI - Gemini API Backend with TATA Datasets',
    status: 'operational',
    version: '2.0.0',
    framework: 'Node.js + Express + Gemini API + Real Datasets',
    agents: ['Finance', 'Risk', 'Compliance', 'Market'],
    models: ['Gemini 1.5 Pro'],
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
    framework: 'Gemini API',
    version: '1.0.0',
    orchestration: 'Node.js Express Server',
    agents: ['Finance', 'Risk', 'Compliance', 'Market'],
    api_status: process.env.GEMINI_API_KEY ? 'configured' : 'missing_api_key',
    system_optimization: 'Cloud-based AI Processing'
  });
});

// Detailed status endpoint
app.get('/status', (req, res) => {
  res.json({
    initialized: true,
    framework: 'Gemini API',
    version: '1.0.0',
    agents: [
      { id: 'finance', ...AGENT_METADATA.finance, status: 'ready' },
      { id: 'risk', ...AGENT_METADATA.risk, status: 'ready' },
      { id: 'compliance', ...AGENT_METADATA.compliance, status: 'ready' },
      { id: 'market', ...AGENT_METADATA.market, status: 'ready' }
    ],
    crew_status: 'All agents operational',
    device_allocation: {
      finance: 'Cloud API',
      risk: 'Cloud API',
      compliance: 'Cloud API',
      market: 'Cloud API'
    },
    system_info: {
      platform: 'Node.js',
      ai_provider: 'Google Gemini',
      model: 'Gemini 1.5 Pro',
      memory: 'Cloud-based',
      gpu: 'Not applicable (Cloud API)'
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

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: 'Gemini API key not configured. Please set GEMINI_API_KEY in .env file' 
    });
  }

  const startTime = Date.now();

  try {
    console.log(`🎯 Starting ${analysis_focus} analysis for: ${scenario.substring(0, 50)}...`);

    let results = {};
    let agents_utilized = [];

    // Run analysis based on focus
    if (analysis_focus === 'comprehensive') {
      const [finance, risk, compliance, market] = await Promise.all([
        callGeminiAgent('finance', scenario),
        callGeminiAgent('risk', scenario),
        callGeminiAgent('compliance', scenario),
        callGeminiAgent('market', scenario)
      ]);
      results = { finance, risk, compliance, market };
      agents_utilized = ['Finance', 'Risk', 'Compliance', 'Market'];
    } else if (analysis_focus === 'financial') {
      const finance = await callGeminiAgent('finance', scenario);
      results = { finance };
      agents_utilized = ['Finance'];
    } else if (analysis_focus === 'risk') {
      const risk = await callGeminiAgent('risk', scenario);
      results = { risk };
      agents_utilized = ['Risk'];
    } else if (analysis_focus === 'compliance') {
      const compliance = await callGeminiAgent('compliance', scenario);
      results = { compliance };
      agents_utilized = ['Compliance'];
    } else if (analysis_focus === 'market') {
      const market = await callGeminiAgent('market', scenario);
      results = { market };
      agents_utilized = ['Market'];
    } else {
      return res.status(400).json({ 
        error: 'Invalid analysis_focus. Must be one of: comprehensive, financial, risk, compliance, market' 
      });
    }

    const executionTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Analysis completed in ${executionTime.toFixed(2)}s`);

    res.json({
      scenario,
      analysis_focus,
      timestamp: new Date().toISOString(),
      execution_time_seconds: executionTime,
      framework: 'Gemini API',
      crew_result: JSON.stringify(results, null, 2),
      agents_utilized,
      device_allocation: {
        finance: 'Cloud API',
        risk: 'Cloud API',
        compliance: 'Cloud API',
        market: 'Cloud API'
      },
      system_info: {
        platform: 'Node.js',
        ai_provider: 'Google Gemini',
        model: 'Gemini 1.5 Pro'
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
        duration: '30-60 seconds',
        use_case: 'Full business evaluation and strategy',
        output: 'Complete business assessment with all aspects covered',
        device_allocation: 'Cloud API (All Agents)'
      },
      financial: {
        description: 'Financial analysis and investment strategy',
        agents: ['finance'],
        duration: '10-20 seconds',
        use_case: 'Funding, revenue projections, financial planning',
        output: 'Detailed financial analysis and recommendations',
        device_allocation: 'Cloud API'
      },
      risk: {
        description: 'Risk assessment and mitigation strategies',
        agents: ['risk'],
        duration: '10-20 seconds',
        use_case: 'Risk management and contingency planning',
        output: 'Comprehensive risk analysis with mitigation plans',
        device_allocation: 'Cloud API'
      },
      compliance: {
        description: 'Legal and regulatory compliance analysis',
        agents: ['compliance'],
        duration: '10-20 seconds',
        use_case: 'Legal requirements and governance frameworks',
        output: 'Compliance roadmap and legal considerations',
        device_allocation: 'Cloud API'
      },
      market: {
        description: 'Market intelligence and competitive analysis',
        agents: ['market'],
        duration: '10-20 seconds',
        use_case: 'Market strategy, competition, and positioning',
        output: 'Market analysis with strategic recommendations',
        device_allocation: 'Cloud API'
      }
    },
    framework_info: {
      orchestration: 'Node.js Express Server',
      process: 'Parallel processing with Gemini API',
      optimization: 'Cloud-based AI (Google Gemini)',
      version: 'Gemini 1.5 Pro'
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
      api_optimization: 'All agents use Gemini API for consistent high-quality analysis'
    }
  });
});

// System info endpoint
app.get('/system/info', (req, res) => {
  res.json({
    framework: 'Gemini API',
    orchestration: 'Node.js Express Server',
    architecture: 'Cloud-based Multi-Agent System',
    optimization: {
      api_provider: 'Google Gemini',
      model: 'Gemini 1.5 Pro',
      parallel_processing: true,
      memory_enabled: false,
      planning_enabled: false,
      cloud_based: true
    },
    capabilities: {
      parallel_agent_coordination: true,
      structured_workflows: true,
      role_based_agents: true,
      cloud_ai: true,
      scalable: true,
      cost_effective: true
    },
    deployment: {
      backend: 'Node.js + Express',
      ai_framework: 'Google Generative AI',
      model: 'Gemini 1.5 Pro',
      datasets: 'TATA Real Datasets (Financial, Legal, Market, Social)',
      data_integration: 'Context-embedded prompts',
      node_version: process.version,
      platform: process.platform
    },
    performance: {
      comprehensive_analysis: '30-60 seconds',
      single_agent_analysis: '10-20 seconds',
      api_acceleration: 'Google Cloud Infrastructure',
      concurrent_requests: 'Supported'
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

      ws.send(JSON.stringify({
        type: 'analysis_started',
        scenario,
        framework: 'Gemini API',
        analysis_focus,
        timestamp: new Date().toISOString()
      }));

      const startTime = Date.now();
      let results = {};
      let agents_utilized = [];

      if (analysis_focus === 'comprehensive') {
        const [finance, risk, compliance, market] = await Promise.all([
          callGeminiAgent('finance', scenario),
          callGeminiAgent('risk', scenario),
          callGeminiAgent('compliance', scenario),
          callGeminiAgent('market', scenario)
        ]);
        results = { finance, risk, compliance, market };
        agents_utilized = ['Finance', 'Risk', 'Compliance', 'Market'];
      } else {
        const result = await callGeminiAgent(analysis_focus, scenario);
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
  console.log('\n🚀 Four Pillars AI Backend - Gemini API');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Provider: Google Gemini (${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing API Key'})`);
  console.log(`💡 Model: Gemini 1.5 Pro`);
  console.log(`\n📚 Available Endpoints:`);
  console.log(`   GET  /              - API information`);
  console.log(`   GET  /health        - Health check`);
  console.log(`   GET  /status        - Detailed system status`);
  console.log(`   POST /analyze       - Run business analysis`);
  console.log(`   GET  /analyze/types - Get analysis types`);
  console.log(`   GET  /examples      - Get example scenarios`);
  console.log(`   GET  /system/info   - Get system information`);
  console.log(`   WS   /ws            - WebSocket real-time updates`);
  console.log(`\n✨ Ready to analyze business scenarios!\n`);
});
