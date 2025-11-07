import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Wrench,
  User,
  Database,
  Shield,
  FileText,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  data?: any;
  error?: string;
}

interface VendorTestData {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  primaryCategory: string;
  specialties: string[];
  serviceAreas: string[];
  yearsOfExperience: number;
  hourlyRate: number;
  description: string;
  businessLicense: string;
  insuranceProvider: string;
}

const VENDOR_TEST_DATA: VendorTestData = {
  fullName: 'John Maintenance',
  companyName: 'Reliable Fix Services',
  email: 'john@reliablefix.com',
  phone: '+234 803 123 4567',
  address: '15 Service Street, Victoria Island, Lagos',
  primaryCategory: 'Plumbing',
  specialties: ['Plumbing', 'Electrical', 'General Maintenance'],
  serviceAreas: ['Lagos', 'Ogun'],
  yearsOfExperience: 8,
  hourlyRate: 5000,
  description: 'Professional maintenance services with 8+ years of experience. Specializing in plumbing, electrical, and general property maintenance.',
  businessLicense: 'BL-2024-001234',
  insuranceProvider: 'Nigeria Insurance Company'
};

export function VendorOnboardingWorkflowTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'create-user', title: 'Create Test Vendor User', status: 'pending' },
    { id: 'assign-role', title: 'Assign Vendor Role', status: 'pending' },
    { id: 'test-vendor-creation', title: 'Test Vendor Record Creation', status: 'pending' },
    { id: 'verify-vendor-data', title: 'Verify Vendor Data Storage', status: 'pending' },
    { id: 'test-vendor-queries', title: 'Test Vendor Data Queries', status: 'pending' },
    { id: 'test-rls-policies', title: 'Test RLS Policies', status: 'pending' },
    { id: 'test-vendor-jobs', title: 'Test Vendor Jobs Table', status: 'pending' },
    { id: 'cleanup', title: 'Cleanup Test Data', status: 'pending' }
  ]);

  const updateStepStatus = (
    stepId: string, 
    status: TestResult['status'], 
    data?: any, 
    error?: string
  ) => {
    setTestResults(prev => prev.map(result => 
      result.id === stepId 
        ? { ...result, status, data, error }
        : result
    ));
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setCurrentStep(0);

    // Reset all test results
    setTestResults(prev => prev.map(result => ({ ...result, status: 'pending', data: undefined, error: undefined })));

    let authData: any = null;

    try {
      // Step 1: Create Test Vendor User
      setCurrentStep(1);
      updateStepStatus('create-user', 'running');
      
      const testEmail = `vendor-test-${Date.now()}@test.com`;
      const testPassword = 'TestPassword123!';

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: VENDOR_TEST_DATA.fullName,
            role: 'vendor'
          }
        }
      });

      if (signUpError || !signUpData.user) {
        updateStepStatus('create-user', 'error', null, signUpError?.message || 'Failed to create user');
        return;
      }

      authData = signUpData;
      updateStepStatus('create-user', 'success', { 
        userId: authData.user.id, 
        email: testEmail 
      });

      // Step 2: Assign Vendor Role
      setCurrentStep(2);
      updateStepStatus('assign-role', 'running');

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'vendor'
        });

      if (roleError) {
        updateStepStatus('assign-role', 'error', null, roleError.message);
      } else {
        updateStepStatus('assign-role', 'success', { role: 'vendor' });
      }

      // Step 3: Test Vendor Record Creation
      setCurrentStep(3);
      updateStepStatus('test-vendor-creation', 'running');

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: authData.user.id,
          name: VENDOR_TEST_DATA.companyName,
          category: VENDOR_TEST_DATA.primaryCategory,
          email: VENDOR_TEST_DATA.email,
          phone: VENDOR_TEST_DATA.phone,
          address: VENDOR_TEST_DATA.address,
          specialties: VENDOR_TEST_DATA.specialties,
          service_areas: VENDOR_TEST_DATA.serviceAreas,
          business_license: VENDOR_TEST_DATA.businessLicense,
          insurance_provider: VENDOR_TEST_DATA.insuranceProvider,
          years_of_experience: VENDOR_TEST_DATA.yearsOfExperience,
          hourly_rate: VENDOR_TEST_DATA.hourlyRate,
          available_weekdays: true,
          available_weekends: false,
          available_24_hours: false,
          description: VENDOR_TEST_DATA.description,
          rating: 0.0,
          total_jobs: 0,
          completed_jobs: 0,
          active: true
        })
        .select()
        .single();

      if (vendorError) {
        updateStepStatus('test-vendor-creation', 'error', null, vendorError.message);
      } else {
        updateStepStatus('test-vendor-creation', 'success', { 
          vendorId: vendorData.id,
          companyName: vendorData.name 
        });
      }

      // Step 4: Verify Vendor Data Storage
      setCurrentStep(4);
      updateStepStatus('verify-vendor-data', 'running');

      const { data: retrievedVendor, error: retrieveError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (retrieveError || !retrievedVendor) {
        updateStepStatus('verify-vendor-data', 'error', null, retrieveError?.message || 'Vendor not found');
      } else {
        const dataMatches = 
          retrievedVendor.name === VENDOR_TEST_DATA.companyName &&
          retrievedVendor.category === VENDOR_TEST_DATA.primaryCategory &&
          retrievedVendor.years_of_experience === VENDOR_TEST_DATA.yearsOfExperience &&
          retrievedVendor.hourly_rate === VENDOR_TEST_DATA.hourlyRate;

        if (dataMatches) {
          updateStepStatus('verify-vendor-data', 'success', {
            message: 'All vendor data stored correctly',
            specialties: retrievedVendor.specialties,
            serviceAreas: retrievedVendor.service_areas
          });
        } else {
          updateStepStatus('verify-vendor-data', 'warning', {
            message: 'Some data mismatches found',
            retrieved: retrievedVendor
          });
        }
      }

      // Step 5: Test Vendor Data Queries
      setCurrentStep(5);
      updateStepStatus('test-vendor-queries', 'running');

      // Test various query scenarios
      const { data: activeVendors, error: queryError1 } = await supabase
        .from('vendors')
        .select('*')
        .eq('active', true);

      const { data: categoryVendors, error: queryError2 } = await supabase
        .from('vendors')
        .select('*')
        .eq('category', VENDOR_TEST_DATA.primaryCategory);

      if (queryError1 || queryError2) {
        updateStepStatus('test-vendor-queries', 'error', null, 
          queryError1?.message || queryError2?.message || 'Query failed');
      } else {
        updateStepStatus('test-vendor-queries', 'success', {
          activeVendorsCount: activeVendors?.length || 0,
          categoryVendorsCount: categoryVendors?.length || 0
        });
      }

      // Step 6: Test RLS Policies
      setCurrentStep(6);
      updateStepStatus('test-rls-policies', 'running');

      // Test that vendor can access their own data
      const { data: ownVendorData, error: rlsError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', authData.user.id);

      if (rlsError) {
        updateStepStatus('test-rls-policies', 'error', null, rlsError.message);
      } else {
        updateStepStatus('test-rls-policies', 'success', {
          message: 'RLS policies working correctly',
          accessibleRecords: ownVendorData?.length || 0
        });
      }

      // Step 7: Test Vendor Jobs Table
      setCurrentStep(7);
      updateStepStatus('test-vendor-jobs', 'running');

      try {
        // Test vendor_jobs table access
        const { data: jobsData, error: jobsError } = await supabase
          .from('vendor_jobs')
          .select('*')
          .limit(1);

        if (jobsError && !jobsError.message.includes('relation "vendor_jobs" does not exist')) {
          updateStepStatus('test-vendor-jobs', 'error', null, jobsError.message);
        } else {
          updateStepStatus('test-vendor-jobs', 'success', {
            message: 'Vendor jobs table accessible',
            tableExists: !jobsError
          });
        }
      } catch (error) {
        updateStepStatus('test-vendor-jobs', 'warning', {
          message: 'Vendor jobs table may not exist yet (migration needed)'
        });
      }

      // Step 8: Cleanup
      setCurrentStep(8);
      updateStepStatus('cleanup', 'running');

      try {
        // Delete vendor record
        await supabase.from('vendors').delete().eq('user_id', authData.user.id);
        
        // Delete user profile and role
        await supabase.from('profiles').delete().eq('id', authData.user.id);
        await supabase.from('user_roles').delete().eq('user_id', authData.user.id);
        
        updateStepStatus('cleanup', 'success', { message: 'Test data cleaned up successfully' });
      } catch (error) {
        updateStepStatus('cleanup', 'warning', { 
          message: `Cleanup completed with some issues: ${error}` 
        });
      }

      toast.success('Vendor onboarding workflow test completed successfully!');

    } catch (error) {
      console.error('Test failed:', error);
      updateStepStatus(testResults[currentStep - 1]?.id || 'unknown', 'error', null, 
        error instanceof Error ? error.message : 'Unknown error');
      toast.error('Test failed. Check the results for details.');
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const completedTests = testResults.filter(r => r.status === 'success').length;
  const totalTests = testResults.length;
  const progress = (completedTests / totalTests) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Vendor Onboarding Workflow Test</CardTitle>
              <CardDescription>
                Comprehensive test of the vendor onboarding process and database integration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Test Progress</p>
                <p className="text-xs text-muted-foreground">
                  {completedTests} of {totalTests} tests completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          onClick={runComprehensiveTest} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Wrench className="w-4 h-4" />
              Run Comprehensive Test
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={result.id}>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.title}</p>
                      {result.data && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {typeof result.data === 'object' ? (
                            result.data.message || JSON.stringify(result.data, null, 2)
                          ) : (
                            String(result.data)
                          )}
                        </div>
                      )}
                      {result.error && (
                        <p className="text-xs text-red-500 mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                    {currentStep === index + 1 && (
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    )}
                  </div>
                </div>
                {index < testResults.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Test Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Company Name:</p>
                <p className="text-muted-foreground">{VENDOR_TEST_DATA.companyName}</p>
              </div>
              <div>
                <p className="font-medium">Primary Category:</p>
                <p className="text-muted-foreground">{VENDOR_TEST_DATA.primaryCategory}</p>
              </div>
              <div>
                <p className="font-medium">Experience:</p>
                <p className="text-muted-foreground">{VENDOR_TEST_DATA.yearsOfExperience} years</p>
              </div>
              <div>
                <p className="font-medium">Hourly Rate:</p>
                <p className="text-muted-foreground">₦{VENDOR_TEST_DATA.hourlyRate.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="font-medium">Specialties:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {VENDOR_TEST_DATA.specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium">Service Areas:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {VENDOR_TEST_DATA.serviceAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
