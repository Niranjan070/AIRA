import { KpiMetric, Agent, Decision, SystemHealth, DetailedAgentAnalysis } from '@/types';

// Initial empty state for KPI metrics
export const initialKpiMetrics: KpiMetric[] = [
  {
    title: 'Total Decisions',
    value: '0',
    change: '0%',
    trend: 'neutral',
  },
  {
    title: 'Avg Confidence',
    value: '0%',
    change: '0%',
    trend: 'neutral',
  },
  {
    title: 'Active Agents',
    value: '4',
    change: '0%',
    trend: 'neutral',
  },
  {
    title: 'System Health',
    value: '0%',
    change: '0%',
    trend: 'neutral',
  },
];

// Keep the old data for reference/fallback (you can remove this later)
export const kpiMetrics: KpiMetric[] = [
  {
    title: 'Total Decisions',
    value: '156',
    change: '+12%',
    trend: 'up',
  },
  {
    title: 'Avg Confidence',
    value: '89%',
    change: '+3%',
    trend: 'up',
  },
  {
    title: 'Active Agents',
    value: '4',
    change: '0%',
    trend: 'neutral',
  },
  {
    title: 'System Health',
    value: '94%',
    change: '+2%',
    trend: 'up',
  },
];

export const agents: Agent[] = [
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial analysis and risk assessment',
    icon: 'DollarSign',
    status: 'active',
    performance: 95,
    decisionsAnalyzed: 64,
  },
  {
    id: 'risk',
    name: 'Risk',
    description: 'Risk evaluation and mitigation strategies',
    icon: 'Shield',
    status: 'analyzing',
    performance: 87,
    decisionsAnalyzed: 42,
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'Regulatory compliance and legal review',
    icon: 'AlertTriangle',
    status: 'active',
    performance: 92,
    decisionsAnalyzed: 38,
  },
  {
    id: 'market',
    name: 'Market',
    description: 'Market analysis and competitive intelligence',
    icon: 'TrendingUp',
    status: 'active',
    performance: 89,
    decisionsAnalyzed: 29,
  },
];

// Detailed agent analysis for specific decisions
export const getDetailedAgentAnalysis = (decisionId: string): DetailedAgentAnalysis[] => {
  const analysisMap: Record<string, DetailedAgentAnalysis[]> = {
    '1': [ // "starting an shoe factory outlet in south africa" decision
      {
        id: 'finance',
        name: 'Finance Agent',
        icon: 'DollarSign',
        iconColor: 'text-green-500',
        costImpact: '$5,000,000',
        revenueImpact: '$10,000,000',
        roiEstimate: '0.2%',
        budgetRequired: '$7,000,000',
        recommendation: 'Conduct a detailed financial feasibility study to refine budget estimates and assess potential profitability.'
      },
      {
        id: 'risk',
        name: 'Risk Agent',
        icon: 'AlertTriangle',
        iconColor: 'text-orange-500',
        riskScore: '7/100',
        successProbability: '0.75%',
        riskFactors: ['Political instability', 'Supply chain disruptions', 'Economic downturns'],
        recommendation: 'Develop a comprehensive risk management plan to address identified risks and enhance project resilience.'
      },
      {
        id: 'compliance',
        name: 'Compliance Agent',
        icon: 'Shield',
        iconColor: 'text-blue-500',
        complianceScore: '8/100',
        legalConsiderations: ['Non-compliance penalties', 'Intellectual property disputes'],
        recommendation: 'Engage local legal experts to navigate regulatory requirements and ensure full compliance.'
      },
      {
        id: 'market',
        name: 'Market Agent',
        icon: 'TrendingUp',
        iconColor: 'text-purple-500',
        marketOpportunity: '0.3/100',
        marketTrends: ['Growing middle-class consumer base', 'Increasing demand for affordable footwear'],
        recommendation: 'Leverage market research to identify underserved segments and tailor offerings accordingly.'
      }
    ],
    '2': [ // Default analysis for other decisions
      {
        id: 'finance',
        name: 'Finance Agent',
        icon: 'DollarSign',
        iconColor: 'text-green-500',
        costImpact: '$2,500,000',
        revenueImpact: '$8,500,000',
        roiEstimate: '15.2%',
        budgetRequired: '$3,200,000',
        recommendation: 'Financial projections look favorable. Recommend proceeding with phased implementation approach.'
      },
      {
        id: 'risk',
        name: 'Risk Agent',
        icon: 'AlertTriangle',
        iconColor: 'text-orange-500',
        riskScore: '4/100',
        successProbability: '85%',
        riskFactors: ['Market competition', 'Regulatory changes'],
        recommendation: 'Risk levels are manageable. Implement monitoring protocols for identified risk factors.'
      }
    ]
  };
  
  return analysisMap[decisionId] || analysisMap['2'];
};

export const decisions: Decision[] = [
  {
    id: '1',
    title: 'starting an shoe factory outlet in south africa',
    priority: 'high',
    status: 'active',
    confidence: 92,
    createdAt: '1/15/2025',
    agents: [
      {
        agent_name: 'Finance Agent',
        confidence: 89,
        recommendation: 'Consider market entry costs and revenue projections',
        analysis: 'Initial investment analysis shows positive ROI potential'
      },
      {
        agent_name: 'Risk Agent',
        confidence: 75,
        recommendation: 'Evaluate regulatory and market risks',
        analysis: 'Moderate risk level due to regional market conditions'
      },
      {
        agent_name: 'Compliance Agent',
        confidence: 95,
        recommendation: 'Ensure local business registration compliance',
        analysis: 'Clear regulatory framework for foreign business entities'
      }
    ],
  },
  {
    id: '2',
    title: 'New Market Expansion Plan',
    priority: 'medium',
    status: 'completed',
    confidence: 87,
    createdAt: '1/14/2025',
    agents: [
      {
        agent_name: 'Market Agent',
        confidence: 90,
        recommendation: 'Strong market opportunity identified',
        analysis: 'Target demographic shows high demand for product category'
      },
      {
        agent_name: 'Finance Agent',
        confidence: 85,
        recommendation: 'Positive financial outlook with moderate investment',
        analysis: 'Cost-benefit analysis shows 18-month break-even period'
      },
      {
        agent_name: 'Risk Agent',
        confidence: 82,
        recommendation: 'Low to moderate risk assessment',
        analysis: 'Competitive landscape manageable with differentiation strategy'
      }
    ],
  },
  {
    id: '3',
    title: 'Compliance Framework Update',
    priority: 'high',
    status: 'pending',
    confidence: 78,
    createdAt: '1/13/2025',
    agents: [
      {
        agent_name: 'Compliance Agent',
        confidence: 85,
        recommendation: 'Update framework to meet new regulatory standards',
        analysis: 'Current framework needs modernization for emerging regulations'
      },
      {
        agent_name: 'Risk Agent',
        confidence: 70,
        recommendation: 'Assess compliance risk exposure',
        analysis: 'Non-compliance penalties could impact business operations'
      }
    ],
  },
  {
    id: '4',
    title: 'Technology Investment Strategy',
    priority: 'medium',
    status: 'active',
    confidence: 85,
    createdAt: '1/12/2025',
    agents: [
      {
        agent_name: 'Finance Agent',
        confidence: 88,
        recommendation: 'Allocate budget for strategic technology upgrades',
        analysis: 'ROI analysis shows positive returns on proposed tech investments'
      },
      {
        agent_name: 'Market Agent',
        confidence: 82,
        recommendation: 'Technology aligns with market trends',
        analysis: 'Competitive advantage through strategic technology adoption'
      }
    ],
  },
  {
    id: '5',
    title: 'Operational Efficiency Initiative',
    priority: 'low',
    status: 'completed',
    confidence: 91,
    createdAt: '1/11/2025',
    agents: [
      {
        agent_name: 'Finance Agent',
        confidence: 93,
        recommendation: 'Cost savings identified through process optimization',
        analysis: 'Efficiency improvements show 15% cost reduction potential'
      },
      {
        agent_name: 'Compliance Agent',
        confidence: 89,
        recommendation: 'Process changes meet regulatory requirements',
        analysis: 'New operational procedures comply with industry standards'
      }
    ],
  },
];

export const systemHealth: SystemHealth = {
  overall: 94,
  activeAgents: 3,
  processingPower: 87,
  systemLoad: 72,
};

export const chartData = {
  priorityDistribution: [
    { name: 'High', value: 45, fill: '#ef4444' },
    { name: 'Medium', value: 78, fill: '#3b82f6' },
    { name: 'Low', value: 32, fill: '#6b7280' },
  ],
  statusBreakdown: [
    { name: 'Active', value: 23, fill: '#10b981' },
    { name: 'Completed', value: 67, fill: '#3b82f6' },
    { name: 'Pending', value: 12, fill: '#f59e0b' },
  ],
  confidenceOverTime: [
    { month: 'Jan', confidence: 85 },
    { month: 'Feb', confidence: 88 },
    { month: 'Mar', confidence: 92 },
    { month: 'Apr', confidence: 89 },
    { month: 'May', confidence: 94 },
    { month: 'Jun', confidence: 91 },
  ],
};