import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KpiMetric } from '@/types';

interface KpiCardProps {
  metric: KpiMetric;
}

export function KpiCard({ metric }: KpiCardProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <Card className="glass-card hover-lift interactive-border cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">{metric.title}</p>
          <div className="group-hover:scale-110 transition-transform duration-300">
            {getTrendIcon()}
          </div>
        </div>
        <p className="text-3xl font-bold text-black group-hover:text-gray-800 transition-colors mb-3">{metric.value}</p>
        <div className="flex items-center">
          <span className={`text-sm font-medium ${getTrendColor()} group-hover:scale-105 transition-transform`}>
            {metric.change}
          </span>
          <span className="text-sm text-gray-500 ml-2 group-hover:text-gray-600 transition-colors">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}