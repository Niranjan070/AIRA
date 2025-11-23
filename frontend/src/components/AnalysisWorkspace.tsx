import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, AlertCircle, TrendingUp, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import { useAnalysis } from '@/hooks/useAnalysis';

const agentIcons = {
  'Finance Agent': DollarSign,
  'Risk Agent': Shield, 
  'Compliance Agent': AlertTriangle,
  'Market Agent': TrendingUp,
};

const agentColors = {
  'Finance Agent': 'text-green-600 bg-green-50 border-green-200',
  'Risk Agent': 'text-red-600 bg-red-50 border-red-200',
  'Compliance Agent': 'text-yellow-600 bg-yellow-50 border-yellow-200', 
  'Market Agent': 'text-blue-600 bg-blue-50 border-blue-200',
};

export function AnalysisWorkspace() {
  const [scenario, setScenario] = useState('');
  const { data, loading, error, analyzeScenario, clearError } = useAnalysis();

  const handleAnalyze = async () => {
    if (!scenario.trim()) return;
    
    try {
      await analyzeScenario(scenario.trim(), 'comprehensive');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="glass-card border-2 border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-black flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Four Pillars AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Describe your business scenario:
            </label>
            <Textarea
              placeholder="Enter your business scenario or decision that needs analysis..."
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="glass-input min-h-[120px] resize-none"
              disabled={loading}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={!scenario.trim() || loading}
              className="accent-button flex items-center gap-2 hover:bg-green-600 transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? 'Analyzing...' : 'Analyze Scenario'}
            </Button>
            
            {error && (
              <Button
                variant="outline"
                onClick={clearError}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Clear Error
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="glass-card border-2 border-green-200">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-green-600" />
                  <h3 className="text-lg font-semibold text-black">
                    Analyzing Your Scenario
                  </h3>
                  <p className="text-gray-600 text-center">
                    Four Pillars AI agents are processing your request...
                  </p>
                  <div className="w-full max-w-sm">
                    <Progress value={75} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            {data.summary && (
              <Card className="glass-card border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-xl font-bold text-black">Analysis Summary</span>
                    <Badge className={getConfidenceBadgeColor(data.summary.confidence)}>
                      {data.summary.confidence}% Confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Recommendation</h4>
                    <p className="text-green-700">{data.summary.recommendation}</p>
                  </div>
                  
                  {data.summary.key_insights && data.summary.key_insights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-black">Key Insights</h4>
                      <ul className="space-y-1">
                        {data.summary.key_insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CrewAI Result Display */}
            {data.crew_result && (
              <Card className="glass-card border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-xl font-bold text-black">AI Analysis Result</span>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {data.overall_confidence || 85}% Confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Analysis Result</h4>
                    <div className="text-blue-700 whitespace-pre-wrap">{data.crew_result}</div>
                  </div>
                  
                  {data.agents_utilized && data.agents_utilized.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-black">Agents Utilized</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.agents_utilized.map((agent, index) => (
                          <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-600">Execution Time:</span>
                      <div className="font-medium">{data.execution_time_seconds.toFixed(2)}s</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-600">Framework:</span>
                      <div className="font-medium">{data.framework}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agent Analyses */}
            {data.agents && data.agents.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {data.agents.map((agent, index) => {
                const IconComponent = agentIcons[agent.agent_name as keyof typeof agentIcons] || TrendingUp;
                const colorClass = agentColors[agent.agent_name as keyof typeof agentColors] || 'text-gray-600 bg-gray-50 border-gray-200';
                
                return (
                  <motion.div
                    key={agent.agent_name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-card border-2 border-white/20 hover-lift">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-5 h-5" />
                            {agent.agent_name}
                          </div>
                          <Badge className={getConfidenceBadgeColor(agent.confidence)}>
                            {agent.confidence}%
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className={`p-3 rounded-lg border ${colorClass}`}>
                          <h5 className="font-medium mb-2">Recommendation</h5>
                          <p className="text-sm">{agent.recommendation}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="font-medium text-black">Analysis</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {agent.analysis}
                          </p>
                        </div>

                        {/* Agent-specific fields */}
                        {agent.risk_level && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Risk Level:</span>
                            <Badge variant="outline">{agent.risk_level}</Badge>
                          </div>
                        )}
                        
                        {agent.financial_impact && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Financial Impact:</span>
                            <Badge variant="outline">{agent.financial_impact}</Badge>
                          </div>
                        )}
                        
                        {agent.compliance_status && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Compliance Status:</span>
                            <Badge variant="outline">{agent.compliance_status}</Badge>
                          </div>
                        )}
                        
                        {agent.market_sentiment && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Market Sentiment:</span>
                            <Badge variant="outline">{agent.market_sentiment}</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              </div>
            )}

            {/* Analysis Metadata */}
            {data.analysis_id && (
              <Card className="glass-card border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Analysis ID: {data.analysis_id}</span>
                    <span>Generated: {new Date(data.timestamp).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
