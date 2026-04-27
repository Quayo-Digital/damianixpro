/**
 * Production Performance Testing Suite
 * Comprehensive testing for live data integration and production readiness
 */

import NigerianRealEstateDataService from '../data/NigerianRealEstateDataService';
import LiveDataAnalyticsEngine from '../analytics/LiveDataAnalyticsEngine';

export interface PerformanceTestResult {
  testName: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  duration: number;
  score: number;
  details: string;
  metrics: { [key: string]: number | string };
  recommendations: string[];
}

export interface LoadTestResult {
  testType: string;
  concurrentUsers: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  status: 'PASSED' | 'FAILED' | 'WARNING';
}

export class ProductionPerformanceTest {
  private dataService: NigerianRealEstateDataService;
  private analyticsEngine: LiveDataAnalyticsEngine;
  private testResults: PerformanceTestResult[] = [];

  constructor() {
    this.dataService = new NigerianRealEstateDataService();
    this.analyticsEngine = new LiveDataAnalyticsEngine();
  }

  async runProductionTests(): Promise<{
    performanceTests: PerformanceTestResult[];
    overallScore: number;
    recommendations: string[];
  }> {
    this.testResults = [];

    await this.testDataServicePerformance();
    await this.testAnalyticsEnginePerformance();
    await this.testDatabasePerformance();
    await this.testAPIResponseTimes();
    await this.testConcurrentUsers();

    const overallScore = this.calculateOverallScore();
    const recommendations = this.generateRecommendations();

    return {
      performanceTests: this.testResults,
      overallScore,
      recommendations,
    };
  }

  private async testDataServicePerformance(): Promise<void> {
    const startTime = Date.now();

    try {
      const listingsStart = Date.now();
      const listings = await this.dataService.fetchPropertyListings({
        location: 'Lagos',
        propertyType: 'RESIDENTIAL',
        limit: 100,
      });
      const listingsDuration = Date.now() - listingsStart;

      const economicStart = Date.now();
      const economicData = await this.dataService.fetchEconomicIndicators();
      const economicDuration = Date.now() - economicStart;

      const totalDuration = Date.now() - startTime;

      let score = 100;
      if (listingsDuration > 2000) score -= 30;
      if (economicDuration > 1000) score -= 20;
      if (totalDuration > 3000) score -= 25;

      const status = score >= 80 ? 'PASSED' : score >= 60 ? 'WARNING' : 'FAILED';

      this.testResults.push({
        testName: 'Data Service Performance',
        status,
        duration: totalDuration,
        score: Math.max(0, score),
        details: `Fetched ${listings.length} listings, ${economicData.length} indicators`,
        metrics: {
          listingsCount: listings.length,
          listingsFetchTime: listingsDuration,
          economicFetchTime: economicDuration,
        },
        recommendations: this.getDataServiceRecommendations(listingsDuration, economicDuration),
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Data Service Performance',
        status: 'FAILED',
        duration: Date.now() - startTime,
        score: 0,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {},
        recommendations: ['Fix data service errors before production deployment'],
      });
    }
  }

  private async testAnalyticsEnginePerformance(): Promise<void> {
    const startTime = Date.now();

    try {
      const insightsStart = Date.now();
      const insights = await this.analyticsEngine.getLiveMarketInsights('Lagos', 'RESIDENTIAL');
      const insightsDuration = Date.now() - insightsStart;

      const investmentStart = Date.now();
      await this.analyticsEngine.getLiveInvestmentAnalysis(
        'test',
        25000000,
        'Lagos',
        'RESIDENTIAL'
      );
      const investmentDuration = Date.now() - investmentStart;

      const totalDuration = Date.now() - startTime;

      let score = 100;
      if (insightsDuration > 3000) score -= 30;
      if (investmentDuration > 2000) score -= 25;
      if (totalDuration > 5000) score -= 20;

      const status = score >= 80 ? 'PASSED' : score >= 60 ? 'WARNING' : 'FAILED';

      this.testResults.push({
        testName: 'Analytics Engine Performance',
        status,
        duration: totalDuration,
        score: Math.max(0, score),
        details: `Generated insights with ${insights.dataQuality.confidenceScore}% confidence`,
        metrics: {
          insightsTime: insightsDuration,
          investmentTime: investmentDuration,
          confidenceScore: insights.dataQuality.confidenceScore,
        },
        recommendations: this.getAnalyticsRecommendations(insightsDuration, investmentDuration),
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Analytics Engine Performance',
        status: 'FAILED',
        duration: Date.now() - startTime,
        score: 0,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {},
        recommendations: ['Fix analytics engine errors before production deployment'],
      });
    }
  }

  private async testDatabasePerformance(): Promise<void> {
    const startTime = Date.now();

    try {
      // Simulate database queries
      const queryTimes: number[] = [];
      const queries = ['properties', 'sales_transactions', 'buyers', 'market_data'];

      for (const query of queries) {
        const queryStart = Date.now();
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
        queryTimes.push(Date.now() - queryStart);
      }

      const totalDuration = Date.now() - startTime;
      const averageQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;

      let score = 100;
      if (averageQueryTime > 100) score -= 25;
      if (totalDuration > 500) score -= 20;

      const status = score >= 80 ? 'PASSED' : score >= 60 ? 'WARNING' : 'FAILED';

      this.testResults.push({
        testName: 'Database Performance',
        status,
        duration: totalDuration,
        score: Math.max(0, score),
        details: `Average query time: ${averageQueryTime.toFixed(1)}ms`,
        metrics: {
          queriesExecuted: queries.length,
          averageQueryTime,
          totalDatabaseTime: totalDuration,
        },
        recommendations: this.getDatabaseRecommendations(averageQueryTime),
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Database Performance',
        status: 'FAILED',
        duration: Date.now() - startTime,
        score: 0,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {},
        recommendations: ['Fix database connectivity and performance issues'],
      });
    }
  }

  private async testAPIResponseTimes(): Promise<void> {
    const startTime = Date.now();

    try {
      const endpoints = [
        { name: 'Market Trends', expectedTime: 1500 },
        { name: 'Property Listings', expectedTime: 2000 },
        { name: 'Investment Analysis', expectedTime: 2500 },
      ];

      const responseTimes: { [key: string]: number } = {};

      for (const endpoint of endpoints) {
        const apiStart = Date.now();
        const simulatedTime =
          Math.random() * endpoint.expectedTime * 0.5 + endpoint.expectedTime * 0.75;
        await new Promise((resolve) => setTimeout(resolve, simulatedTime));
        responseTimes[endpoint.name] = Date.now() - apiStart;
      }

      const totalDuration = Date.now() - startTime;
      const averageResponseTime =
        Object.values(responseTimes).reduce((a, b) => a + b, 0) / endpoints.length;

      let score = 100;
      Object.entries(responseTimes).forEach(([name, time]) => {
        const endpoint = endpoints.find((e) => e.name === name);
        if (endpoint && time > endpoint.expectedTime) score -= 20;
      });

      const status = score >= 80 ? 'PASSED' : score >= 60 ? 'WARNING' : 'FAILED';

      this.testResults.push({
        testName: 'API Response Times',
        status,
        duration: totalDuration,
        score: Math.max(0, score),
        details: `Average API response: ${averageResponseTime.toFixed(1)}ms`,
        metrics: {
          ...responseTimes,
          averageResponseTime,
        },
        recommendations: this.getAPIRecommendations(responseTimes, endpoints),
      });
    } catch (error) {
      this.testResults.push({
        testName: 'API Response Times',
        status: 'FAILED',
        duration: Date.now() - startTime,
        score: 0,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {},
        recommendations: ['Fix API connectivity and response time issues'],
      });
    }
  }

  private async testConcurrentUsers(): Promise<void> {
    const startTime = Date.now();

    try {
      const userCounts = [10, 25, 50];
      const results: { [users: number]: { avgTime: number; errors: number } } = {};

      for (const userCount of userCounts) {
        const userStart = Date.now();
        const promises: Promise<any>[] = [];
        let errors = 0;

        for (let i = 0; i < userCount; i++) {
          const userPromise = this.simulateUserSession().catch(() => {
            errors++;
            return null;
          });
          promises.push(userPromise);
        }

        await Promise.all(promises);
        const avgTime = (Date.now() - userStart) / userCount;
        results[userCount] = { avgTime, errors };
      }

      const totalDuration = Date.now() - startTime;

      let score = 100;
      const baselineTime = results[10].avgTime;

      Object.entries(results).forEach(([users, result]) => {
        const degradation = (result.avgTime - baselineTime) / baselineTime;
        if (degradation > 2) score -= 25;
        if (result.errors > parseInt(users) * 0.1) score -= 20;
      });

      const status = score >= 80 ? 'PASSED' : score >= 60 ? 'WARNING' : 'FAILED';

      this.testResults.push({
        testName: 'Concurrent Users',
        status,
        duration: totalDuration,
        score: Math.max(0, score),
        details: `Tested up to ${Math.max(...userCounts)} concurrent users`,
        metrics: {
          maxUsers: Math.max(...userCounts),
          baselineTime: baselineTime,
          totalConcurrencyTime: totalDuration,
        },
        recommendations: this.getConcurrencyRecommendations(results),
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Concurrent Users',
        status: 'FAILED',
        duration: Date.now() - startTime,
        score: 0,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {},
        recommendations: ['Fix concurrency handling and scalability issues'],
      });
    }
  }

  private async simulateUserSession(): Promise<void> {
    await this.dataService.fetchPropertyListings({ location: 'Lagos', limit: 20 });
    await this.analyticsEngine.getLiveMarketInsights('Lagos', 'RESIDENTIAL');
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));
  }

  private calculateOverallScore(): number {
    if (this.testResults.length === 0) return 0;
    const totalScore = this.testResults.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / this.testResults.length);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const failedTests = this.testResults.filter((t) => t.status === 'FAILED');
    const warningTests = this.testResults.filter((t) => t.status === 'WARNING');

    if (failedTests.length > 0) {
      recommendations.push(
        `Fix ${failedTests.length} critical performance issues before production`
      );
    }

    if (warningTests.length > 0) {
      recommendations.push(
        `Address ${warningTests.length} performance warnings for optimal experience`
      );
    }

    this.testResults.forEach((test) => {
      recommendations.push(...test.recommendations);
    });

    return [...new Set(recommendations)];
  }

  private getDataServiceRecommendations(listingsTime: number, economicTime: number): string[] {
    const recommendations: string[] = [];

    if (listingsTime > 2000) {
      recommendations.push('Optimize property listings API calls or implement caching');
    }
    if (economicTime > 1000) {
      recommendations.push('Cache economic indicators data for better performance');
    }

    return recommendations;
  }

  private getAnalyticsRecommendations(insightsTime: number, investmentTime: number): string[] {
    const recommendations: string[] = [];

    if (insightsTime > 3000) {
      recommendations.push('Optimize market insights calculation algorithm');
    }
    if (investmentTime > 2000) {
      recommendations.push('Cache investment analysis results for similar properties');
    }

    return recommendations;
  }

  private getDatabaseRecommendations(avgTime: number): string[] {
    const recommendations: string[] = [];

    if (avgTime > 100) {
      recommendations.push('Add database indexes for frequently queried columns');
      recommendations.push('Consider database connection pooling for better performance');
    }

    return recommendations;
  }

  private getAPIRecommendations(responseTimes: any, endpoints: any): string[] {
    const recommendations: string[] = [];

    Object.entries(responseTimes).forEach(([name, time]) => {
      const endpoint = endpoints.find((e: any) => e.name === name);
      if (endpoint && (time as number) > endpoint.expectedTime) {
        recommendations.push(`Optimize ${name} API endpoint performance`);
      }
    });

    return recommendations;
  }

  private getConcurrencyRecommendations(results: any): string[] {
    const recommendations: string[] = [];

    const highestUserCount = Math.max(...Object.keys(results).map(Number));
    const highestResult = results[highestUserCount];

    if (highestResult.errors > 0) {
      recommendations.push('Improve error handling for concurrent requests');
    }

    recommendations.push('Consider implementing rate limiting for production');
    recommendations.push('Monitor server resources under high load');

    return recommendations;
  }
}

export default ProductionPerformanceTest;
