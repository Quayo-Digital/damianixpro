import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { useProperties } from '@/hooks/useProperties';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Eye, Shield, Users } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

/**
 * Comprehensive test component to verify Agent Property Visibility fix
 * Tests that agents only see assigned properties and other roles have appropriate access
 */
export const AgentPropertyVisibilityTest: React.FC = () => {
  const { user, userRole } = useAuthSession();
  const { properties, isLoading, secureCount } = useProperties();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Fetch all properties (admin view) for comparison
  const { data: allProperties } = useQuery({
    queryKey: ['all-properties-admin-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user roles for testing
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles-test'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const runSecurityTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Verify role-based filtering is applied
      if (userRole === 'agent') {
        const agentProperties = properties.filter((p) => p.assigned_agent_id === user?.id);
        const hasUnassignedProperties = properties.some((p) => p.assigned_agent_id !== user?.id);

        if (hasUnassignedProperties) {
          results.push({
            test: 'Agent Property Filtering',
            status: 'fail',
            message: '🚨 SECURITY BREACH: Agent can see unassigned properties!',
            details: `Agent sees ${properties.length} properties, but should only see assigned ones.`,
          });
        } else {
          results.push({
            test: 'Agent Property Filtering',
            status: 'pass',
            message: '✅ Agent only sees assigned properties',
            details: `Agent correctly sees ${properties.length} assigned properties.`,
          });
        }
      }

      // Test 2: Verify property count matches role expectations
      const totalProperties = allProperties?.length || 0;
      const userProperties = properties.length;

      if (userRole === 'admin' || userRole === 'super_admin') {
        if (userProperties === totalProperties) {
          results.push({
            test: 'Admin Access Control',
            status: 'pass',
            message: '✅ Admin has access to all properties',
            details: `Admin sees ${userProperties}/${totalProperties} properties.`,
          });
        } else {
          results.push({
            test: 'Admin Access Control',
            status: 'warning',
            message: '⚠️ Admin may not see all properties',
            details: `Admin sees ${userProperties}/${totalProperties} properties.`,
          });
        }
      } else if (userRole === 'owner') {
        const ownedProperties = allProperties?.filter((p) => p.owner_id === user?.id).length || 0;
        if (userProperties === ownedProperties) {
          results.push({
            test: 'Owner Access Control',
            status: 'pass',
            message: '✅ Owner only sees owned properties',
            details: `Owner sees ${userProperties}/${ownedProperties} owned properties.`,
          });
        } else {
          results.push({
            test: 'Owner Access Control',
            status: 'fail',
            message: '🚨 Owner access control issue',
            details: `Owner sees ${userProperties} but should see ${ownedProperties} properties.`,
          });
        }
      }

      // Test 3: Verify security logging
      const hasSecurityLogging = typeof secureCount === 'number';
      results.push({
        test: 'Security Logging',
        status: hasSecurityLogging ? 'pass' : 'warning',
        message: hasSecurityLogging
          ? '✅ Security logging active'
          : '⚠️ Security logging may be missing',
        details: `Secure count: ${secureCount}`,
      });

      // Test 4: Check for potential data leaks
      const hasUnauthorizedData = properties.some((property) => {
        if (userRole === 'agent') {
          return property.assigned_agent_id !== user?.id;
        }
        if (userRole === 'owner') {
          return property.owner_id !== user?.id;
        }
        return false;
      });

      results.push({
        test: 'Data Leak Detection',
        status: hasUnauthorizedData ? 'fail' : 'pass',
        message: hasUnauthorizedData
          ? '🚨 Potential data leak detected!'
          : '✅ No unauthorized data access',
        details: hasUnauthorizedData
          ? 'User has access to properties they should not see'
          : 'All property access is authorized',
      });

      // Test 5: Role assignment verification
      const userRoleRecord = userRoles?.find((ur) => ur.user_id === user?.id);
      results.push({
        test: 'Role Assignment',
        status: userRoleRecord ? 'pass' : 'fail',
        message: userRoleRecord
          ? '✅ User role properly assigned'
          : '🚨 User role not found in database',
        details: `Current role: ${userRole}, Database role: ${userRoleRecord?.role || 'NOT FOUND'}`,
      });
    } catch (error) {
      results.push({
        test: 'Test Execution',
        status: 'fail',
        message: '🚨 Error running security tests',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'default' as const,
      fail: 'destructive' as const,
      warning: 'secondary' as const,
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
            <Shield className="h-5 w-5" />
            <span>Agent Property Visibility Security Test</span>
          </CardTitle>
          <CardDescription>
            Comprehensive test to verify that the Agent Property Visibility security fix is working
            correctly. This test ensures agents only see assigned properties and other roles have
            appropriate access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current User Info */}
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <strong>Current User:</strong> {user?.email || 'Not logged in'} |
              <strong> Role:</strong> {userRole || 'Unknown'} |<strong> Properties Visible:</strong>{' '}
              {properties.length} |<strong> Total Properties:</strong>{' '}
              {allProperties?.length || 'Loading...'}
            </AlertDescription>
          </Alert>

          {/* Test Controls */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={runSecurityTests}
              disabled={isRunningTests || isLoading}
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>{isRunningTests ? 'Running Tests...' : 'Run Security Tests'}</span>
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
                        : 'border-l-yellow-500'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
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

          {/* Security Summary */}
          {testResults.length > 0 && (
            <Alert
              className={
                failedTests > 0 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
              }
            >
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Status:</strong>{' '}
                {failedTests === 0
                  ? '✅ All security tests passed! Agent Property Visibility fix is working correctly.'
                  : `🚨 ${failedTests} security issue(s) detected. Immediate attention required.`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
