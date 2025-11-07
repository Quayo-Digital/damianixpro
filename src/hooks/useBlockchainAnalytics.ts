// Blockchain Analytics Hook
// React hook for real-time blockchain analytics and AI-powered investment insights

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { blockchainAnalyticsService } from '@/services/blockchain/blockchainAnalyticsService';
import {
  MarketAnalytics,
  PortfolioAnalytics,
  InvestmentInsight,
  InvestmentOpportunity,
  RiskFactor,
  MarketPrediction,
  AnalyticsFilter,
  AIAnalysisRequest,
  AIAnalysisResponse,
  RealTimeUpdate,
  AlertConfig,
  AnalyticsDashboardConfig,
  TimeFrame,
  NetworkType
} from '@/types/blockchainAnalytics';
import { toast } from 'sonner';

interface UseBlockchainAnalyticsOptions {
  userId?: string;
  walletAddress?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
}

export function useBlockchainAnalytics(options: UseBlockchainAnalyticsOptions = {}) {
  const {
    userId,
    walletAddress,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    enableRealTime = true
  } = options;

  const queryClient = useQueryClient();
  const { hasFeatureAccess, checkFeatureUsage } = useSubscription();
  
  // State for real-time updates
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('24h');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('ethereum');
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilter>({});

  // Check feature access
  const canUseAnalytics = hasFeatureAccess('blockchain_analytics');
  const canUseAIInsights = hasFeatureAccess('ai_insights');
  const canUseRealTime = hasFeatureAccess('real_time_analytics');

  // Market Analytics Query
  const {
    data: marketAnalytics,
    isLoading: isLoadingMarket,
    error: marketError,
    refetch: refetchMarket
  } = useQuery({
    queryKey: ['blockchain-market-analytics', analyticsFilters, selectedTimeframe],
    queryFn: () => blockchainAnalyticsService.getMarketAnalytics(analyticsFilters),
    enabled: canUseAnalytics,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000, // 30 seconds
    retry: 3
  });

  // Portfolio Analytics Query
  const {
    data: portfolioAnalytics,
    isLoading: isLoadingPortfolio,
    error: portfolioError,
    refetch: refetchPortfolio
  } = useQuery({
    queryKey: ['blockchain-portfolio-analytics', userId, walletAddress],
    queryFn: () => {
      if (!userId || !walletAddress) {
        throw new Error('User ID and wallet address required for portfolio analytics');
      }
      return blockchainAnalyticsService.getPortfolioAnalytics(userId, walletAddress);
    },
    enabled: canUseAnalytics && !!userId && !!walletAddress,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 60000, // 1 minute
    retry: 3
  });

  // AI Analysis Mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: async (request: AIAnalysisRequest) => {
      if (!canUseAIInsights) {
        throw new Error('AI insights feature not available in your subscription plan');
      }

      const usage = await checkFeatureUsage('ai_insights');
      if (usage.limitReached) {
        throw new Error(`AI insights limit reached. Used ${usage.used}/${usage.limit} this month.`);
      }

      return blockchainAnalyticsService.generateAIInsights(request);
    },
    onSuccess: (data: AIAnalysisResponse) => {
      toast.success('AI analysis completed successfully');
      
      // Update relevant queries with new insights
      queryClient.setQueryData(
        ['ai-insights', data.type],
        (oldData: AIAnalysisResponse[] = []) => [data, ...oldData.slice(0, 9)]
      );
    },
    onError: (error: Error) => {
      toast.error(`AI analysis failed: ${error.message}`);
    }
  });

  // Real-time Updates Setup
  useEffect(() => {
    if (!enableRealTime || !canUseRealTime || !userId) return;

    const handleUpdate = (update: RealTimeUpdate) => {
      setRealTimeUpdates(prev => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
      
      // Update relevant queries based on update type
      if (update.type === 'price' && update.propertyId) {
        queryClient.invalidateQueries({
          queryKey: ['blockchain-portfolio-analytics', userId, walletAddress]
        });
      }
      
      if (update.type === 'insight') {
        toast.info('New market insight available', {
          description: 'Check your analytics dashboard for the latest insights.'
        });
      }
    };

    blockchainAnalyticsService.subscribeToUpdates(userId, handleUpdate);
    setIsConnected(true);

    return () => {
      blockchainAnalyticsService.unsubscribeFromUpdates(userId);
      setIsConnected(false);
    };
  }, [enableRealTime, canUseRealTime, userId, walletAddress, queryClient]);

  // Analytics Actions
  const generateMarketAnalysis = useCallback(async () => {
    if (!canUseAIInsights) {
      toast.error('AI insights not available in your plan');
      return;
    }

    return aiAnalysisMutation.mutateAsync({
      type: 'market_analysis',
      data: { timeframe: selectedTimeframe, network: selectedNetwork },
      parameters: { confidence_threshold: 0.7 },
      userId: userId || 'anonymous'
    });
  }, [aiAnalysisMutation, canUseAIInsights, selectedTimeframe, selectedNetwork, userId]);

  const optimizePortfolio = useCallback(async () => {
    if (!canUseAIInsights || !walletAddress) {
      toast.error('Portfolio optimization requires AI insights and wallet connection');
      return;
    }

    return aiAnalysisMutation.mutateAsync({
      type: 'portfolio_optimization',
      data: { walletAddress, portfolio: portfolioAnalytics },
      parameters: { risk_tolerance: 'medium', optimization_goal: 'balanced' },
      userId: userId || 'anonymous'
    });
  }, [aiAnalysisMutation, canUseAIInsights, walletAddress, portfolioAnalytics, userId]);

  const assessRisks = useCallback(async () => {
    if (!canUseAIInsights) {
      toast.error('Risk assessment requires AI insights');
      return;
    }

    return aiAnalysisMutation.mutateAsync({
      type: 'risk_assessment',
      data: { market: marketAnalytics, portfolio: portfolioAnalytics },
      parameters: { risk_horizon: '30d', sensitivity: 'high' },
      userId: userId || 'anonymous'
    });
  }, [aiAnalysisMutation, canUseAIInsights, marketAnalytics, portfolioAnalytics, userId]);

  const detectOpportunities = useCallback(async () => {
    if (!canUseAIInsights) {
      toast.error('Opportunity detection requires AI insights');
      return;
    }

    return aiAnalysisMutation.mutateAsync({
      type: 'opportunity_detection',
      data: { market: marketAnalytics, filters: analyticsFilters },
      parameters: { min_confidence: 0.8, max_risk: 'medium' },
      userId: userId || 'anonymous'
    });
  }, [aiAnalysisMutation, canUseAIInsights, marketAnalytics, analyticsFilters, userId]);

  // Filter and Settings Management
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilter>) => {
    setAnalyticsFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateTimeframe = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
  }, []);

  const updateNetwork = useCallback((network: NetworkType) => {
    setSelectedNetwork(network);
  }, []);

  // Refresh Functions
  const refreshAll = useCallback(async () => {
    const promises = [];
    
    if (canUseAnalytics) {
      promises.push(refetchMarket());
      
      if (userId && walletAddress) {
        promises.push(refetchPortfolio());
      }
    }

    try {
      await Promise.all(promises);
      toast.success('Analytics data refreshed');
    } catch (error) {
      toast.error('Failed to refresh analytics data');
    }
  }, [canUseAnalytics, refetchMarket, refetchPortfolio, userId, walletAddress]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['blockchain-market-analytics'] });
    queryClient.removeQueries({ queryKey: ['blockchain-portfolio-analytics'] });
    queryClient.removeQueries({ queryKey: ['ai-insights'] });
    setRealTimeUpdates([]);
    toast.success('Analytics cache cleared');
  }, [queryClient]);

  // Computed Values
  const isLoading = isLoadingMarket || isLoadingPortfolio || aiAnalysisMutation.isPending;
  const hasError = marketError || portfolioError || aiAnalysisMutation.error;
  
  const insights: InvestmentInsight[] = [
    ...(marketAnalytics?.trends?.map(trend => ({
      id: `trend-${trend.id}`,
      type: trend.changePercentage > 0 ? 'bullish' : 'bearish',
      title: `${trend.metric} ${trend.changePercentage > 0 ? 'Rising' : 'Falling'}`,
      description: `${trend.metric} has ${trend.changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend.changePercentage).toFixed(1)}% in the last ${trend.period}`,
      confidence: 75,
      impact: Math.abs(trend.changePercentage) > 5 ? 'high' : 'medium',
      timeframe: 'short',
      propertyIds: [],
      metrics: [
        { name: trend.metric, value: trend.value, unit: '', change: trend.change }
      ],
      aiGenerated: false,
      createdAt: trend.timestamp
    })) || []),
    ...(portfolioAnalytics?.recommendations?.map(rec => ({
      id: `portfolio-${rec.id}`,
      type: rec.type === 'buy' ? 'bullish' : rec.type === 'sell' ? 'bearish' : 'neutral',
      title: rec.title,
      description: rec.description,
      confidence: rec.confidence,
      impact: rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'medium' : 'low',
      timeframe: rec.timeframe.includes('month') ? 'medium' : 'short',
      propertyIds: rec.propertyIds,
      metrics: [],
      aiGenerated: rec.aiGenerated,
      createdAt: rec.createdAt
    })) || [])
  ];

  const opportunities: InvestmentOpportunity[] = marketAnalytics?.opportunities || [];
  const risks: RiskFactor[] = marketAnalytics?.riskFactors || [];
  const predictions: MarketPrediction[] = marketAnalytics?.predictions || [];

  // Analytics Summary
  const analyticsSummary = {
    totalValue: portfolioAnalytics?.totalValue || 0,
    totalChange: portfolioAnalytics?.totalValueChange24h || 0,
    totalChangePercentage: portfolioAnalytics?.totalValueChangePercentage || 0,
    marketCap: marketAnalytics?.overview?.totalMarketCap || 0,
    volume24h: marketAnalytics?.overview?.totalVolume24h || 0,
    sentiment: marketAnalytics?.overview?.sentiment || 'neutral',
    sentimentScore: marketAnalytics?.overview?.sentimentScore || 50,
    riskScore: portfolioAnalytics?.riskScore || 50,
    performanceScore: portfolioAnalytics?.performanceScore || 50,
    diversificationScore: portfolioAnalytics?.diversificationScore || 50
  };

  return {
    // Data
    marketAnalytics,
    portfolioAnalytics,
    insights,
    opportunities,
    risks,
    predictions,
    realTimeUpdates,
    analyticsSummary,

    // State
    isLoading,
    hasError,
    isConnected,
    selectedTimeframe,
    selectedNetwork,
    analyticsFilters,

    // Feature Access
    canUseAnalytics,
    canUseAIInsights,
    canUseRealTime,

    // Actions
    generateMarketAnalysis,
    optimizePortfolio,
    assessRisks,
    detectOpportunities,
    updateFilters,
    updateTimeframe,
    updateNetwork,
    refreshAll,
    clearCache,

    // Mutations
    aiAnalysis: aiAnalysisMutation
  };
}
