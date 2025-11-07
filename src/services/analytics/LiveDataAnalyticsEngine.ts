/**
 * Live Data Enhanced Analytics Engine
 * Integrates with Nigerian Real Estate Data Service for real-time market intelligence
 */

import NigerianRealEstateDataService, { 
  PropertyListingData, 
  EconomicIndicator, 
  MunicipalData, 
  MarketData 
} from '../data/NigerianRealEstateDataService';

import RealEstateAnalyticsEngine, {
  MarketTrend,
  InvestmentAnalysis,
  NeighborhoodInsights,
  PredictiveInsights
} from './RealEstateAnalyticsEngine';

export interface LiveMarketInsights {
  marketTrend: MarketTrend;
  liveListings: PropertyListingData[];
  economicContext: EconomicIndicator[];
  municipalContext: MunicipalData | null;
  marketData: MarketData;
  lastUpdated: string;
  dataQuality: {
    listingsCount: number;
    economicIndicatorsCount: number;
    municipalDataAvailable: boolean;
    confidenceScore: number; // 0-100
  };
}

export interface LiveInvestmentAnalysis extends InvestmentAnalysis {
  liveMarketComparison: {
    similarProperties: PropertyListingData[];
    marketPosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
    competitiveAdvantage: string[];
    marketRisks: string[];
  };
  economicImpact: {
    inflationAdjustedROI: number;
    currencyRisk: number;
    interestRateImpact: number;
  };
}

export interface RealTimeMarketAlert {
  id: string;
  type: 'PRICE_CHANGE' | 'NEW_LISTING' | 'MARKET_SHIFT' | 'ECONOMIC_UPDATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  location: string;
  propertyType?: string;
  data: any;
  timestamp: string;
  actionRequired: boolean;
  recommendations: string[];
}

export class LiveDataAnalyticsEngine extends RealEstateAnalyticsEngine {
  private dataService: NigerianRealEstateDataService;
  private alertSubscribers: Map<string, (alert: RealTimeMarketAlert) => void> = new Map();
  private lastMarketData: Map<string, MarketData> = new Map();
  private alertThresholds = {
    priceChangePercent: 0.05, // 5% price change triggers alert
    newListingsThreshold: 20, // 20+ new listings triggers alert
    economicChangePercent: 0.02 // 2% economic indicator change triggers alert
  };

  constructor() {
    super();
    this.dataService = new NigerianRealEstateDataService();
    this.initializeRealTimeMonitoring();
  }

  /**
   * Get comprehensive live market insights
   */
  async getLiveMarketInsights(location: string, propertyType: string): Promise<LiveMarketInsights> {
    try {
      // Fetch all data in parallel
      const [marketTrend, liveListings, economicContext, municipalContext, marketData] = await Promise.all([
        this.analyzeMarketTrends(location, propertyType as any),
        this.dataService.fetchPropertyListings({ location, propertyType, limit: 100 }),
        this.dataService.fetchEconomicIndicators(),
        this.dataService.fetchMunicipalData(location),
        this.dataService.calculateMarketData(location, propertyType)
      ]);

      // Calculate data quality score
      const dataQuality = this.calculateDataQuality(liveListings, economicContext, municipalContext);

      // Update market trend with live data
      const enhancedMarketTrend = await this.enhanceMarketTrendWithLiveData(
        marketTrend, 
        marketData, 
        economicContext
      );

      return {
        marketTrend: enhancedMarketTrend,
        liveListings,
        economicContext,
        municipalContext,
        marketData,
        lastUpdated: new Date().toISOString(),
        dataQuality
      };

    } catch (error) {
      console.error('Error getting live market insights:', error);
      // Fallback to base analytics engine
      const fallbackTrend = await this.analyzeMarketTrends(location, propertyType as any);
      return {
        marketTrend: fallbackTrend,
        liveListings: [],
        economicContext: [],
        municipalContext: null,
        marketData: await this.dataService.calculateMarketData(location, propertyType),
        lastUpdated: new Date().toISOString(),
        dataQuality: {
          listingsCount: 0,
          economicIndicatorsCount: 0,
          municipalDataAvailable: false,
          confidenceScore: 30 // Low confidence for fallback data
        }
      };
    }
  }

  /**
   * Enhanced investment analysis with live market data
   */
  async getLiveInvestmentAnalysis(
    propertyId: string, 
    purchasePrice: number, 
    location: string, 
    propertyType: string
  ): Promise<LiveInvestmentAnalysis> {
    try {
      // Get base investment analysis
      const baseAnalysis = await this.analyzeInvestment(propertyId, purchasePrice, location, propertyType);

      // Get live market data for comparison
      const [similarProperties, economicIndicators, marketData] = await Promise.all([
        this.dataService.fetchPropertyListings({
          location,
          propertyType: propertyType as any,
          minPrice: purchasePrice * 0.8,
          maxPrice: purchasePrice * 1.2,
          limit: 50
        }),
        this.dataService.fetchEconomicIndicators(),
        this.dataService.calculateMarketData(location, propertyType)
      ]);

      // Analyze market position
      const marketPosition = this.analyzeMarketPosition(purchasePrice, similarProperties, marketData);
      
      // Calculate economic impact
      const economicImpact = this.calculateEconomicImpact(baseAnalysis, economicIndicators);

      return {
        ...baseAnalysis,
        liveMarketComparison: {
          similarProperties,
          marketPosition: marketPosition.position,
          competitiveAdvantage: marketPosition.advantages,
          marketRisks: marketPosition.risks
        },
        economicImpact
      };

    } catch (error) {
      console.error('Error getting live investment analysis:', error);
      const fallbackAnalysis = await this.analyzeInvestment(propertyId, purchasePrice, location, propertyType);
      return {
        ...fallbackAnalysis,
        liveMarketComparison: {
          similarProperties: [],
          marketPosition: 'AT_MARKET' as const,
          competitiveAdvantage: [],
          marketRisks: ['Limited live data available']
        },
        economicImpact: {
          inflationAdjustedROI: fallbackAnalysis.expectedROI,
          currencyRisk: 50, // Medium risk
          interestRateImpact: 0
        }
      };
    }
  }

  /**
   * Enhanced neighborhood insights with live municipal data
   */
  async getLiveNeighborhoodInsights(location: string): Promise<NeighborhoodInsights> {
    try {
      // Get base neighborhood analysis
      const baseInsights = await this.analyzeNeighborhood(location);

      // Get live municipal data
      const municipalData = await this.dataService.fetchMunicipalData(location);

      if (municipalData) {
        // Enhance insights with live data
        return {
          ...baseInsights,
          populationGrowth: this.calculatePopulationGrowthRate(municipalData),
          averageIncome: municipalData.gdpPerCapita * 12, // Convert to annual
          employmentRate: 100 - municipalData.unemploymentRate,
          infrastructureScore: municipalData.infrastructureScore,
          developmentProjects: municipalData.developmentProjects.map(p => p.name),
          futureOutlook: this.assessFutureOutlookWithLiveData(municipalData),
          investmentGrade: this.calculateInvestmentGradeWithLiveData(municipalData)
        };
      }

      return baseInsights;

    } catch (error) {
      console.error('Error getting live neighborhood insights:', error);
      return this.analyzeNeighborhood(location);
    }
  }

  /**
   * Real-time market monitoring and alerts
   */
  async startRealTimeMonitoring(locations: string[], propertyTypes: string[]): Promise<void> {
    // Monitor market changes every 5 minutes
    setInterval(async () => {
      for (const location of locations) {
        for (const propertyType of propertyTypes) {
          await this.checkForMarketChanges(location, propertyType);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Monitor economic indicators every 30 minutes
    setInterval(async () => {
      await this.checkForEconomicChanges();
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Subscribe to real-time market alerts
   */
  subscribeToAlerts(subscriberId: string, callback: (alert: RealTimeMarketAlert) => void): void {
    this.alertSubscribers.set(subscriberId, callback);
  }

  /**
   * Unsubscribe from real-time market alerts
   */
  unsubscribeFromAlerts(subscriberId: string): void {
    this.alertSubscribers.delete(subscriberId);
  }

  // Private methods for live data enhancement

  private async enhanceMarketTrendWithLiveData(
    baseTrend: MarketTrend,
    marketData: MarketData,
    economicIndicators: EconomicIndicator[]
  ): Promise<MarketTrend> {
    // Use live market data to enhance trend analysis
    const inflationRate = economicIndicators.find(i => i.indicator === 'Inflation Rate')?.value || 18.5;
    const realPriceChange = marketData.priceChange1Year - (inflationRate / 100);

    return {
      ...baseTrend,
      currentAvgPrice: marketData.averagePrice,
      priceChange30Days: marketData.priceChange30Days,
      priceChange90Days: marketData.priceChange90Days,
      priceChange1Year: marketData.priceChange1Year,
      volumeChange: this.calculateVolumeChange(marketData),
      // Adjust scores based on live data
      demandScore: this.calculateLiveDemandScore(marketData),
      supplyScore: this.calculateLiveSupplyScore(marketData),
      liquidityScore: this.calculateLiveLiquidityScore(marketData),
      // Update recommendations based on real price changes
      recommendedAction: this.generateLiveRecommendation(realPriceChange, marketData)
    };
  }

  private calculateDataQuality(
    listings: PropertyListingData[],
    economicIndicators: EconomicIndicator[],
    municipalData: MunicipalData | null
  ): LiveMarketInsights['dataQuality'] {
    let confidenceScore = 0;

    // Listings quality (40% of score)
    if (listings.length > 50) confidenceScore += 40;
    else if (listings.length > 20) confidenceScore += 30;
    else if (listings.length > 5) confidenceScore += 20;
    else confidenceScore += 10;

    // Economic indicators quality (30% of score)
    if (economicIndicators.length >= 5) confidenceScore += 30;
    else if (economicIndicators.length >= 3) confidenceScore += 20;
    else if (economicIndicators.length >= 1) confidenceScore += 10;

    // Municipal data quality (30% of score)
    if (municipalData) confidenceScore += 30;

    return {
      listingsCount: listings.length,
      economicIndicatorsCount: economicIndicators.length,
      municipalDataAvailable: !!municipalData,
      confidenceScore: Math.min(100, confidenceScore)
    };
  }

  private analyzeMarketPosition(
    purchasePrice: number,
    similarProperties: PropertyListingData[],
    marketData: MarketData
  ): {
    position: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
    advantages: string[];
    risks: string[];
  } {
    const marketAverage = marketData.averagePrice;
    const priceRatio = purchasePrice / marketAverage;

    let position: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
    let advantages: string[] = [];
    let risks: string[] = [];

    if (priceRatio < 0.9) {
      position = 'BELOW_MARKET';
      advantages = [
        'Below market average - potential for appreciation',
        'Good entry point for investment',
        'Lower financial risk'
      ];
      risks = [
        'May indicate property issues',
        'Location might be less desirable'
      ];
    } else if (priceRatio > 1.1) {
      position = 'ABOVE_MARKET';
      advantages = [
        'Premium property with unique features',
        'Potential for strong rental yields'
      ];
      risks = [
        'Higher financial exposure',
        'May be overpriced',
        'Longer time to sell if needed'
      ];
    } else {
      position = 'AT_MARKET';
      advantages = [
        'Fair market pricing',
        'Balanced risk-reward profile',
        'Good liquidity potential'
      ];
      risks = [
        'Limited upside potential',
        'Market-dependent performance'
      ];
    }

    return { position, advantages, risks };
  }

  private calculateEconomicImpact(
    baseAnalysis: InvestmentAnalysis,
    economicIndicators: EconomicIndicator[]
  ): LiveInvestmentAnalysis['economicImpact'] {
    const inflationRate = economicIndicators.find(i => i.indicator === 'Inflation Rate')?.value || 18.5;
    const interestRate = economicIndicators.find(i => i.indicator === 'Monetary Policy Rate')?.value || 16.5;
    const exchangeRate = economicIndicators.find(i => i.indicator.includes('Exchange Rate'))?.value || 750;

    // Calculate inflation-adjusted ROI
    const inflationAdjustedROI = baseAnalysis.expectedROI - inflationRate;

    // Calculate currency risk (higher exchange rate = higher risk)
    const currencyRisk = Math.min(100, (exchangeRate - 400) / 10); // Normalize to 0-100

    // Calculate interest rate impact on property values
    const interestRateImpact = (interestRate - 10) * -2; // Higher rates = negative impact

    return {
      inflationAdjustedROI,
      currencyRisk,
      interestRateImpact
    };
  }

  private calculatePopulationGrowthRate(municipalData: MunicipalData): number {
    // Estimate growth rate based on city characteristics
    const baseGrowthRate = 2.5; // Nigeria's average
    let adjustedRate = baseGrowthRate;

    // Adjust based on infrastructure score
    if (municipalData.infrastructureScore > 80) adjustedRate += 1.0;
    else if (municipalData.infrastructureScore > 60) adjustedRate += 0.5;

    // Adjust based on unemployment rate
    if (municipalData.unemploymentRate < 20) adjustedRate += 0.5;
    else if (municipalData.unemploymentRate > 30) adjustedRate -= 0.5;

    // Adjust based on development projects
    if (municipalData.developmentProjects.length > 3) adjustedRate += 0.3;

    return Math.max(0, adjustedRate);
  }

  private assessFutureOutlookWithLiveData(municipalData: MunicipalData): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
    let score = 0;

    // Infrastructure score impact
    if (municipalData.infrastructureScore > 75) score += 2;
    else if (municipalData.infrastructureScore > 50) score += 1;
    else score -= 1;

    // Unemployment rate impact
    if (municipalData.unemploymentRate < 20) score += 2;
    else if (municipalData.unemploymentRate < 30) score += 1;
    else score -= 1;

    // Development projects impact
    const ongoingProjects = municipalData.developmentProjects.filter(p => p.status === 'ONGOING').length;
    if (ongoingProjects > 2) score += 2;
    else if (ongoingProjects > 0) score += 1;

    if (score >= 3) return 'POSITIVE';
    if (score >= 0) return 'NEUTRAL';
    return 'NEGATIVE';
  }

  private calculateInvestmentGradeWithLiveData(municipalData: MunicipalData): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' {
    let score = 0;

    // Infrastructure (40% weight)
    score += (municipalData.infrastructureScore / 100) * 40;

    // Employment (30% weight)
    const employmentScore = Math.max(0, 100 - municipalData.unemploymentRate);
    score += (employmentScore / 100) * 30;

    // Development activity (20% weight)
    const developmentScore = Math.min(100, municipalData.developmentProjects.length * 20);
    score += (developmentScore / 100) * 20;

    // Economic capacity (10% weight)
    const economicScore = Math.min(100, (municipalData.gdpPerCapita / 10000) * 100);
    score += (economicScore / 100) * 10;

    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C+';
    if (score >= 55) return 'C';
    return 'D';
  }

  // Live market calculation methods
  private calculateVolumeChange(marketData: MarketData): number {
    // Calculate volume change based on new vs total listings
    return (marketData.newListings / marketData.totalListings) - 0.15; // 15% is baseline
  }

  private calculateLiveDemandScore(marketData: MarketData): number {
    // Higher demand = more sold listings, fewer days on market
    const soldRatio = marketData.soldListings / marketData.totalListings;
    const timeScore = Math.max(0, 100 - marketData.averageDaysOnMarket);
    return Math.min(100, (soldRatio * 500) + (timeScore * 0.5));
  }

  private calculateLiveSupplyScore(marketData: MarketData): number {
    // Higher supply = more total listings, more new listings
    const newListingRatio = marketData.newListings / marketData.totalListings;
    const totalListingsScore = Math.min(100, marketData.totalListings / 10);
    return Math.min(100, (newListingRatio * 300) + (totalListingsScore * 0.3));
  }

  private calculateLiveLiquidityScore(marketData: MarketData): number {
    // Higher liquidity = faster sales, more transactions
    const daysOnMarketScore = Math.max(0, 100 - marketData.averageDaysOnMarket);
    const transactionScore = Math.min(100, (marketData.soldListings / marketData.totalListings) * 1000);
    return (daysOnMarketScore + transactionScore) / 2;
  }

  private generateLiveRecommendation(
    realPriceChange: number,
    marketData: MarketData
  ): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    const demandScore = this.calculateLiveDemandScore(marketData);
    const supplyScore = this.calculateLiveSupplyScore(marketData);
    const liquidityScore = this.calculateLiveLiquidityScore(marketData);

    // Strong positive indicators
    if (realPriceChange > 0.1 && demandScore > 70 && liquidityScore > 60) return 'BUY';
    
    // Strong negative indicators
    if (realPriceChange < -0.05 && supplyScore > 80 && demandScore < 40) return 'SELL';
    
    // High uncertainty
    if (liquidityScore < 40 || Math.abs(realPriceChange) > 0.2) return 'WATCH';
    
    // Default to hold
    return 'HOLD';
  }

  // Real-time monitoring methods
  private initializeRealTimeMonitoring(): void {
    console.log('Live Data Analytics Engine initialized with real-time monitoring');
  }

  private async checkForMarketChanges(location: string, propertyType: string): Promise<void> {
    try {
      const currentMarketData = await this.dataService.calculateMarketData(location, propertyType);
      const key = `${location}_${propertyType}`;
      const previousData = this.lastMarketData.get(key);

      if (previousData) {
        // Check for significant price changes
        const priceChangePercent = Math.abs(
          (currentMarketData.averagePrice - previousData.averagePrice) / previousData.averagePrice
        );

        if (priceChangePercent > this.alertThresholds.priceChangePercent) {
          const alert: RealTimeMarketAlert = {
            id: `price_${Date.now()}`,
            type: 'PRICE_CHANGE',
            severity: priceChangePercent > 0.1 ? 'HIGH' : 'MEDIUM',
            title: `Significant Price Change in ${location}`,
            message: `${propertyType} prices in ${location} have changed by ${(priceChangePercent * 100).toFixed(1)}%`,
            location,
            propertyType,
            data: { currentMarketData, previousData },
            timestamp: new Date().toISOString(),
            actionRequired: priceChangePercent > 0.1,
            recommendations: this.generatePriceChangeRecommendations(priceChangePercent, currentMarketData)
          };

          this.broadcastAlert(alert);
        }

        // Check for new listings surge
        if (currentMarketData.newListings > this.alertThresholds.newListingsThreshold) {
          const alert: RealTimeMarketAlert = {
            id: `listings_${Date.now()}`,
            type: 'NEW_LISTING',
            severity: 'MEDIUM',
            title: `High New Listing Activity in ${location}`,
            message: `${currentMarketData.newListings} new ${propertyType} listings in ${location}`,
            location,
            propertyType,
            data: currentMarketData,
            timestamp: new Date().toISOString(),
            actionRequired: false,
            recommendations: ['Monitor for market saturation', 'Consider competitive pricing']
          };

          this.broadcastAlert(alert);
        }
      }

      this.lastMarketData.set(key, currentMarketData);

    } catch (error) {
      console.error(`Error checking market changes for ${location} ${propertyType}:`, error);
    }
  }

  private async checkForEconomicChanges(): Promise<void> {
    try {
      const currentIndicators = await this.dataService.fetchEconomicIndicators();
      
      for (const indicator of currentIndicators) {
        // This would compare with previously stored values
        // For now, we'll trigger alerts based on trend direction
        if (indicator.trend === 'UP' && ['Inflation Rate', 'Interest Rate'].includes(indicator.indicator)) {
          const alert: RealTimeMarketAlert = {
            id: `economic_${Date.now()}`,
            type: 'ECONOMIC_UPDATE',
            severity: 'HIGH',
            title: `${indicator.indicator} Increased`,
            message: `${indicator.indicator} is now ${indicator.value}${indicator.unit} and trending ${indicator.trend}`,
            location: 'Nigeria',
            data: indicator,
            timestamp: new Date().toISOString(),
            actionRequired: true,
            recommendations: this.generateEconomicRecommendations(indicator)
          };

          this.broadcastAlert(alert);
        }
      }

    } catch (error) {
      console.error('Error checking economic changes:', error);
    }
  }

  private broadcastAlert(alert: RealTimeMarketAlert): void {
    this.alertSubscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error broadcasting alert to subscriber:', error);
      }
    });
  }

  private generatePriceChangeRecommendations(changePercent: number, marketData: MarketData): string[] {
    const recommendations: string[] = [];

    if (changePercent > 0.1) {
      recommendations.push('Consider selling if you own property in this area');
      recommendations.push('Delay purchases until market stabilizes');
      recommendations.push('Review investment strategy for this location');
    } else if (changePercent > 0.05) {
      recommendations.push('Monitor market closely for further changes');
      recommendations.push('Consider timing of any planned transactions');
    }

    if (marketData.averageDaysOnMarket > 60) {
      recommendations.push('Properties taking longer to sell - price competitively');
    }

    return recommendations;
  }

  private generateEconomicRecommendations(indicator: EconomicIndicator): string[] {
    const recommendations: string[] = [];

    switch (indicator.indicator) {
      case 'Inflation Rate':
        if (indicator.trend === 'UP') {
          recommendations.push('Consider real estate as inflation hedge');
          recommendations.push('Review rental rates for inflation adjustment');
          recommendations.push('Fixed-rate financing may be advantageous');
        }
        break;
      case 'Monetary Policy Rate':
        if (indicator.trend === 'UP') {
          recommendations.push('Mortgage rates likely to increase');
          recommendations.push('Complete financing applications quickly');
          recommendations.push('Consider impact on property demand');
        }
        break;
      case 'USD/NGN Exchange Rate':
        if (indicator.trend === 'DOWN') {
          recommendations.push('Naira weakening - consider USD-linked investments');
          recommendations.push('Import costs for construction materials may rise');
        }
        break;
    }

    return recommendations;
  }
}

export default LiveDataAnalyticsEngine;
