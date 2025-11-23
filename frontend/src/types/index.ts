export interface KpiMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'analyzing' | 'inactive';
  performance: number;
  decisionsAnalyzed: number;
}

export interface DetailedAgentAnalysis {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  costImpact?: string;
  revenueImpact?: string;
  roiEstimate?: string;
  budgetRequired?: string;
  riskScore?: string;
  successProbability?: string;
  riskFactors?: string[];
  complianceScore?: string;
  legalConsiderations?: string[];
  marketOpportunity?: string;
  marketTrends?: string[];
  recommendation: string;
}

export interface Decision {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'pending';
  confidence: number;
  createdAt: string;
  agents: AgentAnalysis[];
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

export interface SystemHealth {
  overall: number;
  activeAgents: number;
  processingPower: number;
  systemLoad: number;
}
