// API service for connecting to Gemini-powered backend
const API_BASE_URL = 'http://localhost:8000';

export interface AnalysisRequest {
  scenario: string;
  analysis_focus: string;
}

export interface AgentAnalysis {
  agent_name: string;
  confidence: number;
  recommendation: string;
  analysis: string;
  risk_level?: string;
  financial_impact?: string;
  compliance_status?: string;
  market_sentiment?: string;
}

export interface AnalysisResponse {
  analysis_id?: string;
  scenario: string;
  analysis_focus: string;
  timestamp: string;
  execution_time_seconds: number;
  framework: string;
  crew_result: string;
  agents_utilized: string[];
  device_allocation: Record<string, any>;
  system_info: Record<string, any>;
  performance_metrics: Record<string, any>;
  overall_confidence?: number;
  agents?: AgentAnalysis[];
  summary?: {
    recommendation: string;
    confidence: number;
    key_insights: string[];
  };
}

class APIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Main analysis endpoint
  async analyzeScenario(scenario: string, analysisFocus: string = 'comprehensive'): Promise<AnalysisResponse> {
    const request: AnalysisRequest = {
      scenario,
      analysis_focus: analysisFocus
    };

    console.log('🚀 Starting API call to /analyze with request:', request);

    try {
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 API Response received:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Response data:', data);
      console.log('🔍 Full response structure:', JSON.stringify(data, null, 2));
      console.log('🔍 Agents in response:', data.agents);
      console.log('🔍 Response keys:', Object.keys(data));
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw new Error(`Failed to analyze scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Get system status
  async getSystemStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/status`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }

  // Get analysis types
  async getAnalysisTypes(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/analyze/types`);
      
      if (!response.ok) {
        throw new Error(`Failed to get analysis types: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get analysis types:', error);
      throw error;
    }
  }

  // Get example scenarios
  async getExamples(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/examples`);
      
      if (!response.ok) {
        throw new Error(`Failed to get examples: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get examples:', error);
      throw error;
    }
  }

  // Get analysis history
  async getAnalysisHistory(limit?: number): Promise<any> {
    try {
      const url = limit ? `${this.baseURL}/history?limit=${limit}` : `${this.baseURL}/history`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to get analysis history: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get analysis history:', error);
      throw error;
    }
  }

  // Clear analysis history
  async clearAnalysisHistory(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/history`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear analysis history: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to clear analysis history:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;
