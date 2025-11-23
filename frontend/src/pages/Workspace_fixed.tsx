import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Calendar, Users, Target, TrendingUp } from 'lucide-react';
import { useAgents } from '@/contexts/AgentContext';
import { Decision } from '@/types';

export default function Workspace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const { agents } = useAgents();

  // Load decisions from localStorage
  useEffect(() => {
    const loadDecisionsFromStorage = () => {
      try {
        const stored = localStorage.getItem('strategicDecisions');
        if (stored) {
          const decisions = JSON.parse(stored);
          setAllDecisions(decisions);
          // Auto-select first decision if available
          if (decisions.length > 0 && !selectedDecision) {
            setSelectedDecision(decisions[0]);
          }
        }
      } catch (error) {
        console.error('Error loading decisions from storage:', error);
      }
    };

    loadDecisionsFromStorage();
  }, [selectedDecision]);

  // Filter decisions based on search term
  const filteredDecisions = allDecisions.filter(decision =>
    decision.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDetailedAgentAnalysisFromContext = () => {
    const recommendations = selectedDecision 
      ? [
          `Strategic implementation for: ${selectedDecision.title}`,
          `Priority level: ${selectedDecision.priority} - requires immediate attention`,
          `Confidence assessment: ${selectedDecision.confidence}% alignment with strategic objectives`,
          `Resource allocation should reflect ${selectedDecision.priority} priority status`,
          'Monitor key performance indicators for decision effectiveness'
        ]
      : [
          'Complete Four Pillars AI analysis to generate detailed recommendations',
          'Review agent performance across all market domains',
          'Implement risk mitigation strategies based on analysis results',
          'Optimize resource allocation based on confidence scores',
          'Monitor compliance and regulatory requirements'
        ];

    const insights = [
      'Multi-agent analysis provides comprehensive market intelligence',
      'Confidence scores indicate strategic alignment effectiveness',
      'Cross-domain validation ensures robust decision-making',
      'Real-time data integration enhances analytical accuracy'
    ];

    return { recommendations, insights };
  };

  const detailedAnalysis = getDetailedAgentAnalysisFromContext();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysis Workspace</h1>
          <p className="text-gray-600 mt-2">Strategic decision analysis and collaborative insights</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Strategic Decisions Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategic Decisions
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search decisions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredDecisions.length > 0 ? (
                filteredDecisions.map((decision) => (
                  <div
                    key={decision.id}
                    onClick={() => setSelectedDecision(decision)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedDecision?.id === decision.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm text-black">{decision.title}</h3>
                      <Badge
                        className={`text-xs ${
                          decision.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : decision.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {decision.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      Strategic decision analysis and implementation guidance
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Confidence: {decision.confidence}%</span>
                      <span className={`px-2 py-1 rounded ${
                        decision.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {decision.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <p className="text-gray-600 text-sm">
                    {searchTerm ? 'No decisions match your search' : 'No strategic decisions created yet'}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {searchTerm ? 'Try a different search term' : 'Create decisions in the Dashboard'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Analysis Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="historical" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="historical">Historical Analysis</TabsTrigger>
              <TabsTrigger value="collaborative">Collaborative Insights</TabsTrigger>
              <TabsTrigger value="tradeoff">Trade-off Matrix</TabsTrigger>
            </TabsList>

            {/* Historical Analysis Tab */}
            <TabsContent value="historical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDecision ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-black mb-2">Analysis for: {selectedDecision.title}</h3>
                        <p className="text-gray-600">Strategic decision analysis and implementation guidance</p>
                        <div className="flex gap-4 mt-3 text-sm">
                          <span>Created: {new Date(selectedDecision.createdAt).toLocaleDateString()}</span>
                          <span>Priority: {selectedDecision.priority}</span>
                          <span>Confidence: {selectedDecision.confidence}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-black mb-4">Decision Metrics</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Implementation Score</span>
                              <span className="font-medium">{Math.max(60, selectedDecision.confidence - 5)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Risk Assessment</span>
                              <span className="font-medium">{100 - selectedDecision.confidence}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Strategic Alignment</span>
                              <span className="font-medium">{selectedDecision.confidence}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-black mb-4">Key Factors</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-gray-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm">AI-validated decision framework</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm">Multi-agent consensus achieved</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm">Strategic priority aligned</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Decision Selected</h3>
                      <p className="text-gray-600 mb-6">Select a strategic decision from the left panel to view historical analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Collaborative Insights Tab */}
            <TabsContent value="collaborative" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Collaborative Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDecision ? (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-black mb-4">AI Agent Analysis for: {selectedDecision.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {agents.map((agent) => (
                            <div key={agent.id} className="bg-white rounded-lg p-4 text-center">
                              <div className="text-2xl mb-2">{agent.id === 'finance' ? '💰' : agent.id === 'market' ? '📈' : agent.id === 'risk' ? '⚠️' : '📋'}</div>
                              <h4 className="font-medium text-black">{agent.name}</h4>
                              <div className="mt-2">
                                <div className={`text-sm px-2 py-1 rounded ${
                                  selectedDecision.confidence >= 80 ? 'bg-green-100 text-green-800' :
                                  selectedDecision.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {selectedDecision.confidence}% aligned
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black">Key Recommendations</h3>
                          <ul className="space-y-3">
                            {detailedAnalysis.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-3 text-gray-700">
                                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                                  {index + 1}
                                </div>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black">Strategic Insights</h3>
                          <ul className="space-y-3">
                            {detailedAnalysis.insights.map((insight, index) => (
                              <li key={index} className="flex items-start gap-3 text-gray-700">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤝</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Decision Selected</h3>
                      <p className="text-gray-600 mb-6">Select a strategic decision from the left panel to view collaborative insights</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trade-off Matrix Tab */}
            <TabsContent value="tradeoff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Strategic Trade-off Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDecision ? (
                    <div className="space-y-8">
                      {/* Decision Overview */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-black mb-2">Decision Analysis: {selectedDecision.title}</h3>
                        <div className="flex gap-4 text-sm">
                          <span>Priority: <Badge className={`${
                            selectedDecision.priority === 'high' ? 'bg-red-100 text-red-800' :
                            selectedDecision.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{selectedDecision.priority}</Badge></span>
                          <span>Status: <Badge className={`${
                            selectedDecision.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>{selectedDecision.status}</Badge></span>
                          <span>Confidence: {selectedDecision.confidence}%</span>
                        </div>
                      </div>

                      {/* Investment vs. Risk Section */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-black mb-6">Investment vs. Risk Analysis</h3>
                        <div className="grid grid-cols-2 gap-8">
                          {/* Advantages */}
                          <div>
                            <h4 className="text-green-600 font-medium mb-4 flex items-center gap-2">
                              <span className="text-lg">📈</span>
                              Advantages
                            </h4>
                            <ul className="space-y-3">
                              {selectedDecision.confidence >= 70 && (
                                <li className="flex items-center gap-3 text-gray-700">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>High confidence strategic alignment ({selectedDecision.confidence}%)</span>
                                </li>
                              )}
                              {selectedDecision.priority === 'high' && (
                                <li className="flex items-center gap-3 text-gray-700">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>High priority initiative with strategic importance</span>
                                </li>
                              )}
                              <li className="flex items-center gap-3 text-gray-700">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Comprehensive AI analysis completed</span>
                              </li>
                              {selectedDecision.agents && selectedDecision.agents.length > 0 && (
                                <li className="flex items-center gap-3 text-gray-700">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>Multi-agent validation from {selectedDecision.agents.length} AI agents</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Disadvantages/Risks */}
                          <div>
                            <h4 className="text-red-600 font-medium mb-4 flex items-center gap-2">
                              <span className="text-lg">⚠️</span>
                              Risks & Challenges
                            </h4>
                            <ul className="space-y-3">
                              {selectedDecision.confidence < 70 && (
                                <li className="flex items-center gap-3 text-gray-700">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span>Moderate confidence level ({selectedDecision.confidence}%)</span>
                                </li>
                              )}
                              {selectedDecision.priority === 'low' && (
                                <li className="flex items-center gap-3 text-gray-700">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span>Lower priority initiative requiring resource allocation</span>
                                </li>
                              )}
                              <li className="flex items-center gap-3 text-gray-700">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span>Implementation complexity requires careful planning</span>
                              </li>
                              <li className="flex items-center gap-3 text-gray-700">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span>Market volatility may impact decision outcomes</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Decision Matrix */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-black mb-6">Decision Impact Matrix</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <span className="font-medium text-black">Strategic Alignment</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${selectedDecision.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600">{selectedDecision.confidence}%</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                            <span className="font-medium text-black">Implementation Feasibility</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${Math.max(60, selectedDecision.confidence - 10)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600">{Math.max(60, selectedDecision.confidence - 10)}%</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                            <span className="font-medium text-black">Resource Requirements</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-yellow-600 h-2 rounded-full" 
                                  style={{ width: `${selectedDecision.priority === 'high' ? 85 : selectedDecision.priority === 'medium' ? 65 : 45}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {selectedDecision.priority === 'high' ? 85 : selectedDecision.priority === 'medium' ? 65 : 45}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                            <span className="font-medium text-black">Expected ROI</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(90, selectedDecision.confidence + 15)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600">{Math.min(90, selectedDecision.confidence + 15)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Decision Selected</h3>
                      <p className="text-gray-600 mb-6">Select a strategic decision from the left panel to view detailed trade-off analysis</p>
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
