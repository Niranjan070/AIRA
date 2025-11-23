import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'analyzing' | 'inactive';
  lastUsed?: Date;
  performanceScore?: number;
  decisionsAnalyzed?: number;
}

export interface AgentAnalysisData {
  agent: string;
  model?: string;
  analysis?: string;
  confidence?: number;
  metrics?: Record<string, any>;
  real_data?: Record<string, any>;
  [key: string]: any;
}

interface AgentContextType {
  agents: AgentStatus[];
  latestAnalysisData: Record<string, AgentAnalysisData>;
  completedAnalyses: any[];
  updateAgentStatus: (agentId: string, status: 'active' | 'analyzing' | 'inactive') => void;
  updateAgentPerformance: (agentId: string, score: number) => void;
  incrementAgentUsage: (agentId: string) => void;
  resetAllAgents: () => void;
  testAgentUpdates: () => void;
  setAnalysisData: (agentId: string, data: AgentAnalysisData) => void;
  addCompletedAnalysis: (analysis: any) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Initial agent state - all inactive until used
const initialAgents: AgentStatus[] = [
  {
    id: 'finance',
    name: 'Finance',
    status: 'inactive',
    performanceScore: 0,
    decisionsAnalyzed: 0
  },
  {
    id: 'risk',
    name: 'Risk',
    status: 'inactive',
    performanceScore: 0,
    decisionsAnalyzed: 0
  },
  {
    id: 'compliance',
    name: 'Compliance',
    status: 'inactive',
    performanceScore: 0,
    decisionsAnalyzed: 0
  },
  {
    id: 'market',
    name: 'Market',
    status: 'inactive',
    performanceScore: 0,
    decisionsAnalyzed: 0
  }
];

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [latestAnalysisData, setLatestAnalysisData] = useState<Record<string, AgentAnalysisData>>({});
  const [completedAnalyses, setCompletedAnalyses] = useState<any[]>([]);

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedAgentData();
  }, []);

  // Save agent data whenever it changes
  useEffect(() => {
    saveAgentDataToLocalStorage();
  }, [agents, completedAnalyses, latestAnalysisData]);

  // Load persisted agent data from localStorage
  const loadPersistedAgentData = () => {
    try {
      const savedAgents = localStorage.getItem('aira_agent_status');
      const savedAnalyses = localStorage.getItem('aira_completed_analyses');
      const savedAnalysisData = localStorage.getItem('aira_latest_analysis_data');

      if (savedAgents) {
        const agentData = JSON.parse(savedAgents);
        setAgents(agentData);
        console.log('📊 Loaded agent status from localStorage');
      }

      if (savedAnalyses) {
        const analysesData = JSON.parse(savedAnalyses);
        setCompletedAnalyses(analysesData);
        console.log(`📊 Loaded ${analysesData.length} completed analyses from localStorage`);
      }

      if (savedAnalysisData) {
        const analysisData = JSON.parse(savedAnalysisData);
        setLatestAnalysisData(analysisData);
        console.log('📊 Loaded latest analysis data from localStorage');
      }

      console.log('✅ Agent data restored from localStorage');
    } catch (error) {
      console.warn('⚠️ Failed to load persisted agent data:', error);
    }
  };

  // Save agent data to localStorage
  const saveAgentDataToLocalStorage = () => {
    try {
      localStorage.setItem('aira_agent_status', JSON.stringify(agents));
      localStorage.setItem('aira_completed_analyses', JSON.stringify(completedAnalyses));
      localStorage.setItem('aira_latest_analysis_data', JSON.stringify(latestAnalysisData));
    } catch (error) {
      console.warn('⚠️ Failed to save agent data to localStorage:', error);
    }
  };

  const updateAgentStatus = (agentId: string, status: 'active' | 'analyzing' | 'inactive') => {
    console.log(`AgentContext: Updating agent ${agentId} to status ${status}`);
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status, lastUsed: status === 'active' ? new Date() : agent.lastUsed }
        : agent
    ));
  };

  const updateAgentPerformance = (agentId: string, score: number) => {
    console.log(`AgentContext: Updating agent ${agentId} performance to ${score}`);
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, performanceScore: score }
        : agent
    ));
  };

  const incrementAgentUsage = (agentId: string) => {
    console.log(`AgentContext: Incrementing usage for agent ${agentId}`);
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { 
            ...agent, 
            decisionsAnalyzed: (agent.decisionsAnalyzed || 0) + 1,
            lastUsed: new Date()
          }
        : agent
    ));
  };

  const setAnalysisData = (agentId: string, data: AgentAnalysisData) => {
    console.log(`AgentContext: Setting analysis data for agent ${agentId}`, data);
    setLatestAnalysisData(prev => ({
      ...prev,
      [agentId]: data
    }));
  };

  const addCompletedAnalysis = (analysis: any) => {
    console.log('AgentContext: Adding completed analysis for Reports', analysis);
    setCompletedAnalyses(prev => [analysis, ...prev.slice(0, 99)]);
  };

  const resetAllAgents = () => {
    setAgents(initialAgents);
    setLatestAnalysisData({});
    setCompletedAnalyses([]);
    
    try {
      localStorage.removeItem('aira_agent_status');
      localStorage.removeItem('aira_completed_analyses');
      localStorage.removeItem('aira_latest_analysis_data');
      localStorage.removeItem('aira_dashboard_decisions');
      localStorage.removeItem('aira_dashboard_analysis_count');
      localStorage.removeItem('aira_dashboard_total_confidence');
      localStorage.removeItem('aira_analysis_history');
      console.log('🗑️ Cleared all persisted data from localStorage');
    } catch (error) {
      console.warn('⚠️ Failed to clear localStorage:', error);
    }
  };

  const testAgentUpdates = () => {
    console.log('🧪 Testing agent updates...');
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status: 'active' as const,
      performanceScore: Math.floor(Math.random() * 40) + 60,
      decisionsAnalyzed: Math.floor(Math.random() * 5) + 1,
      lastUsed: new Date()
    })));
  };

  return (
    <AgentContext.Provider value={{
      agents,
      latestAnalysisData,
      completedAnalyses,
      updateAgentStatus,
      updateAgentPerformance,
      incrementAgentUsage,
      resetAllAgents,
      testAgentUpdates,
      setAnalysisData,
      addCompletedAnalysis
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
}
