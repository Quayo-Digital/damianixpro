import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import ProductionPerformanceTest, { PerformanceTestResult } from '@/services/testing/ProductionPerformanceTest';

const ProductionTestingPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<PerformanceTestResult[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);

  const performanceTest = new ProductionPerformanceTest();

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);

    try {
      setCurrentTest('Running production tests...');
      setProgress(20);

      const results = await performanceTest.runProductionTests();
      
      setTestResults(results.performanceTests);
      setOverallScore(results.overallScore);
      setProgress(100);
      setCurrentTest('Tests completed!');
    } catch (error) {
      setCurrentTest(`Tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Production Testing Suite</h1>
            <p className="text-muted-foreground mt-2">Live data integration and production readiness testing</p>
          </div>
          <Button onClick={runAllTests} disabled={isRunning} className="flex items-center gap-2">
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Tests
          </Button>
        </div>

        {isRunning && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{currentTest}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {overallScore > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Overall Score: {overallScore}/100</CardTitle>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {result.testName}
                  </div>
                  <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result.details}</p>
                <div className="mt-2 text-sm">Duration: {result.duration}ms | Score: {result.score}/100</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default ProductionTestingPage;
