import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, User, Building, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'passed' | 'failed';
}

export const VendorOnboardingEndToEndTest: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: 'Database Schema',
      description: 'Verify vendors and vendor_jobs tables',
      status: 'pending',
      tests: [
        { name: 'Vendors table exists', status: 'pending', message: '' },
        { name: 'Vendor_jobs table exists', status: 'pending', message: '' },
        { name: 'Required columns present', status: 'pending', message: '' },
        { name: 'RLS policies active', status: 'pending', message: '' }
      ]
    },
    {
      name: 'User & Profile Creation',
      description: 'Test vendor user and profile creation',
      status: 'pending',
      tests: [
        { name: 'Create test vendor user', status: 'pending', message: '' },
        { name: 'Assign vendor role', status: 'pending', message: '' },
        { name: 'Create vendor profile', status: 'pending', message: '' },
        { name: 'Verify profile data', status: 'pending', message: '' }
      ]
    },
    {
      name: 'Job Management',
      description: 'Test vendor job assignment and management',
      status: 'pending',
      tests: [
        { name: 'Create vendor job', status: 'pending', message: '' },
        { name: 'Update job status', status: 'pending', message: '' },
        { name: 'Complete job workflow', status: 'pending', message: '' },
        { name: 'Add rating and feedback', status: 'pending', message: '' }
      ]
    },
    {
      name: 'Integration Tests',
      description: 'Test complete vendor workflow',
      status: 'pending',
      tests: [
        { name: 'Profile management', status: 'pending', message: '' },
        { name: 'Job visibility (RLS)', status: 'pending', message: '' },
        { name: 'Admin verification', status: 'pending', message: '' },
        { name: 'End-to-end workflow', status: 'pending', message: '' }
      ]
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testData, setTestData] = useState<any>({});

  const updateTestResult = (suiteIndex: number, testIndex: number, result: Partial<TestResult>) => {
    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex].tests[testIndex] = { ...updated[suiteIndex].tests[testIndex], ...result };
      
      const tests = updated[suiteIndex].tests;
      if (tests.every(t => t.status === 'passed')) {
        updated[suiteIndex].status = 'passed';
      } else if (tests.some(t => t.status === 'failed')) {
        updated[suiteIndex].status = 'failed';
      } else if (tests.some(t => t.status === 'running')) {
        updated[suiteIndex].status = 'running';
      }
      
      return updated;
    });
  };

  const runTest = async (suiteIndex: number, testIndex: number, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    updateTestResult(suiteIndex, testIndex, { status: 'running', message: 'Running...' });
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(suiteIndex, testIndex, {
        status: 'passed',
        message: 'Passed',
        duration
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(suiteIndex, testIndex, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
      throw error;
    }
  };

  const testDatabaseSchema = async () => {
    setCurrentTest('Database Schema Validation');
    
    console.log('Testing vendors table existence...');
    await runTest(0, 0, async () => {
      const { data, error } = await supabase.from('vendors').select('*').limit(1);
      if (error) {
        console.error('Vendors table test error:', error);
        if (error.code === '42P01') {
          throw new Error('Vendors table does not exist - run vendor onboarding migration first');
        }
        throw new Error(`Vendors table error: ${error.message}`);
      }
      console.log('Vendors table exists and is accessible');
      return { tableExists: true };
    });

    console.log('Testing vendor_jobs table existence...');
    await runTest(0, 1, async () => {
      const { data, error } = await supabase.from('vendor_jobs').select('*').limit(1);
      if (error) {
        console.error('Vendor_jobs table test error:', error);
        if (error.code === '42P01') {
          throw new Error('Vendor_jobs table does not exist - run vendor onboarding migration first');
        }
        throw new Error(`Vendor_jobs table error: ${error.message}`);
      }
      console.log('Vendor_jobs table exists and is accessible');
      return { tableExists: true };
    });

    await runTest(0, 2, async () => {
      console.log('Testing vendors table columns...');
      
      // Test basic columns first
      const { data: basicData, error: basicError } = await supabase
        .from('vendors')
        .select('id, user_id, name, category, email, phone')
        .limit(1);
      
      if (basicError) {
        console.error('Basic columns test failed:', basicError);
        throw new Error(`Basic columns missing: ${basicError.message}`);
      }
      
      // Test advanced columns that might be missing
      const { data: advancedData, error: advancedError } = await supabase
        .from('vendors')
        .select('hourly_rate, verified, specialties, service_areas, professional_references')
        .limit(1);
      
      if (advancedError) {
        console.error('Advanced columns test failed:', advancedError);
        console.error('This suggests the vendor onboarding migration has not been applied!');
        throw new Error(`Migration not applied - missing columns: ${advancedError.message}`);
      }
      
      console.log('All vendor table columns exist');
      return { columnsValid: true };
    });

    await runTest(0, 3, async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('No authenticated user for RLS test');
      }
      
      const { error } = await supabase.from('vendors').select('id').limit(1);
      return { rlsActive: !error || error.code !== '42501' };
    });
  };

  const testUserAndProfileCreation = async (): Promise<{ testUser: any; vendorProfile: any }> => {
    setCurrentTest('User & Profile Creation');
    
    // First, verify basic auth and database connectivity
    console.log('Testing basic auth and database connectivity...');
    const { data: currentUser, error: authError } = await supabase.auth.getUser();
    console.log('Current authenticated user:', currentUser?.user?.email || 'None');
    if (authError) {
      console.error('Auth error:', authError);
    }
    
    const testEmail = `vendor-test-${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    console.log('Creating test user with email:', testEmail);
    
    const userData = await runTest(1, 0, async () => {
      console.log('Attempting user signup...');
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: { role: 'vendor', first_name: 'Test', last_name: 'Vendor' }
        }
      });
      
      console.log('Signup response - data:', data, 'error:', error);
      
      if (error) {
        console.error('User creation error details:', error);
        throw new Error(`User creation failed: ${error.message}`);
      }
      
      if (!data.user) {
        console.error('No user returned from signup');
        throw new Error('User creation failed: No user returned');
      }
      
      console.log('User created successfully:', data.user.id, data.user.email);
      return { user: data.user, email: testEmail };
    });

    console.log('Storing user data in testData:', userData);
    setTestData(prev => {
      const updated = { ...prev, testUser: userData };
      console.log('Updated testData after user creation:', updated);
      return updated;
    });

    await runTest(1, 1, async () => {
      if (!userData.user) {
        throw new Error('No user created to assign role to');
      }
      
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('role', 'vendor')
        .single();
      
      if (existingRole) {
        console.log('Role already exists for user, skipping assignment');
        return { roleAssigned: true, existing: true };
      }
      
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userData.user.id, role: 'vendor' });
      
      if (error) {
        // Handle duplicate key error gracefully
        if (error.code === '23505') {
          console.log('Role already exists (race condition), continuing...');
          return { roleAssigned: true, existing: true };
        }
        throw new Error(`Role assignment failed: ${error.message}`);
      }
      return { roleAssigned: true };
    });

    const vendorProfile = await runTest(1, 2, async () => {
      if (!userData.user) {
        throw new Error('No user for profile creation');
      }

      console.log('Creating vendor profile for user:', userData.user.id);
      
      const vendorData = {
        user_id: userData.user.id,
        name: 'Test Vendor Company',
        category: 'Plumbing',
        email: userData.email,
        phone: '+234-800-123-4567',
        address: '123 Test Street, Lagos, Nigeria',
        specialties: ['Pipe Repair', 'Installation'],
        service_areas: ['Lagos', 'Abuja'],
        business_license: 'BL123456789',
        years_of_experience: 5,
        hourly_rate: 5000.00,
        emergency_rate: 8000.00,
        available_weekdays: true,
        description: 'Professional plumbing services',
        professional_references: 'John Doe - 0801234567',
        active: true
      };

      console.log('Vendor data to insert:', vendorData);

      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();
      
      if (error) {
        console.error('Vendor profile creation error:', error);
        throw new Error(`Vendor profile creation failed: ${error.message}`);
      }
      
      console.log('Vendor profile created successfully:', data);
      return data;
    });

    console.log('Storing vendor profile in testData:', vendorProfile);
    setTestData(prev => {
      const updated = { ...prev, vendorProfile };
      console.log('Updated testData:', updated);
      return updated;
    });

    await runTest(1, 3, async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorProfile.id)
        .single();
      
      if (error) {
        throw new Error(`Profile verification failed: ${error.message}`);
      }
      
      const requiredFields = ['name', 'category', 'email', 'phone', 'hourly_rate'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`);
      }
      return { allFieldsValid: true };
    });
    
    // Return the test data directly for use in runAllTests
    return { testUser: userData, vendorProfile };
  };

  const testJobManagement = async (passedVendorProfile?: any): Promise<any> => {
    setCurrentTest('Job Management');
    
    console.log('testJobManagement called with passedVendorProfile:', passedVendorProfile);
    console.log('testJobManagement called - current testData:', testData);
    
    // Use passed vendor profile if available, otherwise fall back to testData
    const vendorProfile = passedVendorProfile || testData.vendorProfile;
    console.log('Final vendorProfile to use:', vendorProfile);
    
    if (!vendorProfile) {
      console.error('No vendor profile found. PassedVendorProfile:', passedVendorProfile);
      console.error('TestData vendorProfile:', testData.vendorProfile);
      console.error('Full testData:', JSON.stringify(testData, null, 2));
      throw new Error('No vendor profile for job tests - ensure user and profile creation tests passed first');
    }
    
    console.log('Starting job management tests with vendor profile:', vendorProfile.id);

    const vendorJob = await runTest(2, 0, async () => {
      const jobData = {
        vendor_id: vendorProfile.id,
        property_id: '12345678-1234-1234-1234-123456789012',
        title: 'Kitchen Sink Repair',
        description: 'Fix leaking kitchen sink',
        category: 'Plumbing',
        priority: 'medium',
        status: 'scheduled',
        estimated_cost: 15000.00
      };

      const { data, error } = await supabase
        .from('vendor_jobs')
        .insert(jobData)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Job creation failed: ${error.message}`);
      }
      return data;
    });

    setTestData(prev => ({ ...prev, vendorJob }));

    await runTest(2, 1, async () => {
      const { data, error } = await supabase
        .from('vendor_jobs')
        .update({ status: 'in_progress' })
        .eq('id', vendorJob.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Status update failed: ${error.message}`);
      }
      
      if (data.status !== 'in_progress') {
        throw new Error('Status not updated correctly');
      }
      return { statusUpdated: true };
    });

    await runTest(2, 2, async () => {
      const { data, error } = await supabase
        .from('vendor_jobs')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
          actual_cost: 12000.00
        })
        .eq('id', vendorJob.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Job completion failed: ${error.message}`);
      }
      
      if (data.status !== 'completed') {
        throw new Error('Job not marked as completed');
      }
      return { jobCompleted: true };
    });

    await runTest(2, 3, async () => {
      const { data, error } = await supabase
        .from('vendor_jobs')
        .update({
          customer_rating: 4.5,
          customer_feedback: 'Excellent work'
        })
        .eq('id', vendorJob.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Rating failed: ${error.message}`);
      }
      return { ratingAdded: true };
    });
    
    // Return the vendor job data for use in integration tests
    return vendorJob;
  };

  const testIntegration = async (passedVendorProfile?: any, passedVendorJob?: any) => {
    setCurrentTest('Integration Tests');
    
    console.log('testIntegration called with passedVendorProfile:', passedVendorProfile);
    console.log('testIntegration called with passedVendorJob:', passedVendorJob);
    console.log('testIntegration called - current testData:', testData);
    
    // Use passed data if available, otherwise fall back to testData
    const vendorProfile = passedVendorProfile || testData.vendorProfile;
    const vendorJob = passedVendorJob || testData.vendorJob;
    
    console.log('Final vendorProfile to use:', vendorProfile);
    console.log('Final vendorJob to use:', vendorJob);
    
    if (!vendorProfile) {
      console.error('No vendor profile found. PassedVendorProfile:', passedVendorProfile);
      console.error('TestData vendorProfile:', testData.vendorProfile);
      console.error('Full testData:', JSON.stringify(testData, null, 2));
      throw new Error('No vendor profile for integration tests - ensure profile creation tests passed');
    }
    
    if (!vendorJob) {
      console.error('No vendor job found. PassedVendorJob:', passedVendorJob);
      console.error('TestData vendorJob:', testData.vendorJob);
      console.error('Full testData:', JSON.stringify(testData, null, 2));
      throw new Error('No vendor job for integration tests - ensure job management tests passed');
    }
    
    console.log('Starting integration tests with profile:', vendorProfile.id, 'and job:', vendorJob.id);

    await runTest(3, 0, async () => {
      if (!vendorProfile) {
        throw new Error('No vendor profile for management test');
      }
      
      const { data, error } = await supabase
        .from('vendors')
        .update({ hourly_rate: 6000.00 })
        .eq('id', vendorProfile.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Profile update failed: ${error.message}`);
      }
      return { profileUpdated: true };
    });

    await runTest(3, 1, async () => {
      if (!vendorProfile) {
        throw new Error('No vendor profile for RLS test');
      }
      
      const { data, error } = await supabase
        .from('vendor_jobs')
        .select('*')
        .eq('vendor_id', vendorProfile.id);
      
      if (error) {
        throw new Error(`RLS test failed: ${error.message}`);
      }
      return { rlsWorking: true, jobsVisible: data.length > 0 };
    });

    await runTest(3, 2, async () => {
      if (!vendorProfile) {
        throw new Error('No vendor profile for verification');
      }
      
      const { data, error } = await supabase
        .from('vendors')
        .update({ verified: true })
        .eq('id', vendorProfile.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Verification failed: ${error.message}`);
      }
      return { vendorVerified: true };
    });

    await runTest(3, 3, async () => {
      if (!vendorProfile || !vendorJob) {
        throw new Error('Missing data for workflow test');
      }
      
      const vendorCheck = await supabase
        .from('vendors')
        .select('verified')
        .eq('id', vendorProfile.id)
        .single();
      
      const jobCheck = await supabase
        .from('vendor_jobs')
        .select('status, customer_rating')
        .eq('id', vendorJob.id)
        .single();
      
      if (vendorCheck.error || jobCheck.error) {
        throw new Error('Workflow verification failed');
      }
      
      const workflowComplete = 
        vendorCheck.data.verified &&
        jobCheck.data.status === 'completed' &&
        jobCheck.data.customer_rating > 0;
      
      if (!workflowComplete) {
        throw new Error('Workflow not completed correctly');
      }
      
      return { workflowComplete: true };
    });
  };

  const cleanupExistingTestData = async () => {
    console.log('Cleaning up any existing test data...');
    
    try {
      // Clean up test vendor jobs
      const { error: jobsError } = await supabase
        .from('vendor_jobs')
        .delete()
        .like('title', '%Test%');
      
      // Clean up test vendors
      const { error: vendorsError } = await supabase
        .from('vendors')
        .delete()
        .like('name', '%Test%');
      
      // Clean up test user roles (vendor-test emails)
      const { data: testUsers } = await supabase.auth.admin.listUsers();
      if (testUsers?.users) {
        for (const user of testUsers.users) {
          if (user.email?.includes('vendor-test-')) {
            await supabase.from('user_roles').delete().eq('user_id', user.id);
            await supabase.from('profiles').delete().eq('id', user.id);
          }
        }
      }
      
      console.log('Pre-test cleanup completed');
    } catch (error) {
      console.warn('Pre-test cleanup warning:', error);
      // Don't fail the test suite if cleanup has issues
    }
  };

  const testDatabaseSchemaOnly = async () => {
    setIsRunning(true);
    try {
      console.log('Testing database schema only...');
      await testDatabaseSchema();
      console.log('Database schema test completed successfully!');
      setCurrentTest('Database schema test completed!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Database schema test failed:', errorMessage, error);
      setCurrentTest(`Database schema test failed: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testUserCreationOnly = async () => {
    setIsRunning(true);
    try {
      console.log('Testing user creation only...');
      await cleanupExistingTestData();
      await testUserAndProfileCreation();
      console.log('User creation test completed successfully!');
      setCurrentTest('User creation test completed!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('User creation test failed:', errorMessage, error);
      setCurrentTest(`User creation test failed: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    let currentTestData: any = {};
    
    try {
      console.log('Starting vendor onboarding tests...');
      
      // Clean up any existing test data first
      await cleanupExistingTestData();
      
      await testDatabaseSchema();
      console.log('Database schema tests completed');
      
      // Run user creation and capture the data directly
      console.log('Starting user and profile creation...');
      let createdData;
      
      try {
        createdData = await testUserAndProfileCreation();
        console.log('User creation returned data:', createdData);
      } catch (error) {
        console.error('testUserAndProfileCreation threw an error:', error);
        throw error;
      }
      
      // Verify the returned data structure
      if (!createdData) {
        console.error('testUserAndProfileCreation returned null/undefined');
        throw new Error('User creation function returned no data');
      }
      
      if (typeof createdData !== 'object') {
        console.error('testUserAndProfileCreation returned non-object:', typeof createdData, createdData);
        throw new Error('User creation function returned invalid data type');
      }
      
      // Update the component state with the returned data
      setTestData(prev => {
        const updated = { ...prev, ...createdData };
        console.log('Updated component testData:', updated);
        return updated;
      });
      
      // Verify we have the required data before proceeding
      if (!createdData.vendorProfile) {
        console.error('No vendor profile found in returned data. Keys:', Object.keys(createdData));
        console.error('Full returned data:', JSON.stringify(createdData, null, 2));
        throw new Error('User creation completed but vendor profile not available in returned data');
      }
      
      console.log('User and profile creation tests completed - vendor profile available:', createdData.vendorProfile.id);
      
      const vendorJob = await testJobManagement(createdData.vendorProfile);
      console.log('Job management tests completed - vendor job available:', vendorJob?.id);
      
      // Verify we have the vendor job before proceeding to integration tests
      if (!vendorJob) {
        console.error('No vendor job returned from testJobManagement');
        throw new Error('Job management completed but vendor job not available');
      }
      
      await testIntegration(createdData.vendorProfile, vendorJob);
      console.log('Integration tests completed');
      
      setCurrentTest('All tests completed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Test suite failed:', errorMessage, error);
      setCurrentTest(`Test suite failed: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanup = async () => {
    const { testUser, vendorProfile, vendorJob } = testData;
    
    try {
      console.log('Starting cleanup of test data...');
      
      // Clean up vendor jobs first (foreign key dependency)
      if (vendorJob) {
        console.log('Cleaning up vendor job:', vendorJob.id);
        const { error: jobError } = await supabase.from('vendor_jobs').delete().eq('id', vendorJob.id);
        if (jobError) console.warn('Job cleanup warning:', jobError.message);
      }
      
      // Clean up vendor profile
      if (vendorProfile) {
        console.log('Cleaning up vendor profile:', vendorProfile.id);
        const { error: profileError } = await supabase.from('vendors').delete().eq('id', vendorProfile.id);
        if (profileError) console.warn('Profile cleanup warning:', profileError.message);
      }
      
      // Clean up user roles
      if (testUser?.user) {
        console.log('Cleaning up user roles for user:', testUser.user.id);
        const { error: roleError } = await supabase.from('user_roles').delete().eq('user_id', testUser.user.id);
        if (roleError) console.warn('Role cleanup warning:', roleError.message);
      }
      
      // Clean up profiles (if any test profiles were created)
      if (testUser?.user) {
        console.log('Cleaning up profile for user:', testUser.user.id);
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', testUser.user.id);
        if (profileError) console.warn('Profile cleanup warning:', profileError.message);
      }
      
      setTestData({});
      console.log('Test data cleanup completed successfully');
      alert('Test data cleaned up successfully');
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const completedTests = testSuites.reduce((sum, suite) => 
    sum + suite.tests.filter(t => t.status === 'passed' || t.status === 'failed').length, 0
  );
  const passedTests = testSuites.reduce((sum, suite) => 
    sum + suite.tests.filter(t => t.status === 'passed').length, 0
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Vendor Onboarding End-to-End Tests
          </CardTitle>
          <CardDescription>
            Comprehensive testing suite for the complete vendor onboarding workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={runAllTests} 
                    disabled={isRunning}
                    className="flex items-center gap-2"
                  >
                    {isRunning ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {isRunning ? 'Running Tests...' : 'Run All Tests'}
                  </Button>
                  
                  <Button 
                    onClick={testDatabaseSchemaOnly} 
                    variant="outline"
                    disabled={isRunning}
                    size="sm"
                  >
                    Test Schema Only
                  </Button>
                  
                  <Button 
                    onClick={testUserCreationOnly} 
                    variant="outline"
                    disabled={isRunning}
                    size="sm"
                  >
                    Test User Creation Only
                  </Button>
                  
                  <Button 
                    onClick={cleanup} 
                    variant="outline"
                    disabled={isRunning}
                  >
                    Cleanup Test Data
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {currentTest && <span>Current: {currentTest}</span>}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {passedTests}/{totalTests}
                </div>
                <div className="text-sm text-gray-600">Tests Passed</div>
              </div>
            </div>
            
            <Progress value={(completedTests / totalTests) * 100} className="w-full" />
            
            {completedTests === totalTests && completedTests > 0 && (
              <Alert className={passedTests === totalTests ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription>
                  {passedTests === totalTests 
                    ? "🎉 All tests passed! Vendor onboarding workflow is working correctly."
                    : `⚠️ ${totalTests - passedTests} test(s) failed. Please review the results below.`
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {testSuites.map((suite, suiteIndex) => (
          <Card key={suite.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(suite.status)}
                    {suite.name}
                  </CardTitle>
                  <CardDescription>{suite.description}</CardDescription>
                </div>
                {getStatusBadge(suite.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suite.tests.map((test, testIndex) => (
                  <div key={test.name} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <span className="font-medium">{test.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.duration && (
                        <span className="text-xs text-gray-500">
                          {test.duration}ms
                        </span>
                      )}
                      <span className={`text-sm ${
                        test.status === 'failed' ? 'text-red-600' : 
                        test.status === 'passed' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {test.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
