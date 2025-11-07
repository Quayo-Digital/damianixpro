// Blockchain Analytics Types
// Real-time analytics and AI-powered insights for blockchain property investments

export interface MarketTrend {
  id: string;
  metric: string;
  value: number;
  change: number;
  changePercentage: number;
  period: '24h' | '7d' | '30d' | '90d' | '1y';
  timestamp: Date;
  network: string;
}

export interface PropertyMarketData {
  propertyId: string;
  tokenId: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  volume24h: number;
  marketCap: number;
  holders: number;
  transactions: number;
  liquidity: number;
  volatility: number;
  roi: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  ranking: number;
  network: string;
}

export interface PricePoint {
  timestamp: Date;
  price: number;
  volume: number;
  marketCap: number;
}

export interface InvestmentInsight {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'opportunity' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  propertyIds: string[];
  metrics: InsightMetric[];
  aiGenerated: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface InsightMetric {
  name: string;
  value: number;
  unit: string;
  change?: number;
  benchmark?: number;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalValueChange24h: number;
  totalValueChangePercentage: number;
  diversificationScore: number;
  riskScore: number;
  performanceScore: number;
  properties: PropertyPerformance[];
  allocation: AllocationBreakdown;
  recommendations: InvestmentRecommendation[];
}

export interface PropertyPerformance {
  propertyId: string;
  tokenId: string;
  name: string;
  value: number;
  valueChange24h: number;
  valueChangePercentage: number;
  weight: number; // percentage of portfolio
  performance: 'outperforming' | 'underperforming' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AllocationBreakdown {
  byLocation: Record<string, number>;
  byPropertyType: Record<string, number>;
  byNetwork: Record<string, number>;
  byRiskLevel: Record<string, number>;
}

export interface InvestmentRecommendation {
  id: string;
  type: 'buy' | 'sell' | 'hold' | 'diversify' | 'rebalance';
  title: string;
  description: string;
  reasoning: string[];
  confidence: number;
  potentialReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  propertyIds: string[];
  priority: 'low' | 'medium' | 'high';
  aiGenerated: boolean;
  createdAt: Date;
}

export interface MarketAnalytics {
  overview: MarketOverview;
  trends: MarketTrend[];
  topPerformers: PropertyMarketData[];
  opportunities: InvestmentOpportunity[];
  riskFactors: RiskFactor[];
  predictions: MarketPrediction[];
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  activeProperties: number;
  averagePrice: number;
  priceChange24h: number;
  volumeChange24h: number;
  dominanceByNetwork: Record<string, number>;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
}

export interface InvestmentOpportunity {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  opportunityType: 'undervalued' | 'growth' | 'yield' | 'arbitrage' | 'emerging';
  potentialReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  timeframe: string;
  requiredInvestment: number;
  metrics: OpportunityMetric[];
  aiAnalysis: string;
  createdAt: Date;
}

export interface OpportunityMetric {
  name: string;
  value: number;
  benchmark: number;
  interpretation: string;
}

export interface RiskFactor {
  id: string;
  type: 'market' | 'technical' | 'regulatory' | 'liquidity' | 'operational';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  affectedProperties: string[];
  mitigation: string[];
  createdAt: Date;
}

export interface MarketPrediction {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: '1d' | '7d' | '30d' | '90d' | '1y';
  methodology: string;
  factors: PredictionFactor[];
  createdAt: Date;
}

export interface PredictionFactor {
  name: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface AnalyticsFilter {
  networks?: string[];
  propertyTypes?: string[];
  locations?: string[];
  priceRange?: [number, number];
  timeframe?: string;
  riskLevels?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AnalyticsQuery {
  type: 'market' | 'portfolio' | 'property' | 'insights' | 'opportunities';
  filters: AnalyticsFilter;
  metrics: string[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
}

export interface AnalyticsResponse<T = any> {
  data: T;
  metadata: {
    total: number;
    page: number;
    limit: number;
    lastUpdated: Date;
    dataSource: string;
    confidence: number;
  };
  insights?: InvestmentInsight[];
  recommendations?: InvestmentRecommendation[];
}

export interface RealTimeUpdate {
  type: 'price' | 'volume' | 'transaction' | 'insight' | 'alert';
  propertyId?: string;
  data: any;
  timestamp: Date;
  network: string;
}

export interface AlertConfig {
  id: string;
  userId: string;
  name: string;
  type: 'price' | 'volume' | 'performance' | 'opportunity' | 'risk';
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  createdAt: Date;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change_gt' | 'change_lt';
  value: number;
  timeframe?: string;
}

export interface AlertAction {
  type: 'email' | 'push' | 'sms' | 'webhook';
  target: string;
  template?: string;
}

export interface AnalyticsError extends Error {
  code: string;
  details?: any;
  retryable: boolean;
}

// AI-Powered Analytics Types
export interface AIAnalysisRequest {
  type: 'market_analysis' | 'portfolio_optimization' | 'risk_assessment' | 'opportunity_detection';
  data: any;
  parameters: Record<string, any>;
  userId: string;
}

export interface AIAnalysisResponse {
  id: string;
  type: string;
  insights: InvestmentInsight[];
  recommendations: InvestmentRecommendation[];
  confidence: number;
  methodology: string;
  dataPoints: number;
  processingTime: number;
  createdAt: Date;
}

export interface MLModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'clustering' | 'forecasting';
  version: string;
  accuracy: number;
  lastTrained: Date;
  features: string[];
  parameters: Record<string, any>;
}

export interface PredictiveModel {
  priceForecasting: MLModel;
  riskAssessment: MLModel;
  opportunityDetection: MLModel;
  marketSentiment: MLModel;
}

// Dashboard Configuration
export interface AnalyticsDashboardConfig {
  userId: string;
  layout: DashboardLayout[];
  preferences: DashboardPreferences;
  alerts: AlertConfig[];
  lastUpdated: Date;
}

export interface DashboardLayout {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'insight' | 'recommendation';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  visible: boolean;
}

export interface DashboardPreferences {
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  defaultTimeframe: string;
  defaultNetwork: string;
  notifications: boolean;
  autoRefresh: boolean;
  compactMode: boolean;
}

// Export utility types
export type AnalyticsMetric = keyof MarketOverview | keyof PropertyMarketData | keyof PortfolioAnalytics;
export type TimeFrame = '1h' | '4h' | '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
export type NetworkType = 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'optimism';
export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'land' | 'mixed';
export type RiskLevel = 'low' | 'medium' | 'high';
export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'poor';
