import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useSystemStatus } from '@/hooks/useAnalysis';

export function SystemStatus() {
  const { status, loading, error, checkStatus, checkHealth } = useSystemStatus();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial status
    checkSystemHealth();
    
    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      const healthy = await checkHealth();
      setIsOnline(healthy);
      if (healthy) {
        await checkStatus();
      }
    } catch {
      setIsOnline(false);
    }
  };

  const getStatusColor = () => {
    if (isOnline === null || loading) return 'text-gray-500';
    return isOnline ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = () => {
    if (isOnline === null || loading) {
      return <Badge variant="outline" className="text-gray-600">Checking...</Badge>;
    }
    
    if (isOnline) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
    }
    
    return <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>;
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />;
    if (isOnline === null) return <Wifi className="w-5 h-5 text-gray-500" />;
    return isOnline ? 
      <CheckCircle className="w-5 h-5 text-green-600" /> : 
      <WifiOff className="w-5 h-5 text-red-600" />;
  };

  return (
    <Card className="glass-card border-2 border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Four Pillars AI Backend
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-gray-600">Status:</span>
            <div className={`font-medium ${getStatusColor()}`}>
              {isOnline === null ? 'Checking...' : isOnline ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-600">Endpoint:</span>
            <div className="font-mono text-xs text-gray-700">
              localhost:8000
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Connection Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {status && (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-gray-600">Available Agents:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {['Finance', 'Risk', 'Compliance', 'Market'].map((agent) => (
                  <Badge key={agent} variant="outline" className="text-xs">
                    {agent}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemHealth}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {isOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
              className="text-blue-600 hover:text-blue-700"
            >
              API Docs
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
