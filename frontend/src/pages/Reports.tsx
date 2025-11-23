import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, RefreshCw, Database, Trash2 } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useEffect, useState } from 'react';

export default function Reports() {
  const { 
    metrics, 
    recentDecisions, 
    isLoading, 
    clearAllData, 
    hasData,
    totalAnalyses,
    hasRealData,
    checkForRealData
  } = useReports();

  const [showDevTools, setShowDevTools] = useState(false);

  // Load only real analysis data - no sample data
  useEffect(() => {
    if (!isLoading) {
      if (hasData) {
        console.log(`📊 Reports loaded with ${totalAnalyses} real analyses`);
      } else {
        console.log('📊 No real analysis data found - run analyses from Dashboard to populate reports');
      }
    }
  }, [isLoading, hasData, totalAnalyses, hasRealData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports data...</p>
        </div>
      </div>
    );
  }

  // Default empty state if no metrics
  const defaultMetrics = {
    totalDecisions: 0,
    avgConfidence: 0,
    completedDecisions: 0,
    thisMonthDecisions: 0,
    priorityDistribution: [],
    statusDistribution: [],
    confidenceData: [],
    agentPerformance: [],
    trendsData: []
  };

  const currentMetrics = metrics || defaultMetrics;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-4 sm:p-6 glass-card border-b-2 border-white/20 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-black">Strategic Reports</h1>
          <p className="text-gray-600">Comprehensive insights from your Four Pillars AI ecosystem</p>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-sm text-gray-500">
              {totalAnalyses > 0 ? `${totalAnalyses} total analyses` : 'No analyses yet'}
            </p>
            {totalAnalyses > 0 && (
              <Badge variant={hasRealData ? "default" : "secondary"} className="text-xs">
                {hasRealData ? "🔴 Live Data" : "📊 Real Data Only"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="glass-button flex items-center gap-2 text-black hover-lift"
            onClick={() => setShowDevTools(!showDevTools)}
          >
            <Database className="w-4 h-4" />
            {showDevTools ? 'Hide' : 'Dev'} Tools
          </Button>
          <Button 
            variant="outline" 
            className="glass-button flex items-center gap-2 text-black hover-lift"
            onClick={checkForRealData}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="glass-button flex items-center gap-2 text-black hover-lift">
            <Filter className="w-4 h-4" />
            Filter Reports
          </Button>
          <Button className="accent-button font-medium px-6 py-2 flex items-center gap-2 hover-lift">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Dev Tools Panel */}
      {showDevTools && (
        <motion.div 
          className="p-4 bg-yellow-50 border-b border-yellow-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center gap-4">
            <p className="text-sm text-yellow-700 font-medium">Developer Tools:</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearAllData}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All Data
            </Button>
            <span className="text-xs text-yellow-600">Current: {totalAnalyses} analyses</span>
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
        {/* No Data State */}
        {!hasData && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analysis Data Available</h3>
            <p className="text-gray-500 mb-6">
              Run some business analyses using Four Pillars AI to see real reports here.
            </p>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg mb-4">
                <p className="font-medium mb-2">💡 To get real data:</p>
                <p>1. Go to "Analysis Workspace" and run a business scenario</p>
                <p>2. Complete the Four Pillars AI analysis</p>
                <p>3. Return here to see real insights and metrics</p>
              </div>
              <Button onClick={checkForRealData} className="accent-button">
                <RefreshCw className="w-4 h-4 mr-2" />
                Check for Real Data
              </Button>
            </div>
          </motion.div>
        )}

        {/* Data Display */}
        {hasData && (
          <>
            {/* Executive Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 border-2 border-white/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-black text-2xl flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">System Performance</p>
                          <p className="text-4xl font-bold text-emerald-600">{currentMetrics.avgConfidence}%</p>
                          <p className="text-xs text-gray-500 mt-2">Average AI confidence across all analyses</p>
                        </div>
                        <div className="text-3xl">🎯</div>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Total Analyses</p>
                          <p className="text-4xl font-bold text-blue-600">{currentMetrics.totalDecisions}</p>
                          <p className="text-xs text-gray-500 mt-2">Strategic decisions processed by Four Pillars AI</p>
                        </div>
                        <div className="text-3xl">📈</div>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
                          <p className="text-4xl font-bold text-purple-600">
                            {currentMetrics.totalDecisions > 0 ? Math.round((currentMetrics.completedDecisions / currentMetrics.totalDecisions) * 100) : 0}%
                          </p>
                          <p className="text-xs text-gray-500 mt-2">{currentMetrics.completedDecisions} of {currentMetrics.totalDecisions} completed</p>
                        </div>
                        <div className="text-3xl">✨</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced KPI Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white hover-lift shadow-lg border-0">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-0">Finance</Badge>
                    </div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wide mb-1">Total Analyses</p>
                    <p className="text-3xl font-bold mb-2">{currentMetrics.totalDecisions}</p>
                    <div className="flex items-center text-xs opacity-80">
                      <span className="mr-1">↗</span>
                      <span>Real-time AI insights</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover-lift shadow-lg border-0">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-0">Accuracy</Badge>
                    </div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wide mb-1">Avg Confidence</p>
                    <p className="text-3xl font-bold mb-2">{currentMetrics.avgConfidence}%</p>
                    <div className="flex items-center text-xs opacity-80">
                      <span className="mr-1">✓</span>
                      <span>Four Pillars precision</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover-lift shadow-lg border-0">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-0">Status</Badge>
                    </div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wide mb-1">Completed</p>
                    <p className="text-3xl font-bold mb-2">{currentMetrics.completedDecisions}</p>
                    <div className="flex items-center text-xs opacity-80">
                      <span className="mr-1">✨</span>
                      <span>Successfully analyzed</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white hover-lift shadow-lg border-0">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-0">Recent</Badge>
                    </div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wide mb-1">This Month</p>
                    <p className="text-3xl font-bold mb-2">{currentMetrics.thisMonthDecisions}</p>
                    <div className="flex items-center text-xs opacity-80">
                      <span className="mr-1">🔥</span>
                      <span>Active analysis period</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Enhanced Charts Row with Insights */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {/* Priority Distribution with Insights */}
              <Card className="glass-card hover-lift border-2 border-gray-200 shadow-lg">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-black text-lg flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      Decision Urgency Levels
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {currentMetrics.priorityDistribution.reduce((sum: number, item: any) => sum + item.value, 0)} decisions
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    {(() => {
                      const criticalCount = currentMetrics.priorityDistribution.find((item: any) => item.name === 'Critical')?.value || 0;
                      const highCount = currentMetrics.priorityDistribution.find((item: any) => item.name === 'High')?.value || 0;
                      const total = currentMetrics.totalDecisions;
                      const urgentPercent = total > 0 ? Math.round(((criticalCount + highCount) / total) * 100) : 0;
                      
                      if (urgentPercent > 75) return "🔴 High urgency: Immediate action required on most decisions";
                      if (urgentPercent > 40) return "🟡 Moderate urgency: Balance of critical and routine decisions";
                      return "🟢 Low urgency: Most decisions are routine or low priority";
                    })()}
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  {currentMetrics.priorityDistribution.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={currentMetrics.priorityDistribution}>
                          <defs>
                            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.7}/>
                            </linearGradient>
                            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0.7}/>
                            </linearGradient>
                            <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.7}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            fontSize={12} 
                            stroke="#6b7280"
                            tick={{ fill: '#374151' }}
                          />
                          <YAxis 
                            fontSize={12} 
                            stroke="#6b7280"
                            tick={{ fill: '#374151' }}
                            label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
                            formatter={(value: any) => [`${value} decisions`, 'Count']}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="url(#colorCritical)"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={80}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {currentMetrics.priorityDistribution.map((item: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-1">{item.name}</p>
                            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {currentMetrics.totalDecisions > 0 ? Math.round((item.value / currentMetrics.totalDecisions) * 100) : 0}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm">No priority data available</p>
                        <p className="text-xs text-gray-400 mt-1">Run analyses to see urgency distribution</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution with Insights */}
              <Card className="glass-card hover-lift border-2 border-gray-200 shadow-lg">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-black text-lg flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      Analysis Completion Status
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {currentMetrics.statusDistribution.reduce((sum: number, item: any) => sum + item.count, 0)} total
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    {(() => {
                      const completedCount = currentMetrics.statusDistribution.find((item: any) => item.status === 'Completed')?.count || 0;
                      const total = currentMetrics.totalDecisions;
                      const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
                      
                      if (completionRate === 100) return "✨ Perfect: All analyses completed successfully";
                      if (completionRate >= 80) return "🎯 Excellent: High completion rate with minimal issues";
                      if (completionRate >= 60) return "📊 Good: Most analyses completed, some in progress";
                      return "⚠️ Attention: Many analyses pending or incomplete";
                    })()}
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  {currentMetrics.statusDistribution.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <defs>
                              <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                                <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                              </linearGradient>
                              <linearGradient id="gradientPending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                                <stop offset="95%" stopColor="#d97706" stopOpacity={0.7}/>
                              </linearGradient>
                            </defs>
                            <Pie
                              data={currentMetrics.statusDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="count"
                              label={(entry: any) => `${entry.count}`}
                            >
                              {currentMetrics.statusDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value: any, name: any, props: any) => {
                                const percent = currentMetrics.totalDecisions > 0 
                                  ? ((value / currentMetrics.totalDecisions) * 100).toFixed(1) 
                                  : 0;
                                return [`${value} (${percent}%)`, props.payload.status];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {currentMetrics.statusDistribution.map((item: any, index: number) => {
                          const percentage = currentMetrics.totalDecisions > 0 
                            ? ((item.count / currentMetrics.totalDecisions) * 100).toFixed(0)
                            : 0;
                          return (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4" style={{ borderColor: item.fill }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-gray-700">{item.status}</span>
                                <span className="text-xs text-gray-500">{percentage}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: item.fill
                                    }}
                                  />
                                </div>
                                <span className="text-lg font-bold text-gray-900">{item.count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm">No status data available</p>
                        <p className="text-xs text-gray-400 mt-1">Run analyses to see completion breakdown</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Confidence Analysis - Enhanced with Agent Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mb-6"
            >
              <Card className="glass-card hover-lift border-2 border-gray-200 shadow-lg">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-black text-lg flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      AI Performance & Confidence Analytics
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        Avg: {currentMetrics.avgConfidence}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {currentMetrics.confidenceData.length} analyses
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {(() => {
                      const avg = currentMetrics.avgConfidence;
                      if (avg >= 95) return "🌟 Outstanding: AI shows exceptional confidence across all analyses";
                      if (avg >= 85) return "✨ Excellent: High confidence with reliable predictions";
                      if (avg >= 75) return "👍 Good: Solid performance with room for improvement";
                      if (avg >= 60) return "⚠️ Moderate: Some uncertainty detected in analyses";
                      return "🔴 Low: AI confidence below optimal - review data quality";
                    })()}
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  {currentMetrics.confidenceData.length > 0 ? (
                    <div className="space-y-6">
                      {/* Confidence Trend Chart */}
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={currentMetrics.confidenceData}>
                          <defs>
                            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="decision" 
                            fontSize={11} 
                            stroke="#6b7280"
                            angle={-30}
                            textAnchor="end"
                            height={80}
                            tick={{ fill: '#374151' }}
                          />
                          <YAxis 
                            fontSize={12} 
                            stroke="#6b7280" 
                            domain={[0, 100]}
                            tick={{ fill: '#374151' }}
                            label={{ value: 'Confidence %', angle: -90, position: 'insideLeft', style: { fill: '#374151' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                            formatter={(value: any) => [`${value}%`, 'Confidence']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="confidence" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, fill: '#059669' }}
                            fill="url(#colorConfidence)"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Agent Performance Breakdown */}
                      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span>🤖</span> Four Pillars Agent Performance
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {(() => {
                            // Get all decisions from recentDecisions
                            const allDecisions = recentDecisions || [];
                            
                            // Calculate agent-specific metrics
                            const agentStats = allDecisions.reduce((acc: any, decision: any) => {
                              const agentType = decision.agent || 'Unknown';
                              if (!acc[agentType]) {
                                acc[agentType] = { total: 0, sumConfidence: 0 };
                              }
                              acc[agentType].total++;
                              acc[agentType].sumConfidence += decision.confidenceScore || 0;
                              return acc;
                            }, {});

                            // Agent configuration
                            const agentConfig: any = {
                              'Finance': { icon: '💰', color: 'emerald', bg: 'from-emerald-400 to-emerald-600' },
                              'Risk': { icon: '⚠️', color: 'orange', bg: 'from-orange-400 to-orange-600' },
                              'Compliance': { icon: '⚖️', color: 'blue', bg: 'from-blue-400 to-blue-600' },
                              'Market': { icon: '📊', color: 'purple', bg: 'from-purple-400 to-purple-600' }
                            };

                            const agents = ['Finance', 'Risk', 'Compliance', 'Market'];
                            
                            return agents.map(agent => {
                              const stats = agentStats[agent] || { total: 0, sumConfidence: 0 };
                              const avgConf = stats.total > 0 ? (stats.sumConfidence / stats.total).toFixed(1) : 0;
                              const config = agentConfig[agent];
                              
                              return (
                                <div key={agent} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{config.icon}</span>
                                    <p className="text-xs font-semibold text-gray-700">{agent}</p>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900 mb-1">{avgConf}%</p>
                                  <p className="text-xs text-gray-500 mb-2">{stats.total} analyses</p>
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full bg-gradient-to-r ${config.bg} transition-all duration-500`}
                                      style={{ width: `${avgConf}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Key Performance Insights */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <p className="text-xs text-emerald-700 font-medium mb-1">Highest Confidence</p>
                          <p className="text-xl font-bold text-emerald-900">
                            {currentMetrics.confidenceData.length > 0 
                              ? Math.max(...currentMetrics.confidenceData.map((d: any) => d.confidence))
                              : 0}%
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">Peak performance achieved</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium mb-1">Consistency Score</p>
                          <p className="text-xl font-bold text-blue-900">
                            {(() => {
                              const scores = currentMetrics.confidenceData.map((d: any) => d.confidence);
                              if (scores.length === 0) return 0;
                              const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
                              const variance = scores.reduce((sum: number, score: number) => 
                                sum + Math.pow(score - avg, 2), 0) / scores.length;
                              const stdDev = Math.sqrt(variance);
                              const consistency = Math.max(0, 100 - stdDev * 2);
                              return consistency.toFixed(0);
                            })()}%
                          </p>
                          <p className="text-xs text-blue-600 mt-1">Performance stability</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <p className="text-xs text-purple-700 font-medium mb-1">Reliability Index</p>
                          <p className="text-xl font-bold text-purple-900">
                            {(() => {
                              const highConfCount = currentMetrics.confidenceData.filter((d: any) => d.confidence >= 85).length;
                              const reliability = currentMetrics.confidenceData.length > 0 
                                ? ((highConfCount / currentMetrics.confidenceData.length) * 100).toFixed(0) 
                                : 0;
                              return reliability;
                            })()}%
                          </p>
                          <p className="text-xs text-purple-600 mt-1">Analyses above 85%</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm">No confidence data available</p>
                        <p className="text-xs text-gray-400 mt-1">Run analyses to see AI performance metrics</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Strategic Decisions - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <Card className="glass-card hover-lift border-2 border-gray-200 shadow-lg">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-black text-lg flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Recent Strategic Decisions
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      {recentDecisions.length} analyses
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {recentDecisions.length > 0 ? (
                    <div className="space-y-3">
                      {recentDecisions.slice(0, 10).map((decision: any) => (
                        <div 
                          key={decision.id}
                          className="group flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                        >
                          <div className="flex-1 mr-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {decision.scenario.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-black text-sm leading-tight mb-1.5 group-hover:text-emerald-600 transition-colors">
                                  {decision.scenario}
                                </h4>
                                <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <span>📅</span>
                                    {new Date(decision.timestamp).toLocaleDateString()}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <span>⏱️</span>
                                    {decision.execution_time_seconds.toFixed(1)}s
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <span>🤖</span>
                                    {decision.agents_utilized.length} agents
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Badge 
                              variant={
                                decision.priority === 'critical' ? 'destructive' :
                                decision.priority === 'high' ? 'default' : 'secondary'
                              }
                              className="text-xs font-semibold px-3 py-1"
                            >
                              {decision.priority}
                            </Badge>
                            <div className="text-right bg-emerald-50 rounded-lg px-4 py-2 border border-emerald-200">
                              <div className="text-2xl font-bold text-emerald-600">
                                {decision.overall_confidence}%
                              </div>
                              <div className="text-xs text-emerald-700 font-medium">confidence</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="text-4xl mb-4">📭</div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Recent Decisions</h3>
                      <p className="text-gray-500 text-sm">
                        Run analyses from the Dashboard to see them here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
