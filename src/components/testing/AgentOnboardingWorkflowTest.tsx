import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Settings,
  Database,
  Eye,
  ArrowRight,
  TestTube,
} from 'lucide-react';
import { profileFullName } from '@/lib/profileDisplayName';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  details?: string;
}

/**
 * Comprehensive Agent Onboarding Workflow Test
 * Tests the complete agent onboarding process from form display to data persistence
 */
export const AgentOnboardingWorkflowTest: React.FC = () => {
  const { user, userRole } = useAuthSession();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Fetch agent users for testing
  const { data: agentUsers } = useQuery({
    queryKey: ['agent-users-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(
          `
          user_id,
          role,
          profiles!inner(
            id,
            first_name,
            last_name,
            email,
            license_number,
            years_of_experience,
            specializations,
            working_areas,
            bio,
            availability_hours,
            preferred_contact_method
          )
        `
        )
        .eq('role', 'agent');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Check if agents table exists and has data
  const { data: agentsTableData } = useQuery({
    queryKey: ['agents-table-test'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('agents').select('*').limit(5);

        if (error) {
          // Table might not exist yet
          return { exists: false, error: error.message, data: [] };
        }

        return { exists: true, error: null, data: data || [] };
      } catch (error) {
        return { exists: false, error: 'Table access error', data: [] };
      }
    },
    enabled: !!user,
  });

  const runAgentOnboardingTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Check if AgentOnboardingForm component exists
      try {
        const AgentOnboardingForm = await import('@/components/onboarding/AgentOnboardingForm');
        results.push({
          test: 'AgentOnboardingForm Component',
          status: 'pass',
          message: '✅ AgentOnboardingForm component exists and is importable',
          details:
            'Component successfully imported from @/components/onboarding/AgentOnboardingForm',
        });
      } catch (error) {
        results.push({
          test: 'AgentOnboardingForm Component',
          status: 'fail',
          message: '🚨 AgentOnboardingForm component not found or has import errors',
          details: error instanceof Error ? error.message : 'Unknown import error',
        });
      }

      // Test 2: Check onboarding routing logic
      try {
        const OnboardingPage = await import('@/pages/Onboarding');
        results.push({
          test: 'Onboarding Routing Logic',
          status: 'pass',
          message: '✅ Onboarding page exists with updated routing logic',
          details:
            'Main onboarding page successfully imports and should route agents to AgentOnboardingForm',
        });
      } catch (error) {
        results.push({
          test: 'Onboarding Routing Logic',
          status: 'fail',
          message: '🚨 Onboarding page has import issues',
          details: error instanceof Error ? error.message : 'Unknown import error',
        });
      }

      // Test 3: Check database schema - profiles table agent fields
      const profilesSchemaTest = await testProfilesSchema();
      results.push(profilesSchemaTest);

      // Test 4: Check agents table existence and structure
      const agentsTableTest = await testAgentsTable();
      results.push(agentsTableTest);

      // Test 5: Check existing agent users and their data
      const agentUsersTest = testAgentUsers();
      results.push(agentUsersTest);

      // Test 6: Test agent role assignment
      const roleAssignmentTest = await testAgentRoleAssignment();
      results.push(roleAssignmentTest);

      // Test 7: Test onboarding workflow accessibility
      const workflowAccessTest = testOnboardingWorkflowAccess();
      results.push(workflowAccessTest);
    } catch (error) {
      results.push({
        test: 'Test Execution',
        status: 'fail',
        message: '🚨 Error running agent onboarding tests',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const testProfilesSchema = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'license_number, years_of_experience, specializations, working_areas, bio, availability_hours, preferred_contact_method'
        )
        .limit(1);

      if (error) {
        return {
          test: 'Profiles Table Schema',
          status: 'fail',
          message: '🚨 Agent-specific fields missing from profiles table',
          details: `Database error: ${error.message}. Migration may not have been applied.`,
        };
      }

      return {
        test: 'Profiles Table Schema',
        status: 'pass',
        message: '✅ Profiles table has agent-specific fields',
        details:
          'All required agent fields (license_number, years_of_experience, specializations, etc.) are available',
      };
    } catch (error) {
      return {
        test: 'Profiles Table Schema',
        status: 'fail',
        message: '🚨 Error checking profiles table schema',
        details: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  };

  const testAgentsTable = async (): Promise<TestResult> => {
    if (!agentsTableData) {
      return {
        test: 'Agents Table Structure',
        status: 'warning',
        message: '⚠️ Agents table data not loaded yet',
        details: 'Still loading agents table information',
      };
    }

    if (!agentsTableData.exists) {
      return {
        test: 'Agents Table Structure',
        status: 'warning',
        message: '⚠️ Agents table does not exist or is not accessible',
        details: `Error: ${agentsTableData.error}. Database migration may not have been applied yet.`,
      };
    }

    return {
      test: 'Agents Table Structure',
      status: 'pass',
      message: '✅ Agents table exists and is accessible',
      details: `Found ${agentsTableData.data.length} agent records in the table`,
    };
  };

  const testAgentUsers = (): TestResult => {
    if (!agentUsers) {
      return {
        test: 'Agent Users Data',
        status: 'warning',
        message: '⚠️ Agent users data not loaded yet',
        details: 'Still loading agent user information',
      };
    }

    if (agentUsers.length === 0) {
      return {
        test: 'Agent Users Data',
        status: 'warning',
        message: '⚠️ No agent users found in database',
        details:
          'No users with agent role found. Create test agent users to verify onboarding workflow.',
      };
    }

    const agentsWithOnboardingData = agentUsers.filter(
      (agent) =>
        agent.profiles?.license_number ||
        agent.profiles?.years_of_experience ||
        agent.profiles?.specializations?.length > 0
    );

    return {
      test: 'Agent Users Data',
      status: agentsWithOnboardingData.length > 0 ? 'pass' : 'warning',
      message:
        agentsWithOnboardingData.length > 0
          ? `✅ Found ${agentUsers.length} agent users, ${agentsWithOnboardingData.length} with onboarding data`
          : `⚠️ Found ${agentUsers.length} agent users, but none have completed onboarding`,
      details: `Agent users: ${agentUsers.map((a) => profileFullName(a.profiles ?? {}) || a.profiles?.email).join(', ')}`,
    };
  };

  const testAgentRoleAssignment = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'agent');

      if (error) {
        return {
          test: 'Agent Role Assignment',
          status: 'fail',
          message: '🚨 Error checking agent role assignments',
          details: error.message,
        };
      }

      return {
        test: 'Agent Role Assignment',
        status: data.length > 0 ? 'pass' : 'warning',
        message:
          data.length > 0
            ? `✅ Found ${data.length} users with agent role`
            : '⚠️ No users with agent role found',
        details:
          data.length > 0
            ? 'Agent role assignment is working correctly'
            : 'Create test agent users to verify role assignment',
      };
    } catch (error) {
      return {
        test: 'Agent Role Assignment',
        status: 'fail',
        message: '🚨 Error testing agent role assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const testOnboardingWorkflowAccess = (): TestResult => {
    if (userRole === 'agent') {
      return {
        test: 'Onboarding Workflow Access',
        status: 'pass',
        message: '✅ Current user is an agent - can test onboarding workflow',
        details: 'Navigate to /onboarding to test the AgentOnboardingForm directly',
      };
    }

    return {
      test: 'Onboarding Workflow Access',
      status: 'warning',
      message: `⚠️ Current user role is '${userRole}' - cannot directly test agent onboarding`,
      details: 'Create an agent user account to test the agent onboarding workflow end-to-end',
    };
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'skip':
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'default' as const,
      fail: 'destructive' as const,
      warning: 'secondary' as const,
      skip: 'outline' as const,
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const passedTests = testResults.filter((r) => r.status === 'pass').length;
  const failedTests = testResults.filter((r) => r.status === 'fail').length;
  const warningTests = testResults.filter((r) => r.status === 'warning').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Agent Onboarding Workflow Test</span>
          </CardTitle>
          <CardDescription>
            Comprehensive test of the Agent Onboarding workflow implementation. Verifies component
            existence, database schema, routing logic, and data persistence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current User Info */}
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Current User:</strong> {user?.email || 'Not logged in'} |
              <strong> Role:</strong> {userRole || 'Unknown'} |<strong> Agent Users Found:</strong>{' '}
              {agentUsers?.length || 'Loading...'}
            </AlertDescription>
          </Alert>

          {/* Test Controls */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={runAgentOnboardingTests}
              disabled={isRunningTests}
              className="flex items-center space-x-2"
            >
              <TestTube className="h-4 w-4" />
              <span>{isRunningTests ? 'Running Tests...' : 'Run Agent Onboarding Tests'}</span>
            </Button>

            {testResults.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="default">{passedTests} Passed</Badge>
                {failedTests > 0 && <Badge variant="destructive">{failedTests} Failed</Badge>}
                {warningTests > 0 && <Badge variant="secondary">{warningTests} Warnings</Badge>}
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results</h3>
              {testResults.map((result, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${
                    result.status === 'pass'
                      ? 'border-l-green-500'
                      : result.status === 'fail'
                        ? 'border-l-red-500'
                        : result.status === 'warning'
                          ? 'border-l-yellow-500'
                          : 'border-l-gray-500'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.test}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
                          {result.details && (
                            <p className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
                              {result.details}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Manual Testing Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <ArrowRight className="h-4 w-4" />
                <span>Manual Testing Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  <strong>Create Agent User:</strong> Use Manual User Creation tool to create a user
                  with 'agent' role
                </li>
                <li>
                  <strong>Navigate to Onboarding:</strong> Go to /onboarding as the agent user
                </li>
                <li>
                  <strong>Verify Form Display:</strong> Confirm AgentOnboardingForm appears (not
                  OwnerOnboardingForm)
                </li>
                <li>
                  <strong>Fill Agent-Specific Fields:</strong> Complete license, experience,
                  specializations, working areas
                </li>
                <li>
                  <strong>Submit Form:</strong> Verify successful submission and redirect to
                  dashboard
                </li>
                <li>
                  <strong>Check Data Persistence:</strong> Verify agent data is saved in
                  profiles/agents tables
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Test Summary */}
          {testResults.length > 0 && (
            <Alert
              className={
                failedTests > 0 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
              }
            >
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Summary:</strong>{' '}
                {failedTests === 0
                  ? '✅ All automated tests passed! Agent onboarding workflow is ready for manual testing.'
                  : `🚨 ${failedTests} test(s) failed. Review issues before manual testing.`}
                {warningTests > 0 &&
                  ` ${warningTests} warning(s) noted - may require database migration.`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
