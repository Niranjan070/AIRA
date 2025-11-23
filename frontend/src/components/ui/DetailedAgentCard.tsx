import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DollarSign, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { DetailedAgentAnalysis } from '@/types';

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  AlertTriangle,
  Shield,
  TrendingUp,
};

interface DetailedAgentCardProps {
  analysis: DetailedAgentAnalysis;
}

export function DetailedAgentCard({ analysis }: DetailedAgentCardProps) {
  const IconComponent = iconComponents[analysis.icon] || DollarSign;
  
  const getBackgroundColor = () => {
    switch (analysis.id) {
      case 'finance': return 'bg-green-500';
      case 'risk': return 'bg-orange-500';
      case 'compliance': return 'bg-blue-500';
      case 'market': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <Card className="glass-card hover-lift interactive-border h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getBackgroundColor()}`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-black">{analysis.name}</h3>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Financial Metrics */}
        {analysis.costImpact && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Cost Impact</span>
              <span className="font-bold text-lg text-black">{analysis.costImpact}</span>
            </div>
            
            {analysis.revenueImpact && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Revenue Impact</span>
                <span className="font-bold text-lg text-black">{analysis.revenueImpact}</span>
              </div>
            )}
            
            {analysis.roiEstimate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">ROI Estimate</span>
                <span className="font-bold text-lg text-black">{analysis.roiEstimate}</span>
              </div>
            )}
            
            {analysis.budgetRequired && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Budget Required</span>
                <span className="font-bold text-lg text-black">{analysis.budgetRequired}</span>
              </div>
            )}
          </div>
        )}

        {/* Risk Metrics */}
        {analysis.riskScore && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Risk Score</span>
              <span className="font-bold text-lg text-black">{analysis.riskScore}</span>
            </div>
            
            {analysis.successProbability && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Success Probability</span>
                <span className="font-bold text-lg text-black">{analysis.successProbability}</span>
              </div>
            )}
            
            {analysis.riskFactors && (
              <div className="space-y-2">
                <span className="text-gray-600 block text-sm">Risk Factors</span>
                <div className="flex flex-wrap gap-1">
                  {analysis.riskFactors.map((factor, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliance Metrics */}
        {analysis.complianceScore && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Compliance Score</span>
              <span className="font-bold text-lg text-black">{analysis.complianceScore}</span>
            </div>
            
            {analysis.legalConsiderations && (
              <div className="space-y-2">
                <span className="text-gray-600 block text-sm">Legal Considerations</span>
                <div className="flex flex-wrap gap-1">
                  {analysis.legalConsiderations.map((consideration, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                      {consideration}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Metrics */}
        {analysis.marketOpportunity && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Market Opportunity</span>
              <span className="font-bold text-lg text-black">{analysis.marketOpportunity}</span>
            </div>
            
            {analysis.marketTrends && (
              <div className="space-y-2">
                <span className="text-gray-600 block text-sm">Market Trends</span>
                <div className="space-y-1">
                  {analysis.marketTrends.map((trend, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                      {trend}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-black mb-2">Recommendation</h4>
          <p className="text-gray-600 text-xs leading-relaxed">
            {analysis.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
