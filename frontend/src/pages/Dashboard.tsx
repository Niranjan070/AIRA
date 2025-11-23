import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { DecisionTable } from '@/components/ui/DecisionTable';
import { CreateDecisionModal } from '@/components/ui/CreateDecisionModal';
import { SystemStatus } from '@/components/SystemStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import { Decision, KpiMetric } from '@/types';
import { useAgents } from '@/contexts/AgentContext';
import { initialKpiMetrics } from '@/data/mockData';

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const [currentKpiMetrics, setCurrentKpiMetrics] = useState<KpiMetric[]>(initialKpiMetrics);
  const [totalAnalysisCount, setTotalAnalysisCount] = useState(0);
  const [totalConfidence, setTotalConfidence] = useState(0);
  
  const { agents, completedAnalyses } = useAgents();

  // Load persisted data on component mount - after AgentContext has loaded
  useEffect(() => {
    // Small delay to ensure AgentContext data is loaded first
    const timer = setTimeout(() => {
      loadPersistedData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    saveDataToLocalStorage();
  }, [allDecisions, totalAnalysisCount, totalConfidence]);

  // Update KPI metrics when real analyses are completed (primary source of truth)
  useEffect(() => {
    updateKpiMetricsFromRealData();
  }, [completedAnalyses, agents]);

  // Secondary effect to sync with persisted data after AgentContext loads
  useEffect(() => {
    if (completedAnalyses.length > 0 || agents.some(a => a.status === 'active')) {
      console.log('📊 Syncing Dashboard with AgentContext data');
      updateKpiMetricsFromRealData();
    }
  }, [completedAnalyses.length, agents]);

  // Load persisted data from localStorage
  const loadPersistedData = () => {
    try {
      console.log('📊 Loading Dashboard persisted data...');
      const savedDecisions = localStorage.getItem('aira_dashboard_decisions');
      const savedAnalysisCount = localStorage.getItem('aira_dashboard_analysis_count');
      const savedConfidence = localStorage.getItem('aira_dashboard_total_confidence');

      if (savedDecisions) {
        const decisions = JSON.parse(savedDecisions);
        setAllDecisions(decisions);
        console.log(`📊 Loaded ${decisions.length} decisions from localStorage`);
      } else {
        console.log('📊 No saved decisions found');
      }

      if (savedAnalysisCount) {
        const count = parseInt(savedAnalysisCount);
        setTotalAnalysisCount(count);
        console.log(`📊 Loaded analysis count: ${count}`);
      }

      if (savedConfidence) {
        const confidence = parseInt(savedConfidence);
        setTotalConfidence(confidence);
        console.log(`📊 Loaded total confidence: ${confidence}`);
      }

      console.log('✅ Dashboard data restored from localStorage');
      
      // Immediately sync with AgentContext if data is available
      setTimeout(() => {
        console.log('📊 Post-load sync with AgentContext');
        updateKpiMetricsFromRealData();
      }, 200);
      
    } catch (error) {
      console.warn('⚠️ Failed to load persisted dashboard data:', error);
    }
  };

  // Save data to localStorage
  const saveDataToLocalStorage = () => {
    try {
      localStorage.setItem('aira_dashboard_decisions', JSON.stringify(allDecisions));
      localStorage.setItem('aira_dashboard_analysis_count', totalAnalysisCount.toString());
      localStorage.setItem('aira_dashboard_total_confidence', totalConfidence.toString());
    } catch (error) {
      console.warn('⚠️ Failed to save dashboard data to localStorage:', error);
    }
  };

  // Function to update KPI metrics from real Four Pillars AI analysis data
  const updateKpiMetricsFromRealData = () => {
    console.log('📊 Updating KPI metrics from real data...');
    console.log('Completed analyses:', completedAnalyses.length);
    console.log('Agents:', agents.map(a => ({ id: a.id, status: a.status, score: a.performanceScore })));
    
    const totalAnalyses = completedAnalyses.length;
    
    // Calculate real average confidence from completed analyses
    const avgConfidence = totalAnalyses > 0 
      ? Math.round(completedAnalyses.reduce((sum, analysis) => {
          // Extract confidence from real analysis data
          const confidence = analysis.overall_confidence || 
                           analysis.summary?.confidence || 
                           (analysis.performance_metrics?.overall_confidence * 100) || 
                           85; // fallback
          return sum + confidence;
        }, 0) / totalAnalyses)
      : 0;
    
    // Count active agents from real agent status
    const activeAgentCount = agents.filter(agent => agent.status === 'active').length;
    const analyzingAgentCount = agents.filter(agent => agent.status === 'analyzing').length;
    
    // Calculate system health based on real activity
    const systemHealth = totalAnalyses > 0 ? Math.min(95, 60 + (totalAnalyses * 5) + (activeAgentCount * 10)) : 0;
    
    // Create real metrics from actual analysis data
    const realMetrics: KpiMetric[] = [
      {
        title: 'Total Analyses',
        value: totalAnalyses.toString(),
        change: totalAnalyses > totalAnalysisCount ? `+${totalAnalyses - totalAnalysisCount}` : totalAnalyses > 0 ? 'real data' : '0',
        trend: totalAnalyses > totalAnalysisCount ? 'up' : totalAnalyses > 0 ? 'up' : 'neutral',
      },
      {
        title: 'Avg Confidence',
        value: `${avgConfidence}%`,
        change: avgConfidence > totalConfidence ? `+${avgConfidence - totalConfidence}%` : avgConfidence > 0 ? 'AI-powered' : '0%',
        trend: avgConfidence > totalConfidence ? 'up' : avgConfidence > 0 ? 'up' : 'neutral',
      },
      {
        title: 'Active Agents',
        value: activeAgentCount.toString(),
        change: analyzingAgentCount > 0 ? `${analyzingAgentCount} analyzing` : activeAgentCount > 0 ? 'active' : 'ready',
        trend: activeAgentCount > 0 ? 'up' : 'neutral',
      },
      {
        title: 'System Health',
        value: `${systemHealth}%`,
        change: totalAnalyses > 0 ? 'AI-powered' : 'ready',
        trend: systemHealth > 80 ? 'up' : totalAnalyses > 0 ? 'neutral' : 'neutral',
      },
    ];
    
    console.log('📊 New KPI metrics:', realMetrics);
    setCurrentKpiMetrics(realMetrics);
    setTotalAnalysisCount(totalAnalyses);
    setTotalConfidence(avgConfidence);
  };

  const handleNewDecision = () => {
    setIsModalOpen(true);
  };

  // Clear all persisted data (for testing/debugging)
  const clearAllPersistedData = () => {
    try {
      localStorage.removeItem('aira_dashboard_decisions');
      localStorage.removeItem('aira_dashboard_analysis_count');
      localStorage.removeItem('aira_dashboard_total_confidence');
      
      setAllDecisions([]);
      setTotalAnalysisCount(0);
      setTotalConfidence(0);
      setCurrentKpiMetrics(initialKpiMetrics);
      
      console.log('🗑️ Cleared all Dashboard persisted data');
    } catch (error) {
      console.warn('⚠️ Failed to clear persisted data:', error);
    }
  };

  // Make clear function available globally for debugging
  useEffect(() => {
    (window as any).clearDashboardData = clearAllPersistedData;
    console.log('🔧 Dashboard data persistence enabled. Use window.clearDashboardData() to reset.');
  }, []);

  // Legacy function to update KPI metrics when local decisions are added (still needed for decision creation)
  const updateKpiMetrics = (_decisions: Decision[]) => {
    // This will trigger updateKpiMetricsFromRealData through the useEffect
    // when analyses complete, so we just update real metrics directly
    updateKpiMetricsFromRealData();
  };

  const handleCreateDecision = (newDecision: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    deadline: string;
    agents: string[];
    analysisResult?: any;
  }) => {
    console.log('🎯 Creating new decision:', newDecision);
    
    const decision: Decision = {
      id: String(allDecisions.length + 1),
      title: newDecision.title,
      priority: newDecision.priority,
      status: 'active',
      confidence: newDecision.analysisResult ? 
        Math.round(newDecision.analysisResult.summary?.confidence || newDecision.analysisResult.overall_confidence || 85) : 
        Math.floor(Math.random() * 20) + 75, // Fallback to random if no analysis
      createdAt: new Date().toISOString(), // Use ISO string for better date handling
      agents: newDecision.analysisResult?.agents || [], // Use real analysis data or empty array
    };

    console.log('🎯 Created decision object:', decision);
    
    const updatedDecisions = [decision, ...allDecisions];
    console.log('🎯 All decisions after update:', updatedDecisions);
    console.log('🎯 Total decisions count:', updatedDecisions.length);
    
    setAllDecisions(updatedDecisions);
    updateKpiMetrics(updatedDecisions);
    
    // Close modal
    setIsModalOpen(false);
    
    // Show success message or redirect to analysis view
    console.log('✅ New decision created with analysis:', newDecision.analysisResult);
  };

  const activeDecisions = allDecisions.filter(d => d.status === 'active');
  const completedDecisions = allDecisions.filter(d => d.status === 'completed');

  // Debug logging for decisions
  console.log('📊 Dashboard state:', {
    allDecisionsCount: allDecisions.length,
    activeDecisionsCount: activeDecisions.length,
    completedDecisionsCount: completedDecisions.length,
    allDecisions: allDecisions
  });

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          title="Executive Dashboard"
          subtitle="Real-time insights from your AI decision ecosystem"
          ctaLabel="New Strategic Decision"
          onCtaClick={handleNewDecision}
        />
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* KPI Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
            >
              {currentKpiMetrics.map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <KpiCard metric={metric} />
                </motion.div>
              ))}
            </motion.div>

            {/* System Status Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <SystemStatus />
                </div>
                <div className="lg:col-span-2">
                  <Card className="glass-card border-2 border-white/20 h-full">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Live Agent Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {agents.map((agent) => {
                          const agentIcons = {
                            finance: DollarSign,
                            risk: Shield,
                            compliance: AlertTriangle,
                            market: TrendingUp
                          };
                          
                          const agentColors = {
                            finance: 'text-green-600',
                            risk: 'text-blue-600',
                            compliance: 'text-yellow-600',
                            market: 'text-purple-600'
                          };
                          
                          const IconComponent = agentIcons[agent.id as keyof typeof agentIcons];
                          const statusColors = {
                            active: 'bg-green-100 text-green-800 border-green-200',
                            analyzing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                            inactive: 'bg-gray-100 text-gray-800 border-gray-200'
                          };
                          
                          return (
                            <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                              <IconComponent className={`w-5 h-5 ${agentColors[agent.id as keyof typeof agentColors]}`} />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-black">{agent.name} Agent</div>
                                <Badge className={statusColors[agent.status]}>
                                  {agent.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>

            {/* Agent Performance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-bold text-black mb-4">Agent Performance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map((agent, index) => {
                  const agentIcons = {
                    finance: '💰',
                    risk: '�️', 
                    compliance: '⚖️',
                    market: '📈'
                  };
                  
                  const agentColors = {
                    finance: 'text-green-500',
                    risk: 'text-blue-500',
                    compliance: 'text-yellow-500',
                    market: 'text-purple-500'
                  };
                  
                  const agentDescriptions = {
                    finance: 'Financial analysis and risk assessment',
                    risk: 'Risk evaluation and mitigation strategies',
                    compliance: 'Regulatory compliance and legal review',
                    market: 'Market analysis and competitive intelligence'
                  };
                  
                  const statusColors = {
                    active: 'bg-green-100 text-green-700',
                    analyzing: 'bg-yellow-100 text-yellow-700',
                    inactive: 'bg-gray-100 text-gray-500'
                  };
                  
                  return (
                    <motion.div
                      key={agent.id}
                      className="glass-card hover-lift p-4 rounded-xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 glass rounded-lg flex items-center justify-center mr-3">
                          <span className={`${agentColors[agent.id as keyof typeof agentColors]} text-lg`}>
                            {agentIcons[agent.id as keyof typeof agentIcons]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-base text-black">{agent.name}</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[agent.status]}`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {agentDescriptions[agent.id as keyof typeof agentDescriptions]}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Performance</span>
                          <span className="font-bold text-black text-sm">{agent.performanceScore || 0}%</span>
                        </div>
                        <div className="w-full h-2 glass rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out rounded-full" 
                            style={{ width: `${agent.performanceScore || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Decisions Analyzed</span>
                          <span className="font-bold text-black text-sm">{agent.decisionsAnalyzed || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Strategic Decisions Section */}
            {allDecisions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center py-12"
              >
                <Card className="glass-card border-2 border-white/20 max-w-md mx-auto">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-black">No Strategic Decisions Yet</h3>
                      <p className="text-gray-600">
                        Click "New Strategic Decision" to create your first AI-powered analysis
                      </p>
                      <button
                        onClick={handleNewDecision}
                        className="accent-button px-6 py-2 rounded-lg transition-colors duration-200 hover:bg-green-600"
                      >
                        Create Your First Decision
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="glass-card interactive-border hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-black flex items-center gap-2 text-lg">
                      <span className="text-yellow-500">⚡</span>
                      Active Strategic Decisions ({activeDecisions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    <DecisionTable decisions={activeDecisions} />
                  </CardContent>
                </Card>

                <Card className="glass-card interactive-border hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-black flex items-center gap-2 text-lg">
                      <span className="text-green-500">✓</span>
                      Recent Completions ({completedDecisions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    <DecisionTable decisions={completedDecisions} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <CreateDecisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateDecision={handleCreateDecision}
      />
    </div>
  );
}