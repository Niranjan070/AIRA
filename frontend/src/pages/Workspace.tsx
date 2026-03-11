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

  const overallConfidence = getOverallConfidence();
  const activeAgentsCount = getActiveAgentsCount();

  // --- Collaborative Insight Helpers ---
  const extractKeyFindings = (analysis: string): string[] => {
    if (!analysis) return [];
    const findings: string[] = [];
    for (const line of analysis.split('\n')) {
      const t = line.trim();
      if ((t.startsWith('•') || t.startsWith('-') || t.startsWith('*')) && !t.includes('CONFIDENCE_SCORE')) {
        const cleaned = t.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, '').trim();
        if (cleaned.length > 15) findings.push(cleaned);
      }
    }
    return findings.slice(0, 4);
  };

  const getAgentConfidence = (agentId: string): number => {
    const d = displayAgentData[agentId];
    if (!d?.confidence) return 0;
    return d.confidence <= 1 ? Math.round(d.confidence * 100) : Math.round(d.confidence);
  };

  const agentMeta: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
    finance: { label: 'Financial', icon: '💰', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    risk: { label: 'Risk', icon: '🛡️', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    compliance: { label: 'Compliance', icon: '⚖️', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    market: { label: 'Market', icon: '📈', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  };

  const hasAnalysisData = Object.keys(displayAgentData).length > 0;

  // Build cross-agent synergies & tensions
  const buildCrossInsights = () => {
    const agentIds = Object.keys(displayAgentData);
    const synergies: { agents: string[]; message: string; type: 'synergy' | 'tension' | 'warning' }[] = [];
    const fc = getAgentConfidence('finance'), rc = getAgentConfidence('risk'),
          cc = getAgentConfidence('compliance'), mc = getAgentConfidence('market');

    if (agentIds.includes('finance') && agentIds.includes('market')) {
      if (fc >= 70 && mc >= 70)
        synergies.push({ agents: ['finance', 'market'], message: `Strong financial viability (${fc}%) coupled with favorable market conditions (${mc}%) creates a compelling investment case.`, type: 'synergy' });
      else if (fc >= 70 && mc < 60)
        synergies.push({ agents: ['finance', 'market'], message: `Financial metrics look promising (${fc}%) but market conditions (${mc}%) may limit upside potential. Consider timing or market pivot.`, type: 'tension' });
      else if (fc < 60 && mc >= 70)
        synergies.push({ agents: ['finance', 'market'], message: `Market opportunity exists (${mc}%) but financial foundations (${fc}%) need strengthening before scaling.`, type: 'tension' });
    }
    if (agentIds.includes('risk') && agentIds.includes('compliance')) {
      if (rc >= 75 && cc >= 75)
        synergies.push({ agents: ['risk', 'compliance'], message: `Low risk exposure (${rc}%) with strong compliance posture (${cc}%) provides a secure operational foundation.`, type: 'synergy' });
      else if (rc < 60 || cc < 60)
        synergies.push({ agents: ['risk', 'compliance'], message: `Risk (${rc}%) and compliance (${cc}%) gaps identified. Prioritize regulatory alignment and risk mitigation before proceeding.`, type: 'tension' });
    }
    if (agentIds.includes('finance') && agentIds.includes('risk')) {
      if (fc >= 70 && rc < 60)
        synergies.push({ agents: ['finance', 'risk'], message: `High financial potential (${fc}%) is offset by elevated risk profile (${rc}%). ROI projections should be risk-adjusted.`, type: 'warning' });
      else if (fc >= 70 && rc >= 70)
        synergies.push({ agents: ['finance', 'risk'], message: `Financial returns (${fc}%) are well-supported by manageable risk levels (${rc}%). Favorable risk-adjusted outlook.`, type: 'synergy' });
    }
    if (agentIds.includes('compliance') && agentIds.includes('market')) {
      if (cc < 65 && mc >= 70)
        synergies.push({ agents: ['compliance', 'market'], message: `Market window (${mc}%) may close if compliance gaps (${cc}%) cause regulatory delays. Fast-track compliance workstreams.`, type: 'warning' });
    }
    return synergies;
  };

  // Build composite recommendation
  const getCompositeRecommendation = () => {
    if (!hasAnalysisData) return null;
    const scores = ['finance', 'risk', 'compliance', 'market'].map(id => ({ id, score: getAgentConfidence(id) })).filter(s => s.score > 0);
    if (scores.length === 0) return null;
    const avg = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
    const strongest = scores.reduce((a, b) => a.score > b.score ? a : b);
    const weakest = scores.reduce((a, b) => a.score < b.score ? a : b);
    const verdict = avg >= 80 ? 'PROCEED' : avg >= 65 ? 'PROCEED WITH CAUTION' : avg >= 50 ? 'REASSESS' : 'HOLD';
    const verdictColor = avg >= 80 ? 'bg-green-100 text-green-800 border-green-300' : avg >= 65 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : avg >= 50 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-red-100 text-red-800 border-red-300';
    return { avg, strongest, weakest, verdict, verdictColor, scores };
  };

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

            <TabsContent value="insights" className="space-y-6">
              {!hasAnalysisData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <span className="text-5xl block mb-4">🤝</span>
                    <p className="text-lg font-medium">No collaborative insights yet</p>
                    <p className="text-sm mt-1">Run an analysis to see how agents work together to evaluate your scenario</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Verdict Banner */}
                  {(() => {
                    const rec = getCompositeRecommendation();
                    if (!rec) return null;
                    return (
                      <div className={`rounded-xl border-2 p-5 ${rec.verdictColor}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{rec.avg >= 75 ? '✅' : rec.avg >= 60 ? '⚡' : '⚠️'}</span>
                            <div>
                              <h3 className="text-xl font-bold">Composite Verdict: {rec.verdict}</h3>
                              <p className="text-sm opacity-80">
                                Based on {rec.scores.length} agent{rec.scores.length > 1 ? 's' : ''} analyzing your scenario
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">{rec.avg}%</div>
                            <div className="text-xs opacity-70">Overall Confidence</div>
                          </div>
                        </div>
                        <Progress value={rec.avg} className="h-3 mb-3" />
                        <div className="flex gap-4 text-sm">
                          <span>Strongest: <strong>{agentMeta[rec.strongest.id]?.icon} {agentMeta[rec.strongest.id]?.label}</strong> ({rec.strongest.score}%)</span>
                          <span className="opacity-50">|</span>
                          <span>Needs attention: <strong>{agentMeta[rec.weakest.id]?.icon} {agentMeta[rec.weakest.id]?.label}</strong> ({rec.weakest.score}%)</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Agent Confidence Comparison */}
                  <Card className="glass-card interactive-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-black text-lg flex items-center gap-2">
                        <span className="text-xl">📊</span> Agent Confidence Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['finance', 'risk', 'compliance', 'market'].map(id => {
                          const conf = getAgentConfidence(id);
                          const meta = agentMeta[id];
                          if (!displayAgentData[id]) return null;
                          return (
                            <div key={id} className="flex items-center gap-3">
                              <div className="w-28 flex items-center gap-2 text-sm font-medium">
                                <span>{meta.icon}</span> {meta.label}
                              </div>
                              <div className="flex-1 relative">
                                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${conf >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : conf >= 65 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : conf >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                                    style={{ width: `${conf}%` }}
                                  />
                                </div>
                              </div>
                              <div className={`w-14 text-right font-bold text-sm ${conf >= 80 ? 'text-green-700' : conf >= 65 ? 'text-yellow-700' : conf >= 50 ? 'text-orange-700' : 'text-red-700'}`}>
                                {conf}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cross-Agent Synergies & Tensions */}
                  {(() => {
                    const crossInsights = buildCrossInsights();
                    if (crossInsights.length === 0) return null;
                    return (
                      <Card className="glass-card interactive-border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-black text-lg flex items-center gap-2">
                            <span className="text-xl">🔗</span> Cross-Agent Correlations
                          </CardTitle>
                          <p className="text-sm text-gray-500">How different analysis dimensions interact and influence each other</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {crossInsights.map((insight, i) => (
                            <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${
                              insight.type === 'synergy' ? 'bg-green-50 border-green-200' :
                              insight.type === 'tension' ? 'bg-orange-50 border-orange-200' :
                              'bg-amber-50 border-amber-200'
                            }`}>
                              <span className="text-xl mt-0.5 flex-shrink-0">
                                {insight.type === 'synergy' ? '🟢' : insight.type === 'tension' ? '🟠' : '🟡'}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {insight.agents.map(a => (
                                    <Badge key={a} variant="outline" className={`text-xs ${agentMeta[a]?.border} ${agentMeta[a]?.bg}`}>
                                      {agentMeta[a]?.icon} {agentMeta[a]?.label}
                                    </Badge>
                                  ))}
                                  <Badge className={`text-xs ${
                                    insight.type === 'synergy' ? 'bg-green-100 text-green-800' :
                                    insight.type === 'tension' ? 'bg-orange-100 text-orange-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {insight.type === 'synergy' ? 'Aligned' : insight.type === 'tension' ? 'Tension' : 'Watch'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{insight.message}</p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Key Findings Extracted from Each Agent */}
                  <Card className="glass-card interactive-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-black text-lg flex items-center gap-2">
                        <span className="text-xl">🔍</span> Key Findings by Agent
                      </CardTitle>
                      <p className="text-sm text-gray-500">Critical data points extracted from each agent's analysis</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['finance', 'risk', 'compliance', 'market'].map(id => {
                          const data = displayAgentData[id];
                          if (!data) return null;
                          const meta = agentMeta[id];
                          const findings = extractKeyFindings(data.analysis || '');
                          const conf = getAgentConfidence(id);
                          return (
                            <div key={id} className={`rounded-lg border p-4 ${meta.border} ${meta.bg}`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={`font-semibold text-sm flex items-center gap-2 ${meta.color}`}>
                                  <span className="text-lg">{meta.icon}</span> {meta.label} Agent
                                </h4>
                                <Badge className={`${conf >= 75 ? 'bg-green-100 text-green-800' : conf >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                  {conf}%
                                </Badge>
                              </div>
                              {findings.length > 0 ? (
                                <ul className="space-y-2">
                                  {findings.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                      <span className={`mt-1 ${meta.color} text-xs flex-shrink-0`}>▸</span>
                                      <span className="leading-relaxed">{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-400 italic">Analysis completed — see full results in the Analysis tab</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strategic Recommendations */}
                  <Card className="glass-card interactive-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-black text-lg flex items-center gap-2">
                        <span className="text-xl">🎯</span> Recommended Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(() => {
                          const rec = getCompositeRecommendation();
                          if (!rec) return <p className="text-gray-500">Awaiting analysis data...</p>;
                          const actions: { priority: string; text: string; color: string }[] = [];
                          const fc = getAgentConfidence('finance'), rc = getAgentConfidence('risk'),
                                cc = getAgentConfidence('compliance'), mc = getAgentConfidence('market');

                          // High priority actions based on weak areas
                          if (rc > 0 && rc < 70) actions.push({ priority: 'HIGH', text: 'Develop detailed risk mitigation plan — risk assessment confidence is below threshold', color: 'bg-red-100 text-red-800 border-red-200' });
                          if (cc > 0 && cc < 70) actions.push({ priority: 'HIGH', text: 'Conduct regulatory compliance gap analysis before proceeding', color: 'bg-red-100 text-red-800 border-red-200' });
                          if (fc > 0 && fc < 65) actions.push({ priority: 'HIGH', text: 'Revise financial projections and validate funding assumptions', color: 'bg-red-100 text-red-800 border-red-200' });

                          // Medium priority
                          if (mc > 0 && mc < 70) actions.push({ priority: 'MEDIUM', text: 'Deepen market research — validate demand assumptions with primary data', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' });
                          if (fc >= 65 && rc >= 65) actions.push({ priority: 'MEDIUM', text: 'Calculate risk-adjusted ROI using combined finance and risk outputs', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' });
                          if (cc >= 70 && mc >= 70) actions.push({ priority: 'MEDIUM', text: 'Align compliance timeline with market entry window', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' });

                          // Standard actions
                          if (rec.avg >= 70) actions.push({ priority: 'NEXT', text: 'Proceed to detailed implementation planning with stakeholder review', color: 'bg-blue-100 text-blue-800 border-blue-200' });
                          else actions.push({ priority: 'NEXT', text: 'Schedule follow-up analysis after addressing identified gaps', color: 'bg-blue-100 text-blue-800 border-blue-200' });

                          return actions.map((action, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${action.color}`}>
                              <Badge className={`text-xs font-bold ${action.color} whitespace-nowrap`}>{action.priority}</Badge>
                              <span className="text-sm">{action.text}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="tradeoffs" className="space-y-6">
              {!hasAnalysisData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <span className="text-5xl block mb-4">⚖️</span>
                    <p className="text-lg font-medium">No trade-off data yet</p>
                    <p className="text-sm mt-1">Run an analysis to see strategic trade-offs across dimensions</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Dimension Scorecard */}
                  <Card className="glass-card interactive-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-black text-lg flex items-center gap-2">
                        <span className="text-xl">📋</span> Dimension Scorecard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {['finance', 'risk', 'compliance', 'market'].map(id => {
                          const conf = getAgentConfidence(id);
                          const meta = agentMeta[id];
                          if (!displayAgentData[id]) return (
                            <div key={id} className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                              <span className="text-2xl">{meta.icon}</span>
                              <p className="text-xs text-gray-400 mt-2">{meta.label}</p>
                              <p className="text-xs text-gray-300">Not analyzed</p>
                            </div>
                          );
                          const grade = conf >= 85 ? 'A' : conf >= 75 ? 'B+' : conf >= 65 ? 'B' : conf >= 55 ? 'C+' : conf >= 45 ? 'C' : 'D';
                          const gradeColor = conf >= 75 ? 'text-green-700 bg-green-100' : conf >= 60 ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100';
                          return (
                            <div key={id} className={`rounded-xl border p-4 text-center ${meta.border} ${meta.bg} hover:shadow-md transition-shadow`}>
                              <span className="text-2xl">{meta.icon}</span>
                              <p className={`text-xs font-medium mt-1 ${meta.color}`}>{meta.label}</p>
                              <div className={`text-2xl font-bold mt-2 w-10 h-10 rounded-full mx-auto flex items-center justify-center ${gradeColor}`}>{grade}</div>
                              <p className="text-sm font-medium text-gray-700 mt-1">{conf}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cross-Pillar Relationship Analysis — All 6 pairs */}
                  <Card className="glass-card interactive-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-black text-lg flex items-center gap-2">
                        <span className="text-xl">🔀</span> Cross-Pillar Relationships
                      </CardTitle>
                      <p className="text-sm text-gray-500">How each pair of pillars influences, reinforces, or conflicts with each other</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const fc = getAgentConfidence('finance'), rc = getAgentConfidence('risk'),
                              cc = getAgentConfidence('compliance'), mc = getAgentConfidence('market');
                        const pairs: { a: string; b: string; aScore: number; bScore: number; borderColor: string }[] = [
                          { a: 'finance', b: 'risk', aScore: fc, bScore: rc, borderColor: 'border-l-green-500' },
                          { a: 'finance', b: 'compliance', aScore: fc, bScore: cc, borderColor: 'border-l-emerald-500' },
                          { a: 'finance', b: 'market', aScore: fc, bScore: mc, borderColor: 'border-l-teal-500' },
                          { a: 'risk', b: 'compliance', aScore: rc, bScore: cc, borderColor: 'border-l-orange-500' },
                          { a: 'risk', b: 'market', aScore: rc, bScore: mc, borderColor: 'border-l-rose-500' },
                          { a: 'compliance', b: 'market', aScore: cc, bScore: mc, borderColor: 'border-l-indigo-500' },
                        ];
                        const getRelType = (s1: number, s2: number) => {
                          if (s1 === 0 || s2 === 0) return { label: 'Incomplete', color: 'bg-gray-100 text-gray-600', icon: '⏳' };
                          const diff = Math.abs(s1 - s2);
                          if (s1 >= 70 && s2 >= 70) return { label: 'Synergy', color: 'bg-green-100 text-green-800', icon: '🟢' };
                          if (s1 < 55 && s2 < 55) return { label: 'Dual Risk', color: 'bg-red-100 text-red-800', icon: '🔴' };
                          if (diff >= 25) return { label: 'Tension', color: 'bg-orange-100 text-orange-800', icon: '🟠' };
                          return { label: 'Balanced', color: 'bg-blue-100 text-blue-800', icon: '🔵' };
                        };
                        const getNarrative = (a: string, b: string, s1: number, s2: number): { summary: string; actions: string[] } => {
                          if (s1 === 0 || s2 === 0) return { summary: 'Awaiting analysis from both agents.', actions: [] };
                          const aL = agentMeta[a]?.label || a, bL = agentMeta[b]?.label || b;
                          if (a === 'finance' && b === 'risk') {
                            const riskAdj = Math.round(s1 * 0.6 + s2 * 0.4);
                            if (s1 >= 70 && s2 >= 70) return { summary: `Strong financial viability (${s1}%) is well-supported by manageable risk levels (${s2}%), yielding a risk-adjusted score of ${riskAdj}%. This is a favorable investment profile where returns adequately compensate for the risk exposure.`, actions: ['Lock in favorable financing terms while risk profile is strong', 'Build contingency reserves proportional to remaining risk factors'] };
                            if (s1 >= 70 && s2 < 60) return { summary: `Promising financial returns (${s1}%) are undermined by elevated risk (${s2}%), producing a risk-adjusted score of only ${riskAdj}%. High potential upside exists but could be eroded by unmitigated threats.`, actions: ['Develop detailed risk mitigation plan before scaling investment', 'Consider phased capital deployment tied to risk reduction milestones'] };
                            if (s1 < 60 && s2 >= 70) return { summary: `Low risk exposure (${s2}%) provides safety, but weak financial fundamentals (${s1}%) suggest the opportunity may not justify the capital required. Risk-adjusted score: ${riskAdj}%.`, actions: ['Explore revenue optimization or cost restructuring', 'Validate market pricing assumptions to improve financial outlook'] };
                            return { summary: `Both financial viability (${s1}%) and risk management (${s2}%) show weakness, with a risk-adjusted score of ${riskAdj}%. Significant restructuring needed before proceeding.`, actions: ['Reassess the core business model and unit economics', 'Conduct detailed risk audit to identify cost-effective mitigations'] };
                          }
                          if (a === 'finance' && b === 'compliance') {
                            if (s1 >= 70 && s2 >= 70) return { summary: `Sound finances (${s1}%) and strong compliance posture (${s2}%) form a solid foundation. Regulatory costs are manageable within the financial framework, and compliance readiness reduces the risk of costly penalties or delays.`, actions: ['Allocate compliance budget within existing financial projections', 'Use compliance strength as a competitive differentiator with investors'] };
                            if (s1 >= 70 && s2 < 60) return { summary: `Good financial health (${s1}%) but compliance gaps (${s2}%) pose a hidden financial threat. Regulatory fines, licensing delays, or mandatory remediations could significantly impact projected returns.`, actions: ['Budget for compliance remediation in financial projections', 'Prioritize highest-penalty regulatory gaps first'] };
                            return { summary: `${aL} at ${s1}% and ${bL} at ${s2}% — the interplay between financial capacity and regulatory burden needs attention. ${s1 < 60 ? 'Limited financial resources may constrain compliance investments.' : 'Compliance costs should be factored into the financial model.'}`, actions: ['Map compliance costs into the P&L forecast', 'Identify low-cost compliance quick wins'] };
                          }
                          if (a === 'finance' && b === 'market') {
                            if (s1 >= 70 && s2 >= 70) return { summary: `Strong financial backing (${s1}%) meets favorable market conditions (${s2}%). This is the ideal combination — capital is available and the market is receptive. Speed of execution becomes the key differentiator.`, actions: ['Accelerate go-to-market timeline to capture market window', 'Allocate marketing budget aggressively while conditions are favorable'] };
                            if (s1 >= 70 && s2 < 60) return { summary: `Capital readiness (${s1}%) outpaces market opportunity (${s2}%). Financial resources exist but market demand, competition, or timing create uncertainty about deployment effectiveness.`, actions: ['Invest in market validation before large-scale capital deployment', 'Consider pivoting strategy or timing to align with market readiness'] };
                            return { summary: `${aL} confidence at ${s1}% and ${bL} at ${s2}%. ${s2 >= 70 && s1 < 60 ? 'A strong market window exists but financial constraints may prevent full exploitation.' : 'Both financial capacity and market conditions need strengthening for a compelling business case.'}`, actions: ['Align capital raise timeline with market entry window', 'Develop lean market-test approach to validate before scaling'] };
                          }
                          if (a === 'risk' && b === 'compliance') {
                            if (s1 >= 70 && s2 >= 70) return { summary: `Low risk profile (${s1}%) combined with regulatory readiness (${s2}%) creates a secure operational foundation. The organization is well-protected from both operational threats and legal exposure.`, actions: ['Leverage strong governance posture for partnership negotiations', 'Maintain monitoring — compliance landscapes evolve'] };
                            if (s1 < 60 || s2 < 60) return { summary: `Gaps in ${s1 < s2 ? 'risk management' : 'compliance'} (${Math.min(s1, s2)}%) weaken the overall governance picture. ${s1 < 60 && s2 < 60 ? 'Both risk and compliance need urgent attention — these are foundational to any business decision.' : `The weaker dimension (${Math.min(s1, s2)}%) may amplify exposure in the stronger one.`}`, actions: ['Conduct integrated risk-compliance assessment', 'Prioritize the weaker dimension as it undermines the stronger one'] };
                            return { summary: `Moderate alignment between risk management (${s1}%) and compliance (${s2}%). Both are functional but have room for optimization.`, actions: ['Identify overlapping risk and compliance gaps for efficient remediation'] };
                          }
                          if (a === 'risk' && b === 'market') {
                            if (s1 >= 70 && s2 >= 70) return { summary: `Manageable risk levels (${s1}%) in a favorable market (${s2}%) indicate strong conditions for execution. Market competition is well-understood, and operational threats are contained.`, actions: ['Move quickly — low-risk market windows are rare', 'Build competitive moats while risk is manageable'] };
                            if (s1 < 60 && s2 >= 70) return { summary: `Attractive market opportunity (${s2}%) is clouded by elevated risk (${s1}%). Market timing pressure may tempt rushed decisions that amplify risk exposure.`, actions: ['Develop rapid risk mitigation for market-critical threats', 'Consider partnerships to share risk while capturing market upside'] };
                            return { summary: `Risk at ${s1}% and market at ${s2}% — ${s1 >= 70 && s2 < 60 ? 'risk is well-managed but the market opportunity itself is uncertain' : 'both dimensions need strengthening before committing resources'}.`, actions: ['Validate market assumptions independently of risk analysis', 'Build scenario models for different market outcomes'] };
                          }
                          if (a === 'compliance' && b === 'market') {
                            if (s1 >= 70 && s2 >= 70) return { summary: `Compliance readiness (${s1}%) enables timely market capture (${s2}%). No regulatory barriers will slow market entry, and compliance can be positioned as a trust signal to customers.`, actions: ['Parallel-track compliance and go-to-market workstreams', 'Market compliance certifications as customer trust builders'] };
                            if (s1 < 65 && s2 >= 70) return { summary: `Market window (${s2}%) may close before compliance gaps (${s1}%) are resolved. This is the classic speed-vs-safety tension — moving fast risks regulatory exposure, but waiting risks losing market position.`, actions: ['Fast-track critical compliance items; defer non-blocking ones', 'Seek provisional or phased regulatory approvals'] };
                            return { summary: `Compliance at ${s1}% and market at ${s2}%. ${s1 >= 70 && s2 < 65 ? 'Strong compliance posture but uncertain market demand — use preparation time to refine product-market fit.' : 'Both regulatory readiness and market positioning need development.'}`, actions: ['Align compliance milestones with market entry timeline', 'Use compliance delays productively for market research'] };
                          }
                          return { summary: `${aL} (${s1}%) and ${bL} (${s2}%) interaction analysis pending.`, actions: [] };
                        };
                        return pairs.map(({ a, b, aScore, bScore, borderColor }) => {
                          if (!displayAgentData[a] && !displayAgentData[b]) return null;
                          const rel = getRelType(aScore, bScore);
                          const narrative = getNarrative(a, b, aScore, bScore);
                          const mA = agentMeta[a], mB = agentMeta[b];
                          return (
                            <div key={`${a}-${b}`} className={`rounded-xl border-l-4 ${borderColor} border border-gray-200 bg-white p-4 space-y-3`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-lg">{mA.icon}</span>
                                    <span className={`text-sm font-semibold ${mA.color}`}>{mA.label}</span>
                                    <span className={`text-sm font-bold ${aScore >= 70 ? 'text-green-700' : aScore >= 55 ? 'text-yellow-700' : 'text-red-700'}`}>{aScore}%</span>
                                  </div>
                                  <span className="text-gray-400 font-bold text-xs">⟷</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-lg">{mB.icon}</span>
                                    <span className={`text-sm font-semibold ${mB.color}`}>{mB.label}</span>
                                    <span className={`text-sm font-bold ${bScore >= 70 ? 'text-green-700' : bScore >= 55 ? 'text-yellow-700' : 'text-red-700'}`}>{bScore}%</span>
                                  </div>
                                </div>
                                <Badge className={`text-xs ${rel.color}`}>{rel.icon} {rel.label}</Badge>
                              </div>
                              {/* Dual progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transition-all" style={{ width: `${aScore}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">vs</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transition-all" style={{ width: `${bScore}%` }} />
                                </div>
                              </div>
                              {/* Narrative */}
                              <p className="text-sm text-gray-700 leading-relaxed">{narrative.summary}</p>
                              {/* Actions */}
                              {narrative.actions.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  {narrative.actions.map((action, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                      <span className="text-blue-500 mt-0.5 flex-shrink-0">▸</span>
                                      <span>{action}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </CardContent>
                  </Card>

                  {/* Impact vs Feasibility Matrix */}
                  <Card className="glass-card interactive-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-black text-lg flex items-center gap-2">
                        <span className="text-xl">📊</span> Impact vs Feasibility Matrix
                      </CardTitle>
                      <p className="text-sm text-gray-500">Agent positioning: X-axis = Strategic Impact, Y-axis = Feasibility (Confidence)</p>
                    </CardHeader>
                    <CardContent>
                      <div className="relative rounded-xl border border-gray-200 overflow-hidden" style={{ height: '360px' }}>
                        {/* Quadrant backgrounds */}
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                          <div className="bg-yellow-50/60 flex items-start justify-start p-3"><span className="text-xs font-semibold text-yellow-700 bg-yellow-200/70 px-2 py-0.5 rounded">Monitor</span></div>
                          <div className="bg-green-50/60 flex items-start justify-end p-3"><span className="text-xs font-semibold text-green-700 bg-green-200/70 px-2 py-0.5 rounded">Prioritize</span></div>
                          <div className="bg-red-50/60 flex items-end justify-start p-3"><span className="text-xs font-semibold text-red-700 bg-red-200/70 px-2 py-0.5 rounded">Avoid / Reassess</span></div>
                          <div className="bg-blue-50/60 flex items-end justify-end p-3"><span className="text-xs font-semibold text-blue-700 bg-blue-200/70 px-2 py-0.5 rounded">Quick Wins</span></div>
                        </div>
                        {/* Axis lines */}
                        <div className="absolute left-0 right-0 top-1/2 border-t border-gray-300" />
                        <div className="absolute top-0 bottom-0 left-1/2 border-l border-gray-300" />
                        {/* Agent dots */}
                        {['finance', 'risk', 'compliance', 'market'].map(id => {
                          const conf = getAgentConfidence(id);
                          if (!displayAgentData[id]) return null;
                          const meta = agentMeta[id];
                          // Impact varies by agent role
                          const impactOffset = { finance: 12, risk: 5, compliance: 3, market: 10 }[id] || 0;
                          const impact = Math.min(98, conf + impactOffset);
                          const x = 5 + (impact / 100) * 90;
                          const y = 5 + ((100 - conf) / 100) * 90; // invert so high = top
                          const dotColor = { finance: 'bg-green-500 border-green-700', risk: 'bg-red-500 border-red-700', compliance: 'bg-blue-500 border-blue-700', market: 'bg-purple-500 border-purple-700' }[id] || 'bg-gray-500 border-gray-700';
                          return (
                            <div key={id} className="absolute group cursor-pointer transition-transform hover:scale-125 z-10"
                              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                              <div className={`w-11 h-11 rounded-full ${dotColor} border-2 flex items-center justify-center shadow-lg`}>
                                <span className="text-lg">{meta.icon}</span>
                              </div>
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                <div className="font-bold">{meta.label}</div>
                                <div>Confidence: {conf}% &middot; Impact: {impact}%</div>
                                <div className="text-gray-300">{conf >= 70 ? 'Strong' : conf >= 50 ? 'Moderate' : 'Weak'} position</div>
                              </div>
                            </div>
                          );
                        })}
                        {/* Axis text */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-medium pointer-events-none">Strategic Impact →</div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-1 text-[10px] text-gray-500 font-medium pointer-events-none" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg) translateY(50%)' }}>Feasibility →</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weighted Decision Table */}
                  <Card className="glass-card interactive-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-black text-lg flex items-center gap-2">
                        <span className="text-xl">🎯</span> Weighted Decision Table
                      </CardTitle>
                      <p className="text-sm text-gray-500">Each dimension weighted by strategic importance</p>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const weights = { finance: 0.30, risk: 0.25, compliance: 0.20, market: 0.25 };
                        const rows = (['finance', 'risk', 'compliance', 'market'] as const).map(id => {
                          const conf = getAgentConfidence(id);
                          const meta = agentMeta[id];
                          const w = weights[id];
                          const weighted = Math.round(conf * w);
                          return { id, label: meta.label, icon: meta.icon, conf, weight: w, weighted, color: meta.color, bg: meta.bg, border: meta.border };
                        }).filter(r => displayAgentData[r.id]);
                        const totalWeighted = rows.reduce((s, r) => s + r.weighted, 0);
                        const maxPossible = rows.reduce((s, r) => s + Math.round(100 * r.weight), 0);
                        const overallPct = maxPossible > 0 ? Math.round((totalWeighted / maxPossible) * 100) : 0;
                        return (
                          <div className="space-y-4">
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 text-left">
                                    <th className="px-4 py-3 font-semibold text-gray-700">Dimension</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-center">Score</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-center">Weight</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-center">Weighted</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Assessment</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r, i) => (
                                    <tr key={r.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <span>{r.icon}</span> {r.label}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`font-bold ${r.conf >= 75 ? 'text-green-700' : r.conf >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>{r.conf}%</span>
                                      </td>
                                      <td className="px-4 py-3 text-center text-gray-500">{Math.round(r.weight * 100)}%</td>
                                      <td className="px-4 py-3 text-center font-bold">{r.weighted}</td>
                                      <td className="px-4 py-3">
                                        <Badge className={`text-xs ${r.conf >= 75 ? 'bg-green-100 text-green-800' : r.conf >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                          {r.conf >= 80 ? 'Strong' : r.conf >= 70 ? 'Good' : r.conf >= 60 ? 'Fair' : 'Weak'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                                    <td className="px-4 py-3">Composite</td>
                                    <td className="px-4 py-3 text-center">{overallPct}%</td>
                                    <td className="px-4 py-3 text-center text-gray-500">100%</td>
                                    <td className="px-4 py-3 text-center">{totalWeighted}/{maxPossible}</td>
                                    <td className="px-4 py-3">
                                      <Badge className={`text-xs ${overallPct >= 75 ? 'bg-green-100 text-green-800' : overallPct >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {overallPct >= 80 ? 'Proceed' : overallPct >= 65 ? 'Cautious Go' : overallPct >= 50 ? 'Reassess' : 'Hold'}
                                      </Badge>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            {/* Visual summary */}
                            <div className={`rounded-xl p-4 text-center border-2 ${overallPct >= 75 ? 'bg-green-50 border-green-300' : overallPct >= 60 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'}`}>
                              <p className="text-sm text-gray-600 mb-1">Composite Decision Score</p>
                              <p className={`text-4xl font-black ${overallPct >= 75 ? 'text-green-700' : overallPct >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>{overallPct}%</p>
                              <p className="text-sm mt-1 text-gray-600">
                                {overallPct >= 80 ? 'All dimensions strongly support proceeding with this initiative.' :
                                 overallPct >= 70 ? 'Most dimensions are favorable. Address the weakest area before full commitment.' :
                                 overallPct >= 60 ? 'Mixed signals across dimensions. A phased or pilot approach is recommended.' :
                                 'Significant challenges identified. Further analysis and risk mitigation needed.'}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}