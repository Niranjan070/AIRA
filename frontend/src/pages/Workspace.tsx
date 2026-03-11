import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailedAgentCard } from '@/components/ui/DetailedAgentCard';
import { useAgents, StoredDecision } from '@/contexts/AgentContext';
import { useAnalysis } from '@/hooks/useAnalysis';
import { DetailedAgentAnalysis } from '@/types';

const analysisTypes = [
  { value: 'comprehensive', label: 'Comprehensive (All Agents)' },
  { value: 'financial', label: 'Financial Analysis' },
  { value: 'risk', label: 'Risk Assessment' },
  { value: 'compliance', label: 'Compliance Review' },
  { value: 'market', label: 'Market Intelligence' },
];

export default function Workspace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [scenario, setScenario] = useState('');
  const [analysisFocus, setAnalysisFocus] = useState('comprehensive');
  const { agents, latestAnalysisData, decisions, selectedDecisionId, setSelectedDecisionId, addDecision } = useAgents();
  const { analyzeScenario, loading, error } = useAnalysis();
  const navigate = useNavigate();

  // The currently viewed decision (if any)
  const selectedDecision = selectedDecisionId ? decisions.find(d => d.id === selectedDecisionId) : null;

  // Data to display: either from a selected decision or from live analysis
  const displayAgentData = selectedDecision ? selectedDecision.agentResults : latestAnalysisData;

  // Filter decisions by search term
  const filteredDecisions = decisions.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.scenario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load persisted search term on mount
  useEffect(() => {
    try {
      const savedSearchTerm = localStorage.getItem('aira_workspace_search_term');
      if (savedSearchTerm) {
        setSearchTerm(savedSearchTerm);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load workspace search term:', error);
    }
  }, []);

  // Save search term whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('aira_workspace_search_term', searchTerm);
    } catch (error) {
      console.warn('⚠️ Failed to save workspace search term:', error);
    }
  }, [searchTerm]);

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const handleAnalyze = async () => {
    if (!scenario.trim()) return;
    try {
      // Clear selected decision so we show live results
      setSelectedDecisionId(null);
      const result = await analyzeScenario(scenario.trim(), analysisFocus);

      // Auto-create a decision from this analysis
      if (result) {
        const agentResults: Record<string, any> = {};
        const agentKeys = ['finance', 'risk', 'compliance', 'market'];
        agentKeys.forEach(key => {
          if (result[key]) agentResults[key] = result[key];
        });

        // Calculate confidence
        const confidences = agentKeys
          .filter(k => result[k]?.confidence)
          .map(k => result[k].confidence);
        const avgConfidence = confidences.length > 0
          ? Math.round((confidences.reduce((s: number, c: number) => s + c, 0) / confidences.length) * 100)
          : 75;

        const newDecision: StoredDecision = {
          id: `decision-${Date.now()}`,
          title: scenario.trim().length > 60 ? scenario.trim().substring(0, 60) + '...' : scenario.trim(),
          description: scenario.trim(),
          scenario: scenario.trim(),
          priority: 'medium',
          status: 'active',
          confidence: avgConfidence,
          createdAt: new Date().toISOString(),
          analysisFocus,
          analysisResult: result,
          agentResults,
        };
        addDecision(newDecision);
        setSelectedDecisionId(newDecision.id);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  // Convert agent context data to detailed analysis format
  const getDetailedAgentAnalysisFromContext = (): DetailedAgentAnalysis[] => {
    return agents.map((agentData) => {
      const agentName = agentData.name + ' Agent';
      
      // Map agent types to appropriate icons and colors
      const iconMap: Record<string, string> = {
        finance: 'DollarSign',
        risk: 'AlertTriangle', 
        compliance: 'Shield',
        market: 'TrendingUp'
      };

      const colorMap: Record<string, string> = {
        finance: 'text-green-500',
        risk: 'text-orange-500',
        compliance: 'text-blue-500', 
        market: 'text-purple-500'
      };

      // Create detailed analysis based on agent type and real performance data
      const baseAnalysis: DetailedAgentAnalysis = {
        id: agentData.id,
        name: agentName,
        icon: iconMap[agentData.id] || 'TrendingUp',
        iconColor: colorMap[agentData.id] || 'text-gray-500',
        recommendation: `Based on current analysis with ${agentData.performanceScore || 0}% confidence, this agent provides strategic insights for decision making.`
      };

      // Add type-specific data based on real performance
      const performance = agentData.performanceScore || 0;
      const usageCount = agentData.decisionsAnalyzed || 0;

      if (agentData.id === 'finance') {
        return {
          ...baseAnalysis,
          costImpact: `$${(performance * 50000).toLocaleString()}`,
          revenueImpact: `$${(performance * 100000).toLocaleString()}`,
          roiEstimate: `${(performance * 0.2).toFixed(1)}%`,
          budgetRequired: `$${(performance * 70000).toLocaleString()}`,
          recommendation: `Financial analysis shows ${performance}% confidence. ${usageCount > 0 ? `Completed ${usageCount} analysis cycles.` : 'Ready for analysis.'}`
        };
      }

      if (agentData.id === 'risk') {
        return {
          ...baseAnalysis,
          riskScore: `${Math.max(1, Math.round((100 - performance) / 5))}/100`,
          successProbability: `${performance}%`,
          riskFactors: performance > 80 ? ['Low market risk', 'Minimal operational risk'] : 
                      performance > 60 ? ['Moderate market conditions', 'Standard operational risks'] :
                      ['High market volatility', 'Operational challenges', 'Regulatory uncertainty'],
          recommendation: `Risk assessment confidence: ${performance}%. ${usageCount > 0 ? `Analyzed ${usageCount} scenarios.` : 'Awaiting scenario input.'}`
        };
      }

      if (agentData.id === 'compliance') {
        return {
          ...baseAnalysis,
          complianceScore: `${Math.max(1, Math.round(performance / 5))}/100`,
          legalConsiderations: performance > 80 ? ['Regulatory compliance verified', 'Legal framework clear'] :
                              performance > 60 ? ['Standard compliance requirements', 'Legal review recommended'] :
                              ['Complex regulatory environment', 'Legal expert consultation required'],
          recommendation: `Compliance analysis confidence: ${performance}%. ${usageCount > 0 ? `Reviewed ${usageCount} compliance aspects.` : 'Ready for compliance review.'}`
        };
      }

      if (agentData.id === 'market') {
        return {
          ...baseAnalysis,
          marketOpportunity: `${Math.max(0.1, (performance / 50)).toFixed(1)}/100`,
          marketTrends: performance > 80 ? ['Strong market conditions', 'Positive growth trends'] :
                       performance > 60 ? ['Stable market environment', 'Moderate growth potential'] :
                       ['Challenging market conditions', 'Market analysis required'],
          recommendation: `Market analysis confidence: ${performance}%. ${usageCount > 0 ? `Evaluated ${usageCount} market scenarios.` : 'Awaiting market data.'}`
        };
      }

      return baseAnalysis;
    });
  };

  // Calculate overall confidence based on agent performance (only agents with data)
  const getOverallConfidence = (): number => {
    const activePerformances = agents
      .filter(agent => (agent.performanceScore || 0) > 0)
      .map(agent => agent.performanceScore || 0);
    return activePerformances.length > 0 
      ? Math.round(activePerformances.reduce((sum, perf) => sum + perf, 0) / activePerformances.length)
      : 0;
  };

  // Get active agents count
  const getActiveAgentsCount = (): number => {
    return agents.filter(agent => agent.status === 'active').length;
  };

  const analysisData = getDetailedAgentAnalysisFromContext();
  const overallConfidence = getOverallConfidence();
  const activeAgentsCount = getActiveAgentsCount();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel - Decision History */}
      <div className="w-72 glass border-r-2 border-white/20 p-4 overflow-auto">
        <h3 className="font-semibold text-black mb-4 text-lg">Decision History</h3>
        
        <div className="space-y-3 mb-4">
          <Input
            placeholder="Search decisions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={
              searchTerm
                ? 'glass-input border-green-500/40 focus-enhanced'
                : 'glass-input hover:border-gray-500/30 focus-enhanced'
            }
          />
        </div>

        <div className="space-y-2">
          {/* Live Analysis Button */}
          <div
            className={`p-3 rounded-lg cursor-pointer transition-all duration-300 hover-lift group glass-card ${!selectedDecisionId ? 'border-green-500/40 shadow-lg bg-green-50/50' : 'border-white/20 hover:border-green-500/20'}`}
            onClick={() => setSelectedDecisionId(null)}
          >
            <h4 className="font-medium text-black group-hover:text-gray-800 transition-colors mb-1 text-sm">🔴 Live Analysis</h4>
            <div className="flex gap-2 mb-1">
              <Badge className="bg-green-100 text-green-800 text-xs">Real-time</Badge>
              <Badge variant="outline" className="text-xs border-gray-500/30 text-gray-600">
                {agents.filter(a => a.status === 'active').length} agents
              </Badge>
            </div>
            <p className="text-xs text-gray-500">Current session results</p>
          </div>

          {/* Decision History Items */}
          {filteredDecisions.length > 0 && (
            <div className="pt-2 border-t border-gray-200/30">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Past Decisions ({filteredDecisions.length})</p>
              {filteredDecisions.map((decision) => {
                const isSelected = selectedDecisionId === decision.id;
                const priorityColor = { high: 'text-red-600 bg-red-50', medium: 'text-blue-600 bg-blue-50', low: 'text-gray-600 bg-gray-50' }[decision.priority];
                const agentCount = Object.keys(decision.agentResults || {}).length;
                return (
                  <div
                    key={decision.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${isSelected ? 'glass-card border-blue-500/40 shadow-md bg-blue-50/30' : 'glass-card border-white/20 hover:border-blue-500/20 hover:bg-blue-50/10'}`}
                    onClick={() => setSelectedDecisionId(decision.id)}
                  >
                    <h4 className="font-medium text-black text-sm leading-tight mb-1 line-clamp-2">{decision.title}</h4>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs px-1.5 py-0 ${priorityColor}`}>{decision.priority}</Badge>
                      <span className="text-xs text-gray-500">{agentCount} agents</span>
                      <span className="text-xs font-medium text-green-700">{decision.confidence}%</span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(decision.createdAt).toLocaleDateString()} {new Date(decision.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                );
              })}
            </div>
          )}

          {filteredDecisions.length === 0 && searchTerm && (
            <p className="text-xs text-gray-400 text-center py-3">No decisions match "{searchTerm}"</p>
          )}
          {decisions.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No decisions yet. Run an analysis to create one.</p>
          )}
        </div>
      </div>

      {/* Right Panel - Decision Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">
                {selectedDecision ? selectedDecision.title : 'AI Analysis Workspace'}
              </h2>
              <p className="text-gray-600 text-sm">
                {selectedDecision
                  ? `Decision from ${new Date(selectedDecision.createdAt).toLocaleString()} · ${Object.keys(selectedDecision.agentResults).length} agents · ${selectedDecision.confidence}% confidence`
                  : 'Collaborative intelligence from your AI agent ecosystem'
                }
              </p>
            </div>
            <div className="flex gap-2">
              {selectedDecision && (
                <Button
                  onClick={() => setSelectedDecisionId(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <span className="text-lg">🔴</span>
                  Back to Live
                </Button>
              )}
              <Button 
                onClick={handleNavigateToDashboard}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span className="text-lg">📊</span>
                View Dashboard
              </Button>
            </div>
          </div>

          <div className="mb-3">
            <h3 className="text-lg font-semibold text-black mb-1">
              {selectedDecision ? 'Decision Analysis Results' : 'AI Agent Analysis Workspace'}
            </h3>
            <p className="text-xs text-gray-600">
              {selectedDecision
                ? `Viewing saved analysis for: "${selectedDecision.scenario.substring(0, 100)}${selectedDecision.scenario.length > 100 ? '...' : ''}"`
                : activeAgentsCount > 0 
                  ? `Real-time analysis powered by Four Pillars AI agents - ${activeAgentsCount} agents active`
                  : 'Enter a business scenario below and run AI analysis'
              }
            </p>
          </div>

          {/* Scenario Input Form */}
          <div className="mb-3 p-4 glass-card rounded-xl border-2 border-white/20 space-y-3">
            <Textarea
              placeholder="Describe your business scenario for AI analysis... (e.g., 'We are considering expanding into Southeast Asian markets with a $5M investment in cloud infrastructure')"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="glass-input min-h-[80px] focus-enhanced text-sm"
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <select
                value={analysisFocus}
                onChange={(e) => setAnalysisFocus(e.target.value)}
                className="glass-input rounded-lg px-3 py-2 text-sm border border-white/20 bg-white/50"
                disabled={loading}
              >
                {analysisTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <Button
                onClick={handleAnalyze}
                disabled={loading || !scenario.trim()}
                className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="text-lg">🚀</span>
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <Tabs defaultValue="analysis" className="w-full h-full">
            <TabsList className="glass mb-4 p-1 rounded-xl">
              <TabsTrigger value="analysis" className="text-black data-[state=active]:accent-button rounded-lg px-4 py-2 transition-all duration-300">
                Analysis Results
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-black data-[state=active]:accent-button rounded-lg px-4 py-2 transition-all duration-300">
                Collaborative Insights
              </TabsTrigger>
              <TabsTrigger value="tradeoffs" className="text-black data-[state=active]:accent-button rounded-lg px-4 py-2 transition-all duration-300">
                Trade-off Matrix
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="h-full">
              {Object.keys(displayAgentData).length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <span className="text-4xl block mb-3">🔍</span>
                    <p className="text-lg font-medium">No analysis results yet</p>
                    <p className="text-sm">Enter a scenario above and click "Run Analysis" to get started</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {Object.entries(displayAgentData).map(([agentId, data]) => {
                    const agentConfig = {
                      finance: { title: 'Financial Analysis', icon: '💰', border: 'border-green-300 bg-green-50/50' },
                      risk: { title: 'Risk Assessment', icon: '🛡️', border: 'border-red-300 bg-red-50/50' },
                      compliance: { title: 'Compliance Review', icon: '⚖️', border: 'border-blue-300 bg-blue-50/50' },
                      market: { title: 'Market Intelligence', icon: '📈', border: 'border-purple-300 bg-purple-50/50' },
                    }[agentId] || { title: agentId, icon: '📊', border: 'border-gray-300 bg-gray-50/50' };

                    const confidence = typeof data.confidence === 'number'
                      ? (data.confidence <= 1 ? Math.round(data.confidence * 100) : Math.round(data.confidence))
                      : 0;

                    return (
                      <Card key={agentId} className={`glass-card interactive-border ${agentConfig.border}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-black text-lg flex items-center gap-2">
                            <span className="text-2xl">{agentConfig.icon}</span>
                            {agentConfig.title}
                            <Badge className={`ml-auto ${confidence >= 80 ? 'bg-green-100 text-green-800' : confidence >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {confidence}%
                            </Badge>
                          </CardTitle>
                          {data.model && (
                            <p className="text-xs text-gray-400 mt-1">Model: {data.model} | {data.execution_time ? `${data.execution_time.toFixed(1)}s` : ''}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
                            {data.analysis ? (
                              data.analysis.split(/(?=##)/).map((section: string, idx: number) => {
                                if (!section.trim() || section.includes('CONFIDENCE_SCORE')) return null;
                                const headerMatch = section.match(/^##\s*(.+?)(?:\n|$)/);
                                if (headerMatch) {
                                  const header = headerMatch[1].trim();
                                  const content = section.substring(headerMatch[0].length).trim();
                                  if (content.includes('CONFIDENCE_SCORE') && !content.replace(/CONFIDENCE_SCORE.*/, '').trim()) return null;
                                  return (
                                    <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                      <h5 className="font-semibold text-gray-900 mb-2 text-sm">{header}</h5>
                                      <div className="text-gray-700 text-sm space-y-1 leading-relaxed">
                                        {content.split('\n').map((line: string, lineIdx: number) => {
                                          const trimmed = line.trim();
                                          if (!trimmed || trimmed.includes('CONFIDENCE_SCORE')) return null;
                                          if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                                            return (
                                              <div key={lineIdx} className="flex items-start gap-2 ml-1">
                                                <span className="text-blue-500 mt-1 text-xs flex-shrink-0">●</span>
                                                <span className="flex-1">{trimmed.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, '')}</span>
                                              </div>
                                            );
                                          }
                                          if (/^\d+\./.test(trimmed)) {
                                            return <div key={lineIdx} className="ml-1 font-medium">{trimmed.replace(/\*\*/g, '')}</div>;
                                          }
                                          if (trimmed.startsWith('**') || trimmed.includes('**')) {
                                            return <div key={lineIdx} className="font-medium text-gray-800 mt-1">{trimmed.replace(/\*\*/g, '')}</div>;
                                          }
                                          return <div key={lineIdx} className="text-gray-600">{trimmed}</div>;
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                                // Plain text without header
                                if (!section.includes('CONFIDENCE_SCORE')) {
                                  return <div key={idx} className="text-gray-700 text-sm bg-gray-50 rounded p-2">{section.trim()}</div>;
                                }
                                return null;
                              })
                            ) : (
                              <p className="text-gray-500 text-center py-4">Analysis completed</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-8">
              <Card className="glass-card interactive-border">
                <CardHeader>
                  <CardTitle className="text-black text-xl">Consolidated Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {activeAgentsCount > 0 
                      ? (() => {
                          const avgConfidence = overallConfidence;
                          
                          if (avgConfidence >= 80) {
                            return `Based on comprehensive analysis from all ${activeAgentsCount} agents, the recommended approach is to proceed with the strategic initiative. The collective assessment shows strong viability across all dimensions with ${avgConfidence}% overall confidence. Financial projections indicate positive ROI potential, risk factors are manageable, compliance requirements are well-understood, and market conditions are favorable for implementation.`;
                          } else if (avgConfidence >= 60) {
                            return `Based on analysis from ${activeAgentsCount} active agents, the system recommends proceeding with cautious optimism and targeted risk mitigation measures. With ${avgConfidence}% overall confidence, the collective analysis suggests moderate viability that requires careful monitoring of identified risk factors and enhanced due diligence in areas showing lower confidence scores.`;
                          } else if (avgConfidence > 0) {
                            return `The collective analysis from ${activeAgentsCount} agents indicates significant challenges that require thorough reassessment before proceeding. With ${avgConfidence}% overall confidence, multiple factors need attention across financial, risk, compliance, and market dimensions. Consider revisiting the strategic approach or seeking additional expert consultation.`;
                          } else {
                            return "Awaiting comprehensive analysis from all agents to provide consolidated strategic recommendations.";
                          }
                        })()
                      : "Run AI analysis to generate consolidated recommendations from all agents based on your business scenario."
                    }
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-lg">Overall Confidence</span>
                      <span className="font-medium text-black text-xl">{overallConfidence}%</span>
                    </div>
                    <Progress value={overallConfidence} className="h-4 progress-enhanced" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card interactive-border">
                <CardHeader>
                  <CardTitle className="text-black text-xl">Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-lg text-gray-600">
                    {activeAgentsCount > 0 ? (() => {
                      const financeAgent = agents.find(a => a.id === 'finance');
                      const riskAgent = agents.find(a => a.id === 'risk');
                      const complianceAgent = agents.find(a => a.id === 'compliance');
                      const marketAgent = agents.find(a => a.id === 'market');
                      
                      const financeScore = financeAgent?.performanceScore || 0;
                      const riskScore = riskAgent?.performanceScore || 0;
                      const complianceScore = complianceAgent?.performanceScore || 0;
                      const marketScore = marketAgent?.performanceScore || 0;
                      
                      const insights = [];
                      
                      // Cross-agent insights based on combined analysis
                      if (financeScore > 70 && marketScore > 70) {
                        insights.push({
                          color: 'bg-green-500',
                          text: `Financial and market analysis align positively - strong foundation for investment with projected ROI and favorable market conditions`
                        });
                      } else if (financeScore > 0 && marketScore > 0) {
                        insights.push({
                          color: 'bg-yellow-500',
                          text: `Financial and market factors require balanced consideration - moderate opportunity with careful planning needed`
                        });
                      }
                      
                      if (riskScore > 75 && complianceScore > 75) {
                        insights.push({
                          color: 'bg-blue-500',
                          text: `Risk and compliance assessments show strong alignment - regulatory framework supports low-risk implementation`
                        });
                      } else if (riskScore > 0 && complianceScore > 0) {
                        insights.push({
                          color: 'bg-orange-500',
                          text: `Risk and compliance factors need coordinated attention - structured mitigation approach recommended`
                        });
                      }
                      
                      // Strategic synthesis insights
                      if (overallConfidence >= 80) {
                        insights.push({
                          color: 'bg-purple-500',
                          text: `All agents converge on high-confidence recommendation - proceed with strategic implementation and monitoring protocols`
                        });
                      } else if (overallConfidence >= 60) {
                        insights.push({
                          color: 'bg-indigo-500',
                          text: `Agents indicate moderate consensus - phased approach with milestone reviews recommended for risk management`
                        });
                      } else if (overallConfidence > 0) {
                        insights.push({
                          color: 'bg-red-500',
                          text: `Agents identify significant concerns - comprehensive strategy revision needed before proceeding`
                        });
                      }
                      
                      // Cross-dimensional insights
                      const highPerformers = agents.filter(a => (a.performanceScore || 0) > 80);
                      const lowPerformers = agents.filter(a => (a.performanceScore || 0) < 60 && (a.performanceScore || 0) > 0);
                      
                      if (highPerformers.length >= 2) {
                        insights.push({
                          color: 'bg-emerald-500',
                          text: `Strong consensus across ${highPerformers.map(a => a.name.toLowerCase()).join(' and ')} dimensions - leverage these strengths for implementation`
                        });
                      }
                      
                      if (lowPerformers.length > 0) {
                        insights.push({
                          color: 'bg-amber-500',
                          text: `Focus required on ${lowPerformers.map(a => a.name.toLowerCase()).join(' and ')} considerations - address these factors before full commitment`
                        });
                      }
                      
                      return insights.length > 0 ? insights.map((insight, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className={`w-2 h-2 ${insight.color} rounded-full`}></div>
                          <span>{insight.text}</span>
                        </li>
                      )) : (
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Complete analysis in progress - comprehensive insights will be available shortly</span>
                        </li>
                      );
                    })() : [
                      { color: 'bg-blue-500', text: 'Run AI analysis to generate comprehensive cross-agent insights' },
                      { color: 'bg-green-500', text: 'Collaborative intelligence will synthesize findings from all Four Pillars agents' },
                      { color: 'bg-purple-500', text: 'Strategic recommendations will emerge from multi-dimensional analysis' },
                      { color: 'bg-orange-500', text: 'Decision framework will incorporate financial, risk, compliance, and market factors' }
                    ].map((insight, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 ${insight.color} rounded-full`}></div>
                        <span>{insight.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass-card interactive-border">
                <CardHeader>
                  <CardTitle className="text-black text-xl">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-lg text-gray-600">
                    {activeAgentsCount === 0 ? (
                      <>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Run AI Analysis to activate agents</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Input business scenario for analysis</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Review agent recommendations</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Make informed strategic decisions</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Review current agent analysis results</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Monitor agent performance metrics</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Execute recommended strategies</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Schedule follow-up analysis</span>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Agent Analysis Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.filter(agent => agent.status === 'active').map((agent) => {
                  const analysisData = latestAnalysisData[agent.id];
                  
                  const agentConfig = {
                    finance: {
                      title: 'Financial Analysis',
                      icon: '💰',
                      color: 'border-green-200 bg-green-50',
                      iconColor: 'text-green-600'
                    },
                    risk: {
                      title: 'Risk Assessment',
                      icon: '🛡️',
                      color: 'border-red-200 bg-red-50',
                      iconColor: 'text-red-600'
                    },
                    compliance: {
                      title: 'Compliance Analysis',
                      icon: '⚖️',
                      color: 'border-blue-200 bg-blue-50',
                      iconColor: 'text-blue-600'
                    },
                    market: {
                      title: 'Market Intelligence',
                      icon: '📈',
                      color: 'border-purple-200 bg-purple-50',
                      iconColor: 'text-purple-600'
                    }
                  }[agent.id] || {
                    title: `${agent.name} Analysis`,
                    icon: '📊',
                    color: 'border-gray-200 bg-gray-50',
                    iconColor: 'text-gray-600'
                  };

                  return (
                    <Card key={agent.id} className={`glass-card interactive-border ${agentConfig.color}`}>
                      <CardHeader>
                        <CardTitle className="text-black text-lg flex items-center gap-2">
                          <span className="text-2xl">{agentConfig.icon}</span>
                          {agentConfig.title}
                          <Badge className={`ml-auto ${agent.performanceScore && agent.performanceScore >= 80 ? 'bg-green-100 text-green-800' : agent.performanceScore && agent.performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {agent.performanceScore || 0}%
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysisData ? (
                          <>
                            {/* Analysis Summary - Clean formatted sections */}
                            <div className="space-y-3">
                              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                                {analysisData.analysis ? (
                                  // Split by ## headers and format sections with better styling
                                  analysisData.analysis.split(/(?=##)/g).map((section: string, idx: number) => {
                                    if (!section.trim()) return null;
                                    
                                    // Check if it's a header section
                                    const headerMatch = section.match(/^##\s*(.+?)(?:\n|$)/);
                                    if (headerMatch) {
                                      const header = headerMatch[1].trim();
                                      const content = section.substring(headerMatch[0].length).trim();
                                      
                                      // Skip confidence score section
                                      if (content.includes('CONFIDENCE_SCORE')) return null;
                                      
                                      return (
                                        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                          <h5 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                                            {header}
                                          </h5>
                                          <div className="text-gray-700 text-sm space-y-1 leading-relaxed">
                                            {content.split('\n').map((line: string, lineIdx: number) => {
                                              const trimmed = line.trim();
                                              if (!trimmed) return null;
                                              
                                              // Format bullet points with better styling
                                              if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                                                return (
                                                  <div key={lineIdx} className="flex items-start gap-2 ml-2">
                                                    <span className="text-blue-500 mt-1 text-xs">●</span>
                                                    <span className="flex-1">{trimmed.substring(1).trim()}</span>
                                                  </div>
                                                );
                                              }
                                              
                                              // Format numbered lists
                                              if (/^\d+\./.test(trimmed)) {
                                                return (
                                                  <div key={lineIdx} className="ml-2 font-medium">
                                                    {trimmed}
                                                  </div>
                                                );
                                              }
                                              
                                              // Format bold text
                                              if (trimmed.startsWith('**') || trimmed.includes('**')) {
                                                return (
                                                  <div key={lineIdx} className="font-medium text-gray-800 mt-2">
                                                    {trimmed.replace(/\*\*/g, '')}
                                                  </div>
                                                );
                                              }
                                              
                                              return (
                                                <div key={lineIdx} className="ml-4 text-gray-600">
                                                  {trimmed}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    // Non-header content (shouldn't happen with new format)
                                    if (section.trim() && !section.includes('CONFIDENCE_SCORE')) {
                                      return (
                                        <div key={idx} className="text-gray-700 text-sm bg-gray-50 rounded p-2">
                                          {section.trim()}
                                        </div>
                                      );
                                    }
                                    
                                    return null;
                                  })
                                ) : (
                                  <p className="text-gray-500 text-center py-4">Analysis completed successfully</p>
                                )}
                              </div>
                            </div>

                            {/* Agent-specific Metrics */}
                            {agent.id === 'finance' && analysisData.metrics && (
                              <div className="space-y-2">
                                <h5 className="font-medium text-black">Financial Ratios</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {Object.entries(analysisData.metrics).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                      <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {agent.id === 'risk' && analysisData.risk_categories && (
                              <div className="space-y-2">
                                <h5 className="font-medium text-black">Risk Categories</h5>
                                <div className="space-y-1">
                                  {Object.entries(analysisData.risk_categories).map(([category, level]) => (
                                    <div key={category} className="flex justify-between text-sm">
                                      <span className="text-gray-600 capitalize">{category.replace(/_/g, ' ')}:</span>
                                      <Badge variant="outline" className={`text-xs ${level === 'low' ? 'text-green-600' : level === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {String(level)}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {agent.id === 'compliance' && analysisData.compliance_scores && (
                              <div className="space-y-2">
                                <h5 className="font-medium text-black">Compliance Scores</h5>
                                <div className="space-y-1">
                                  {Object.entries(analysisData.compliance_scores).map(([area, score]) => (
                                    <div key={area} className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600 capitalize">{area.replace(/_/g, ' ')}:</span>
                                      <div className="flex items-center gap-2">
                                        <Progress value={(score as number) * 100} className="w-16 h-2" />
                                        <span className="font-medium">{((score as number) * 100).toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {agent.id === 'market' && analysisData.market_metrics && (
                              <div className="space-y-2">
                                <h5 className="font-medium text-black">Market Metrics</h5>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  {Object.entries(analysisData.market_metrics).map(([metric, value]) => (
                                    <div key={metric} className="flex justify-between">
                                      <span className="text-gray-600 capitalize">{metric.replace(/_/g, ' ')}:</span>
                                      <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Data Sources */}
                            {analysisData.real_data && (
                              <div className="pt-2 border-t border-gray-200">
                                <h5 className="font-medium text-black mb-2 text-sm">Data Sources</h5>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(analysisData.real_data).map(([source, data]) => (
                                    <Badge key={source} variant="outline" className="text-xs">
                                      {source.replace(/_/g, ' ')}: {Array.isArray(data) ? data.length : typeof data === 'object' && data !== null ? Object.keys(data).length : 1}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">Analysis data will appear here after running AI analysis</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="tradeoffs" className="space-y-6">
              <Card className="glass-card interactive-border">
                <CardHeader>
                  <CardTitle className="text-black text-xl flex items-center gap-2">
                    <span className="text-2xl">⚖️</span>
                    Strategic Trade-off Analysis
                    <Badge variant="outline" className="ml-auto">
                      {activeAgentsCount} Active Agents
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Comparative analysis of strategic decisions based on AI agent insights
                  </p>
                </CardHeader>
                <CardContent>
                  {activeAgentsCount > 0 ? (
                    <div className="space-y-6">
                      {/* Investment Opportunity vs Risk Exposure */}
                      <div className="bg-gradient-to-br from-green-50 to-red-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                          💰 Investment Opportunity vs 🛡️ Risk Exposure
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Investment Strengths */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-green-700 font-semibold mb-3 flex items-center gap-2">
                              <span>✅</span> Investment Strengths
                            </h4>
                            <ul className="space-y-2">
                              {(() => {
                                const financeAgent = agents.find(a => a.id === 'finance');
                                const marketAgent = agents.find(a => a.id === 'market');
                                const financeScore = financeAgent?.performanceScore || 0;
                                const marketScore = marketAgent?.performanceScore || 0;
                                
                                return (
                                  <>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-green-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Financial Confidence:</strong> {financeScore}% - 
                                        {financeScore >= 85 ? " Excellent financial viability" : 
                                         financeScore >= 70 ? " Good revenue potential" : 
                                         financeScore >= 60 ? " Moderate returns expected" : 
                                         " Further analysis needed"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-green-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Market Opportunity:</strong> {marketScore}% - 
                                        {marketScore >= 85 ? " Strong market demand" : 
                                         marketScore >= 70 ? " Growing market segment" : 
                                         marketScore >= 60 ? " Niche market potential" : 
                                         " Competitive market"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-green-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Combined Score:</strong> {Math.round((financeScore + marketScore) / 2)}% - 
                                        {((financeScore + marketScore) / 2) >= 80 ? " High investment appeal" : 
                                         ((financeScore + marketScore) / 2) >= 65 ? " Moderate investment appeal" : 
                                         " Cautious approach recommended"}
                                      </span>
                                    </li>
                                  </>
                                );
                              })()}
                            </ul>
                          </div>
                          
                          {/* Risk Factors */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-red-700 font-semibold mb-3 flex items-center gap-2">
                              <span>⚠️</span> Risk Factors
                            </h4>
                            <ul className="space-y-2">
                              {(() => {
                                const riskAgent = agents.find(a => a.id === 'risk');
                                const riskScore = riskAgent?.performanceScore || 0;
                                const riskLevel = riskScore >= 80 ? "LOW" : riskScore >= 60 ? "MODERATE" : "HIGH";
                                
                                return (
                                  <>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-red-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Overall Risk Level:</strong> {riskLevel} ({100 - riskScore}% risk) - 
                                        {riskScore >= 80 ? " Well-mitigated risks" : 
                                         riskScore >= 60 ? " Manageable risk profile" : 
                                         " Significant risk exposure"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-red-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Risk Confidence:</strong> {riskScore}% - 
                                        {riskScore >= 85 ? " Comprehensive risk coverage" : 
                                         riskScore >= 70 ? " Good risk understanding" : 
                                         " Further risk analysis needed"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-red-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Recommendation:</strong> 
                                        {riskScore >= 75 ? " Proceed with standard risk management" : 
                                         riskScore >= 60 ? " Implement enhanced monitoring" : 
                                         " Develop comprehensive mitigation plan"}
                                      </span>
                                    </li>
                                  </>
                                );
                              })()}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Compliance Requirements vs Speed to Market */}
                      <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                          ⚖️ Compliance Requirements vs ⚡ Speed to Market
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Compliance Status */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-blue-700 font-semibold mb-3 flex items-center gap-2">
                              <span>📋</span> Compliance Status
                            </h4>
                            <ul className="space-y-2">
                              {(() => {
                                const complianceAgent = agents.find(a => a.id === 'compliance');
                                const complianceScore = complianceAgent?.performanceScore || 0;
                                
                                return (
                                  <>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-blue-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Compliance Readiness:</strong> {complianceScore}% - 
                                        {complianceScore >= 85 ? " Fully compliant" : 
                                         complianceScore >= 70 ? " Good compliance framework" : 
                                         complianceScore >= 60 ? " Partial compliance" : 
                                         " Significant gaps identified"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-blue-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Legal Framework:</strong> 
                                        {complianceScore >= 80 ? " Established regulations" : 
                                         complianceScore >= 60 ? " Developing framework" : 
                                         " Complex requirements"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-blue-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Estimated Timeline:</strong> 
                                        {complianceScore >= 80 ? " 2-3 months" : 
                                         complianceScore >= 60 ? " 4-6 months" : 
                                         " 6-12 months"}
                                      </span>
                                    </li>
                                  </>
                                );
                              })()}
                            </ul>
                          </div>
                          
                          {/* Market Timing */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-orange-700 font-semibold mb-3 flex items-center gap-2">
                              <span>⏱️</span> Market Timing Impact
                            </h4>
                            <ul className="space-y-2">
                              {(() => {
                                const marketAgent = agents.find(a => a.id === 'market');
                                const marketScore = marketAgent?.performanceScore || 0;
                                
                                return (
                                  <>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-orange-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Market Window:</strong> 
                                        {marketScore >= 85 ? " Optimal timing - act quickly" : 
                                         marketScore >= 70 ? " Good timing - moderate urgency" : 
                                         marketScore >= 60 ? " Acceptable timing" : 
                                         " Market conditions uncertain"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-orange-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Competitive Pressure:</strong> 
                                        {marketScore >= 80 ? " First-mover advantage available" : 
                                         marketScore >= 65 ? " Moderate competition" : 
                                         " Highly competitive market"}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                      <span className="text-orange-500 mt-0.5">●</span>
                                      <span>
                                        <strong>Strategy:</strong> 
                                        {marketScore >= 75 ? " Balance compliance with speed" : 
                                         marketScore >= 60 ? " Prioritize thorough compliance" : 
                                         " Focus on market differentiation"}
                                      </span>
                                    </li>
                                  </>
                                );
                              })()}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Impact vs Feasibility Matrix - Improved */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-black mb-4">📊 Impact vs Feasibility Matrix</h3>
                        <p className="text-sm text-gray-600 mb-6">Agent positioning based on confidence scores and strategic value</p>
                        
                        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8" style={{ height: '400px' }}>
                          {/* Quadrant Background Colors */}
                          <div className="absolute top-8 left-8 right-1/2 bottom-1/2 bg-yellow-50 opacity-40 rounded-tl-lg"></div>
                          <div className="absolute top-8 left-1/2 right-8 bottom-1/2 bg-green-50 opacity-60 rounded-tr-lg"></div>
                          <div className="absolute top-1/2 left-8 right-1/2 bottom-8 bg-red-50 opacity-40 rounded-bl-lg"></div>
                          <div className="absolute top-1/2 left-1/2 right-8 bottom-8 bg-blue-50 opacity-50 rounded-br-lg"></div>
                          
                          {/* Grid Lines */}
                          <div className="absolute left-8 right-8 top-1/2 border-t-2 border-gray-400"></div>
                          <div className="absolute top-8 bottom-8 left-1/2 border-l-2 border-gray-400"></div>
                          
                          {/* Axis Labels */}
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-700">
                            Impact (Strategic Value) →
                          </div>
                          <div className="absolute left-1 top-1/2 transform -rotate-90 origin-left translate-y-1/2 text-sm font-medium text-gray-700">
                            ← Feasibility (Confidence)
                          </div>
                          
                          {/* Quadrant Labels */}
                          <div className="absolute top-12 left-12 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            Low Priority
                          </div>
                          <div className="absolute top-12 right-12 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                            High Priority
                          </div>
                          <div className="absolute bottom-12 left-12 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                            Risky
                          </div>
                          <div className="absolute bottom-12 right-12 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            Quick Wins
                          </div>
                          
                          {/* Agent Markers */}
                          {agents.filter(a => a.status === 'active').map((agent) => {
                            const confidence = agent.performanceScore || 50;
                            const analysisData = latestAnalysisData[agent.id];
                            
                            // Calculate impact based on agent type and analysis quality
                            let impact = confidence; // Base impact on confidence
                            if (agent.id === 'finance') impact = Math.min(95, confidence + 10); // Finance has high impact
                            if (agent.id === 'risk') impact = Math.min(95, confidence + 5); // Risk is important
                            if (agent.id === 'market') impact = Math.min(95, confidence + 8); // Market is strategic
                            
                            // Position calculation (10% to 90% of the chart area)
                            const leftPercent = 10 + (impact / 100) * 80;
                            const bottomPercent = 10 + (confidence / 100) * 80;
                            
                            const agentConfig = {
                              finance: { icon: '💰', color: 'bg-green-500', border: 'border-green-600', label: 'Finance' },
                              risk: { icon: '🛡️', color: 'bg-red-500', border: 'border-red-600', label: 'Risk' },
                              compliance: { icon: '⚖️', color: 'bg-blue-500', border: 'border-blue-600', label: 'Compliance' },
                              market: { icon: '📈', color: 'bg-purple-500', border: 'border-purple-600', label: 'Market' }
                            }[agent.id] || { icon: '📊', color: 'bg-gray-500', border: 'border-gray-600', label: agent.name };
                            
                            return (
                              <div
                                key={agent.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 cursor-pointer group"
                                style={{ left: `${leftPercent}%`, bottom: `${bottomPercent}%` }}
                                title={`${agentConfig.label}: ${confidence}% confidence, ${Math.round(impact)}% impact`}
                              >
                                <div className={`w-12 h-12 rounded-full ${agentConfig.color} border-2 ${agentConfig.border} flex items-center justify-center shadow-lg`}>
                                  <span className="text-xl">{agentConfig.icon}</span>
                                </div>
                                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-black text-white text-xs px-2 py-1 rounded shadow-lg">
                                    <div className="font-semibold">{agentConfig.label}</div>
                                    <div>Confidence: {confidence}%</div>
                                    <div>Impact: {Math.round(impact)}%</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Decision Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          Strategic Decision Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Strengths */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-green-700 font-semibold mb-3">✅ Key Strengths</h4>
                            <ul className="space-y-2 text-sm">
                              {agents.filter(a => (a.performanceScore || 0) >= 75).map(agent => (
                                <li key={agent.id} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">●</span>
                                  <span>
                                    <strong>{agent.name}:</strong> {agent.performanceScore}% confidence - 
                                    {agent.performanceScore >= 85 ? " Excellent analysis quality" : " Strong insights"}
                                  </span>
                                </li>
                              ))}
                              {agents.filter(a => (a.performanceScore || 0) >= 75).length === 0 && (
                                <li className="text-gray-500 italic">Run analysis to identify strengths</li>
                              )}
                            </ul>
                          </div>
                          
                          {/* Considerations */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-orange-700 font-semibold mb-3">⚠️ Key Considerations</h4>
                            <ul className="space-y-2 text-sm">
                              {agents.filter(a => (a.performanceScore || 0) < 75 && (a.performanceScore || 0) > 0).map(agent => (
                                <li key={agent.id} className="flex items-start gap-2">
                                  <span className="text-orange-500 mt-0.5">●</span>
                                  <span>
                                    <strong>{agent.name}:</strong> {agent.performanceScore}% confidence - 
                                    {agent.performanceScore >= 60 ? " Requires attention" : " Needs deeper analysis"}
                                  </span>
                                </li>
                              ))}
                              {agents.filter(a => (a.performanceScore || 0) < 75 && (a.performanceScore || 0) > 0).length === 0 && (
                                <li className="text-gray-500">
                                  {activeAgentsCount > 0 ? "No significant considerations identified" : "Run analysis to identify considerations"}
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg mb-4">No active agents available</p>
                      <p className="text-gray-400">Run an analysis to see trade-off insights</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}