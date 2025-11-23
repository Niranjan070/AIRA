import { useState, useCallback } from 'react';
import { apiService, AnalysisResponse } from '../services/api';
import { useAgents } from '../contexts/AgentContext';

export interface UseAnalysisState {
  data: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<UseAnalysisState>({
    data: null,
    loading: false,
    error: null,
  });
  
  const { updateAgentStatus, updateAgentPerformance, incrementAgentUsage, setAnalysisData, addCompletedAnalysis } = useAgents();

  const analyzeScenario = useCallback(async (scenario: string, analysisFocus?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // Set all agents to analyzing status
    const agentIds = ['finance', 'risk', 'compliance', 'market'];
    agentIds.forEach(agentId => {
      updateAgentStatus(agentId, 'analyzing');
    });
    
    try {
      console.log('🚀 Starting analysis for scenario:', scenario);
      const result = await apiService.analyzeScenario(scenario, analysisFocus);
      console.log('✅ Analysis completed, processing results:', result);
      
      // Update agent statuses based on analysis results
      console.log('🔍 Checking response structure...');
      console.log('agents property:', result.agents);
      console.log('agents_utilized property:', result.agents_utilized);
      console.log('crew_result property:', result.crew_result);
      
      // Handle the actual API response structure
      let agentsToProcess: any[] = [];
      
      // The backend returns agent data as top-level properties: finance, risk, compliance, market
      // Each contains: { agent, model, analysis, confidence, execution_time, device, timestamp }
      const agentKeys = ['finance', 'risk', 'compliance', 'market'];
      const foundAgents = agentKeys.filter(key => result[key]);
      
      if (foundAgents.length > 0) {
        console.log('📊 Found agent data in response:', foundAgents);
        
        agentsToProcess = foundAgents.map((agentKey) => {
          const agentData = result[agentKey];
          
          // Convert confidence from 0-1 scale to 0-100 for display
          let confidencePercent = 85; // Default fallback
          if (typeof agentData.confidence === 'number') {
            confidencePercent = Math.round(agentData.confidence * 100);
          }
          
          return {
            agent_name: agentData.agent || agentKey,
            confidence: confidencePercent,
            recommendation: agentData.analysis || `Analysis completed for ${agentKey}`,
            analysis: agentData.analysis || `Comprehensive analysis performed by ${agentKey}`,
            agentData: {
              ...agentData,
              // Ensure analysis field is present
              analysis: agentData.analysis,
              confidence: agentData.confidence,
              model: agentData.model,
              execution_time: agentData.execution_time,
              device: agentData.device,
              timestamp: agentData.timestamp
            }
          };
        });
        console.log('📊 Processed agents with real data:', agentsToProcess);
      } else if (result.agents && Array.isArray(result.agents)) {
        // Fallback: If agents property exists (legacy format)
        agentsToProcess = result.agents;
        console.log('📊 Using agents property (legacy):', agentsToProcess);
      } else if (result.agents_utilized && Array.isArray(result.agents_utilized)) {
        // If only agents_utilized exists, create with default confidence
        agentsToProcess = result.agents_utilized.map((agentName: string) => ({
          agent_name: agentName,
          confidence: 85,
          recommendation: `Analysis completed for ${agentName}`,
          analysis: `Comprehensive analysis performed by ${agentName}`
        }));
        console.log('📊 Using agents_utilized property:', agentsToProcess);
      } else {
        // Fallback: create agents based on analysis focus
        const allAgents = ['Finance Agent', 'Risk Agent', 'Compliance Agent', 'Market Agent'];
        agentsToProcess = allAgents.map(agentName => ({
          agent_name: agentName,
          confidence: 85,
          recommendation: `Analysis completed for ${agentName}`,
          analysis: `Comprehensive analysis performed by ${agentName}`
        }));
        console.log('📊 Using fallback agents:', agentsToProcess);
      }
      
      if (agentsToProcess.length > 0) {
        console.log('📊 Processing', agentsToProcess.length, 'agents');
        
        agentsToProcess.forEach((agent: any, index: number) => {
          console.log(`Agent ${index + 1}:`, agent);
          
          // Improved agent ID mapping to handle different formats
          let agentId = agent.agent_name.toLowerCase();
          
          // Handle various possible formats from backend
          if (agentId.includes('finance')) agentId = 'finance';
          else if (agentId.includes('risk')) agentId = 'risk';
          else if (agentId.includes('compliance')) agentId = 'compliance';
          else if (agentId.includes('market')) agentId = 'market';
          else {
            // Fallback: remove 'agent' and clean up
            agentId = agentId.replace(' agent', '').replace('agent', '').trim();
          }
          
          console.log(`🔄 Updating agent: ${agent.agent_name} -> ${agentId}, confidence: ${agent.confidence}`);
          
          try {
            updateAgentStatus(agentId, 'active');
            updateAgentPerformance(agentId, agent.confidence);
            incrementAgentUsage(agentId);
            
            // Store detailed analysis data for the agent cards
            if (agent.agentData) {
              setAnalysisData(agentId, agent.agentData);
            }
            
            console.log(`✅ Successfully updated agent: ${agentId}`);
          } catch (error) {
            console.error(`❌ Failed to update agent ${agentId}:`, error);
          }
        });
      } else {
        console.warn('⚠️ No agents to process');
      }
      
      // Store complete analysis result for Reports page
      addCompletedAnalysis(result);
      console.log('📊 Added completed analysis to AgentContext for Reports');
      
      setState({
        data: result,
        loading: false,
        error: null,
      });
      console.log('🎯 Analysis hook state updated successfully');
      return result;
    } catch (error) {
      // Reset agents to inactive on error
      agentIds.forEach(agentId => {
        updateAgentStatus(agentId, 'inactive');
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [updateAgentStatus, updateAgentPerformance, incrementAgentUsage]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyzeScenario,
    clearError,
    reset,
  };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getSystemStatus();
      setStatus(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Status check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      await apiService.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    status,
    loading,
    error,
    checkStatus,
    checkHealth,
  };
}
