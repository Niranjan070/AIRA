// Hook for managing reports data - ONLY REAL ANALYSIS DATA, NO SAMPLE/MOCK DATA
import { useState, useEffect } from 'react';
import { reportsService, ReportsMetrics, AnalysisRecord } from '@/services/reportsService';
import { useAgents } from '@/contexts/AgentContext';
import { apiService } from '@/services/api';

export function useReports() {
  const [metrics, setMetrics] = useState<ReportsMetrics | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  const { completedAnalyses } = useAgents(); // Get real analysis results from AgentContext

  // Check for real data and populate from completed analyses
  const checkForRealData = async () => {
    console.log('🔍 Checking for real analysis data from AgentContext...');
    setIsLoading(true);
    
    try {
      // Check backend connectivity
      await apiService.healthCheck();
      console.log('✅ Backend connection verified');
      setHasRealData(true);
      
      // Get real analysis data from AgentContext
      if (completedAnalyses && completedAnalyses.length > 0) {
        console.log(`📊 Found ${completedAnalyses.length} real analyses in AgentContext`);
        
        // Clear any existing data first
        reportsService.clearHistory();
        
        // Add each real analysis to reports
        completedAnalyses.forEach(analysis => {
          console.log('➕ Adding real analysis to reports:', analysis.scenario);
          reportsService.addAnalysis(analysis);
        });
        
        console.log('🎉 Successfully loaded all real analysis data into reports!');
      } else {
        console.log('📭 No real analysis data found yet. Run some analyses from the Dashboard first.');
      }
      
    } catch (error) {
      console.warn('⚠️ Backend connection failed:', error);
      setHasRealData(false);
      
      // Still try to load from AgentContext if backend is down
      if (completedAnalyses && completedAnalyses.length > 0) {
        console.log('📊 Using cached real data from AgentContext');
        completedAnalyses.forEach(analysis => {
          reportsService.addAnalysis(analysis);
        });
      }
    }
    
    // Refresh display
    refreshData();
  };

  // Refresh reports data from storage
  const refreshData = () => {
    try {
      const newMetrics = reportsService.getReportsMetrics();
      const recent = reportsService.getRecentDecisions(15);
      
      setMetrics(newMetrics);
      setRecentDecisions(recent);
      
      console.log('📊 Reports data refreshed:', { analyses: newMetrics.totalDecisions, recent: recent.length });
    } catch (error) {
      console.error('Failed to refresh reports data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all data (for reset only)
  const clearAllData = () => {
    reportsService.clearHistory();
    refreshData();
  };

  // Initial load
  useEffect(() => {
    console.log('🚀 Initializing Reports - checking for real data only...');
    setIsLoading(true);
    refreshData(); // Load any existing data first
  }, []);

  // Watch for new analyses completing in real-time
  useEffect(() => {
    if (completedAnalyses && completedAnalyses.length > 0) {
      console.log('📊 New real analysis detected in AgentContext, updating reports...');
      
      // Add the latest analysis if it's not already in our local storage
      const latestAnalysis = completedAnalyses[0];
      const existingAnalyses = reportsService.getAllAnalyses();
      
      // Check if this analysis is already stored (by timestamp and scenario)
      const alreadyStored = existingAnalyses.some(existing => 
        existing.timestamp === latestAnalysis.timestamp && 
        existing.scenario === latestAnalysis.scenario
      );
      
      if (!alreadyStored) {
        console.log('➕ Adding new real analysis to reports');
        reportsService.addAnalysis(latestAnalysis);
        refreshData();
      }
    }
  }, [completedAnalyses]);

  const hasData = (metrics?.totalDecisions || 0) > 0;
  const totalAnalyses = metrics?.totalDecisions || 0;

  return {
    metrics,
    recentDecisions,
    isLoading,
    clearAllData,
    hasData,
    totalAnalyses,
    hasRealData,
    checkForRealData
  };
}