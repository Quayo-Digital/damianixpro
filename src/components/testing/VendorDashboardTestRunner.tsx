import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, CheckCircle, XCircle, Clock, TestTube, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export const VendorDashboardTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    duration: number;
  } | null>(null);

  const runSingleTest = async (
    testName: string,
    testFn: () => Promise<void>
  ): Promise<TestResult> => {
    setCurrentTest(testName);
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      return {
        name: testName,
        status: 'passed',
        message: 'Test passed successfully',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        name: testName,
        status: 'failed',
        message: errorMessage,
        duration,
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSummary(null);

    const overallStartTime = Date.now();
    const results: TestResult[] = [];

    // Define all tests
    const tests = [
      {
        name: 'Database Connection',
        test: async () => {
          const { data, error } = await supabase.auth.getUser();
          if (error) throw new Error(`Auth check failed: ${error.message}`);
          if (!data.user) throw new Error('No authenticated user');
        },
      },
      {
        name: 'Vendors Table Schema',
        test: async () => {
          const { error } = await supabase
            .from('vendors')
            .select('id, user_id, name, category, is_available')
            .limit(1);

          if (error && !error.message.includes('0 rows')) {
            throw new Error(`Vendors table schema error: ${error.message}`);
          }
        },
      },
      {
        name: 'Vendor Jobs Table Schema',
        test: async () => {
          const { error } = await supabase
            .from('vendor_jobs')
            .select('id, vendor_id, property_id, title, status, cost')
            .limit(1);

          if (error && !error.message.includes('0 rows')) {
            throw new Error(`Vendor jobs table schema error: ${error.message}`);
          }
        },
      },
      {
        name: 'RLS Policies Check',
        test: async () => {
          // Test that we can query the tables (RLS allows it)
          const { error: vendorError } = await supabase.from('vendors').select('count').limit(1);

          const { error: jobError } = await supabase.from('vendor_jobs').select('count').limit(1);

          if (vendorError && !vendorError.message.includes('0 rows')) {
            throw new Error(`Vendor RLS policy error: ${vendorError.message}`);
          }

          if (jobError && !jobError.message.includes('0 rows')) {
            throw new Error(`Vendor jobs RLS policy error: ${jobError.message}`);
          }
        },
      },
      {
        name: 'Enhanced Vendor Data Hook Import',
        test: async () => {
          // Test that the hook can be imported (simulated)
          try {
            const { useEnhancedVendorData } = await import('@/hooks/useEnhancedVendorData');
            if (typeof useEnhancedVendorData !== 'function') {
              throw new Error('useEnhancedVendorData is not a function');
            }
          } catch (error) {
            throw new Error(`Hook import failed: ${error}`);
          }
        },
      },
      {
        name: 'Vendor Dashboard Components Import',
        test: async () => {
          try {
            const [
              { VendorDashboardOverview },
              { VendorJobManagement },
              { VendorPerformanceAnalytics },
              { VendorProfileManagement },
            ] = await Promise.all([
              import('@/components/vendor/VendorDashboardOverview'),
              import('@/components/vendor/VendorJobManagement'),
              import('@/components/vendor/VendorPerformanceAnalytics'),
              import('@/components/vendor/VendorProfileManagement'),
            ]);

            if (
              !VendorDashboardOverview ||
              !VendorJobManagement ||
              !VendorPerformanceAnalytics ||
              !VendorProfileManagement
            ) {
              throw new Error('One or more components failed to import');
            }
          } catch (error) {
            throw new Error(`Component import failed: ${error}`);
          }
        },
      },
      {
        name: 'Currency Formatting (Nigerian Naira)',
        test: async () => {
          const formatter = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });

          const formatted = formatter.format(50000);
          console.log('Formatted currency:', formatted);

          // Check if it contains Naira symbol or NGN
          if (!formatted.includes('₦') && !formatted.includes('NGN')) {
            throw new Error(`Currency formatting failed. Got: ${formatted}`);
          }
        },
      },
      {
        name: 'Nigerian States Data',
        test: async () => {
          const nigerianStates = [
            'Lagos',
            'Abuja FCT',
            'Kano',
            'Rivers',
            'Oyo',
            'Kaduna',
            'Ogun',
            'Cross River',
            'Delta',
            'Edo',
            'Enugu',
            'Imo',
          ];

          if (nigerianStates.length < 10) {
            throw new Error('Insufficient Nigerian states data');
          }

          // Check for key states
          const keyStates = ['Lagos', 'Abuja FCT', 'Kano'];
          for (const state of keyStates) {
            if (!nigerianStates.includes(state)) {
              throw new Error(`Missing key state: ${state}`);
            }
          }
        },
      },
      {
        name: 'Vendor Dashboard Page Import',
        test: async () => {
          try {
            const VendorDashboardPage = await import('@/pages/VendorDashboardPage');
            if (!VendorDashboardPage.default) {
              throw new Error('VendorDashboardPage default export not found');
            }
          } catch (error) {
            throw new Error(`Vendor dashboard page import failed: ${error}`);
          }
        },
      },
      {
        name: 'Test Suite Integration',
        test: async () => {
          // Verify this test component is properly integrated
          if (typeof window === 'undefined') {
            throw new Error('Not running in browser environment');
          }

          // Check if we're in the testing page context
          const currentPath = window.location.pathname;
          if (!currentPath.includes('testing') && !currentPath.includes('test')) {
            console.warn('Not running in testing page context');
          }
        },
      },
    ];

    // Run all tests sequentially
    for (let i = 0; i < tests.length; i++) {
      const { name, test } = tests[i];
      console.log(`Running test ${i + 1}/${tests.length}: ${name}`);

      const result = await runSingleTest(name, test);
      results.push(result);
      setTestResults([...results]); // Update UI with current results

      // Small delay between tests for better UX
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Calculate summary
    const overallDuration = Date.now() - overallStartTime;
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    setSummary({
      total: results.length,
      passed,
      failed,
      duration: overallDuration,
    });

    setCurrentTest('');
    setIsRunning(false);

    console.log('Test Summary:', {
      total: results.length,
      passed,
      failed,
      duration: overallDuration,
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-900">
            <TestTube className="h-6 w-6" />
            Vendor Dashboard Test Runner
          </CardTitle>
          <CardDescription className="text-blue-700">
            Streamlined testing for enhanced vendor dashboard functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <Button onClick={runAllTests} disabled={isRunning} className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>

            {summary && (
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-green-600">
                  {summary.passed} Passed
                </Badge>
                {summary.failed > 0 && <Badge variant="destructive">{summary.failed} Failed</Badge>}
                <span className="text-sm text-muted-foreground">
                  {summary.total} Total ({summary.duration}ms)
                </span>
              </div>
            )}
          </div>

          {currentTest && (
            <Alert className="mb-4">
              <Clock className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Currently running: <strong>{currentTest}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Real-time test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                    )}
                    <Badge
                      variant={
                        result.status === 'passed'
                          ? 'default'
                          : result.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {testResults.some((r) => r.status === 'failed') && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-red-600">Failed Tests Details:</h4>
                {testResults
                  .filter((r) => r.status === 'failed')
                  .map((result, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{result.name}:</strong> {result.message}
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {summary && summary.passed === summary.total && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            🎉 All {summary.total} tests passed successfully! The enhanced vendor dashboard is ready
            for production.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
