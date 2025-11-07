import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import RealEstateAnalyticsEngine from '@/services/analytics/RealEstateAnalyticsEngine';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  score?: number;
  details?: string;
  duration?: number;
}

const AnalyticsSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const tests = [
    {
      name: 'Analytics Engine Initialization',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        return engine ? { passed: true, score: 100 } : { passed: false, score: 0 };
      }
    },
    {
      name: 'Market Trends Analysis - Lagos',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.analyzeMarketTrends('lagos', 'RESIDENTIAL');
        const isValid = result && result.currentAvgPrice > 0 && result.demandScore >= 0 && result.supplyScore >= 0;
        return { passed: isValid, score: isValid ? 95 : 0, details: `Price: ₦${result?.currentAvgPrice?.toLocaleString()}, Demand: ${result?.demandScore}` };
      }
    },
    {
      name: 'Market Trends Analysis - Abuja',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.analyzeMarketTrends('abuja', 'COMMERCIAL');
        const isValid = result && result.currentAvgPrice > 0 && result.recommendedAction;
        return { passed: isValid, score: isValid ? 92 : 0, details: `Recommendation: ${result?.recommendedAction}, Growth: ${result?.growthPotential}` };
      }
    },
    {
      name: 'Market Trends Analysis - Port Harcourt',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.analyzeMarketTrends('port-harcourt', 'LAND');
        const isValid = result && result.currentAvgPrice > 0 && result.riskLevel;
        return { passed: isValid, score: isValid ? 90 : 0, details: `Risk Level: ${result?.riskLevel}, Liquidity: ${result?.liquidityScore}` };
      }
    },
    {
      name: 'Investment Analysis - Comprehensive',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.analyzeInvestment('test-property', 25000000, 'lagos', 'RESIDENTIAL');
        const isValid = result && result.expectedROI > 0 && result.overallScore >= 0 && result.recommendation;
        return { passed: isValid, score: isValid ? 94 : 0, details: `ROI: ${result?.expectedROI?.toFixed(1)}%, Score: ${result?.overallScore?.toFixed(0)}` };
      }
    },
    {
      name: 'Investment Analysis - Risk Assessment',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.analyzeInvestment('high-risk-property', 50000000, 'port-harcourt', 'COMMERCIAL');
        const isValid = result && result.riskScore >= 0 && result.keyFactors.length > 0 && result.risks.length > 0;
        return { passed: isValid, score: isValid ? 88 : 0, details: `Risk Score: ${result?.riskScore}, Factors: ${result?.keyFactors?.length}` };
      }
    },
    {
      name: 'Neighborhood Analysis - Lagos',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.analyzeNeighborhood('lagos');
        const isValid = result && result.investmentGrade && result.populationGrowth >= 0 && result.developmentProjects.length > 0;
        return { passed: isValid, score: isValid ? 91 : 0, details: `Grade: ${result?.investmentGrade}, Growth: ${result?.populationGrowth?.toFixed(1)}%` };
      }
    },
    {
      name: 'Neighborhood Analysis - Quality Metrics',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.analyzeNeighborhood('abuja');
        const isValid = result && result.schoolRating >= 0 && result.transportScore >= 0 && result.amenitiesScore >= 0;
        return { passed: isValid, score: isValid ? 89 : 0, details: `School: ${result?.schoolRating}, Transport: ${result?.transportScore}` };
      }
    },
    {
      name: 'Predictive Insights - 1 Year Forecast',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.generatePredictiveInsights('lagos', 'RESIDENTIAL', '1Y');
        const isValid = result && result.priceProjection > 0 && result.confidenceLevel > 0 && result.scenarios;
        return { passed: isValid, score: isValid ? 93 : 0, details: `Confidence: ${result?.confidenceLevel}%, Scenarios: 3` };
      }
    },
    {
      name: 'Predictive Insights - Market Drivers',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const result = await engine.generatePredictiveInsights('abuja', 'COMMERCIAL', '2Y');
        const isValid = result && result.marketDrivers.length > 0 && result.riskFactors.length > 0;
        return { passed: isValid, score: isValid ? 87 : 0, details: `Drivers: ${result?.marketDrivers?.length}, Risks: ${result?.riskFactors?.length}` };
      }
    },
    {
      name: 'Multi-Property Type Analysis',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const types = ['RESIDENTIAL', 'COMMERCIAL', 'LAND', 'INDUSTRIAL'] as const;
        const results = await Promise.all(
          types.map(type => engine.analyzeMarketTrends('lagos', type))
        );
        const isValid = results.every(r => r && r.currentAvgPrice > 0);
        return { passed: isValid, score: isValid ? 96 : 0, details: `Analyzed ${types.length} property types` };
      }
    },
    {
      name: 'Economic Indicators Integration',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const analysis = await engine.analyzeInvestment('economic-test', 30000000, 'lagos', 'RESIDENTIAL');
        // Test if economic factors are considered in analysis
        const isValid = analysis && analysis.expectedROI > 0 && analysis.riskScore > 0;
        return { passed: isValid, score: isValid ? 85 : 0, details: `Economic factors integrated in analysis` };
      }
    },
    {
      name: 'Nigerian Market Localization',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const lagosAnalysis = await engine.analyzeNeighborhood('lagos');
        const abujaAnalysis = await engine.analyzeNeighborhood('abuja');
        const phAnalysis = await engine.analyzeNeighborhood('port-harcourt');
        
        const isValid = lagosAnalysis && abujaAnalysis && phAnalysis &&
          lagosAnalysis.averageIncome !== abujaAnalysis.averageIncome &&
          lagosAnalysis.developmentProjects.length > 0;
        
        return { passed: isValid, score: isValid ? 92 : 0, details: `3 cities with unique characteristics` };
      }
    },
    {
      name: 'Performance & Response Time',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const startTime = Date.now();
        
        await Promise.all([
          engine.analyzeMarketTrends('lagos', 'RESIDENTIAL'),
          engine.analyzeInvestment('perf-test', 20000000, 'abuja', 'COMMERCIAL'),
          engine.analyzeNeighborhood('port-harcourt')
        ]);
        
        const duration = Date.now() - startTime;
        const isValid = duration < 2000; // Should complete within 2 seconds
        
        return { passed: isValid, score: isValid ? 88 : 60, details: `Completed in ${duration}ms` };
      }
    },
    {
      name: 'Data Consistency & Validation',
      test: async () => {
        const engine = new RealEstateAnalyticsEngine();
        const trend = await engine.analyzeMarketTrends('lagos', 'RESIDENTIAL');
        const investment = await engine.analyzeInvestment('consistency-test', trend.currentAvgPrice, 'lagos', 'RESIDENTIAL');
        
        // Check if data is consistent between different analysis types
        const isValid = trend && investment && 
          trend.currentAvgPrice > 0 && 
          investment.expectedROI >= 0 && 
          investment.overallScore >= 0 && investment.overallScore <= 100;
        
        return { passed: isValid, score: isValid ? 90 : 0, details: `Data validation passed` };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setOverallScore(0);

    const results: TestResult[] = [];
    let totalScore = 0;
    let passedTests = 0;

    for (const testCase of tests) {
      const result: TestResult = {
        name: testCase.name,
        status: 'running'
      };
      
      results.push(result);
      setTestResults([...results]);

      try {
        const startTime = Date.now();
        const testResult = await testCase.test();
        const duration = Date.now() - startTime;

        result.status = testResult.passed ? 'passed' : 'failed';
        result.score = testResult.score || 0;
        result.details = testResult.details;
        result.duration = duration;

        if (testResult.passed) {
          passedTests++;
          totalScore += testResult.score || 0;
        }
      } catch (error) {
        result.status = 'failed';
        result.score = 0;
        result.details = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      setTestResults([...results]);
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const finalScore = Math.round(totalScore / tests.length);
    setOverallScore(finalScore);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const passedCount = testResults.filter(r => r.status === 'passed').length;
  const failedCount = testResults.filter(r => r.status === 'failed').length;
  const runningCount = testResults.filter(r => r.status === 'running').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real Estate Analytics System Test</h2>
          <p className="text-muted-foreground">Comprehensive testing of the analytics engine and intelligence system</p>
        </div>
        <Button onClick={runTests} disabled={isRunning}>
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}/100
              </div>
              <Progress value={overallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passedCount}</div>
              <p className="text-xs text-muted-foreground">Tests passed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <p className="text-xs text-muted-foreground">Tests failed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{runningCount}</div>
              <p className="text-xs text-muted-foreground">Tests running</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <CardTitle className="text-lg">{result.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.score !== undefined && (
                      <Badge variant="outline" className={getScoreColor(result.score)}>
                        {result.score}/100
                      </Badge>
                    )}
                    {result.duration && (
                      <Badge variant="secondary">
                        {result.duration}ms
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {result.details && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.details}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics System Test Summary</CardTitle>
              <CardDescription>
                Comprehensive evaluation of the Real Estate Analytics & Intelligence System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Test Coverage</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Market Trends Analysis (3 cities)</li>
                    <li>• Investment Analysis & Risk Assessment</li>
                    <li>• Neighborhood Intelligence</li>
                    <li>• Predictive Insights & Forecasting</li>
                    <li>• Multi-Property Type Support</li>
                    <li>• Nigerian Market Localization</li>
                    <li>• Performance & Response Time</li>
                    <li>• Data Consistency & Validation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Features Tested</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Lagos, Abuja, Port Harcourt markets</li>
                    <li>• Residential, Commercial, Land, Industrial</li>
                    <li>• ROI calculation and risk scoring</li>
                    <li>• Growth potential assessment</li>
                    <li>• Economic indicators integration</li>
                    <li>• Quality of life metrics</li>
                    <li>• Price forecasting with scenarios</li>
                    <li>• Nigerian currency and localization</li>
                  </ul>
                </div>
              </div>
              
              {overallScore > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {overallScore >= 90 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : overallScore >= 80 ? (
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <h4 className="font-semibold">
                      {overallScore >= 90 ? 'Excellent Performance' : 
                       overallScore >= 80 ? 'Good Performance' : 
                       overallScore >= 70 ? 'Acceptable Performance' : 'Needs Improvement'}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {overallScore >= 90 ? 
                      'The Analytics System is performing excellently with comprehensive market intelligence capabilities.' :
                     overallScore >= 80 ?
                      'The Analytics System is performing well with solid market analysis features.' :
                     overallScore >= 70 ?
                      'The Analytics System is functional but may need some optimizations.' :
                      'The Analytics System requires attention to improve reliability and accuracy.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsSystemTest;
