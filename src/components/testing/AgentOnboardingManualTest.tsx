import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  ArrowRight,
  Users,
  Settings,
  Eye,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface TestStep {
  id: number;
  title: string;
  description: string;
  action: string;
  expectedResult: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
}

/**
 * Manual Test Instructions for Agent Onboarding Workflow
 * Provides step-by-step testing guide for verifying the Agent Onboarding implementation
 */
export const AgentOnboardingManualTest: React.FC = () => {
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    {
      id: 1,
      title: 'Create Test Agent User',
      description: 'Create a new user with agent role to test the onboarding workflow',
      action: 'Go to Testing Page → Create User tab → Create user with role "agent"',
      expectedResult: 'New agent user created successfully with proper role assignment',
      status: 'pending',
    },
    {
      id: 2,
      title: 'Navigate to Onboarding',
      description: 'Access the onboarding page as the newly created agent user',
      action: 'Login as the agent user and navigate to /onboarding',
      expectedResult: 'AgentOnboardingForm displays (not OwnerOnboardingForm)',
      status: 'pending',
    },
    {
      id: 3,
      title: 'Verify Form Fields',
      description: 'Check that agent-specific fields are present and appropriate',
      action:
        'Review form fields: license number, experience, specializations, working areas, bio, availability',
      expectedResult:
        'All agent-specific fields visible, no owner-specific fields (company name, address)',
      status: 'pending',
    },
    {
      id: 4,
      title: 'Fill Basic Information',
      description: 'Complete the basic information section',
      action: 'Enter full name, phone number, select preferred contact method',
      expectedResult: 'Fields accept input with proper validation',
      status: 'pending',
    },
    {
      id: 5,
      title: 'Complete Professional Information',
      description: 'Fill out agent-specific professional details',
      action:
        'Enter license number, select experience level, choose specializations and working areas',
      expectedResult: 'Checkboxes work for specializations/areas, dropdowns function correctly',
      status: 'pending',
    },
    {
      id: 6,
      title: 'Add Professional Bio',
      description: 'Enter professional bio and set availability',
      action: 'Write bio in textarea, select availability hours',
      expectedResult: 'Textarea accepts multi-line input, availability dropdown works',
      status: 'pending',
    },
    {
      id: 7,
      title: 'Accept Terms and Submit',
      description: 'Complete the onboarding process',
      action: 'Check terms agreement checkbox, click "Complete Agent Profile"',
      expectedResult: 'Form validates, submits successfully, redirects to dashboard',
      status: 'pending',
    },
    {
      id: 8,
      title: 'Verify Data Persistence',
      description: 'Check that agent data was saved correctly',
      action: 'Check user profile, verify data in database tables (profiles, agents)',
      expectedResult: 'Agent data persisted in both profiles and agents tables',
      status: 'pending',
    },
    {
      id: 9,
      title: 'Test Dashboard Access',
      description: 'Verify agent can access appropriate dashboard features',
      action: 'Navigate through agent dashboard, check property access',
      expectedResult:
        'Agent dashboard loads, only assigned properties visible (security fix verified)',
      status: 'pending',
    },
    {
      id: 10,
      title: 'Verify Workflow Separation',
      description: 'Confirm agents no longer use owner onboarding form',
      action: 'Create another agent user, verify they get AgentOnboardingForm',
      expectedResult: 'Consistent routing to AgentOnboardingForm for all agent users',
      status: 'pending',
    },
  ]);

  const updateTestStep = (id: number, status: TestStep['status'], notes?: string) => {
    setTestSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status, notes } : step))
    );
  };

  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <ArrowRight className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestStep['status']) => {
    const variants = {
      completed: 'default' as const,
      failed: 'destructive' as const,
      pending: 'secondary' as const,
    };
    const colors = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const completedSteps = testSteps.filter((s) => s.status === 'completed').length;
  const failedSteps = testSteps.filter((s) => s.status === 'failed').length;
  const totalSteps = testSteps.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Agent Onboarding Manual Test Guide</span>
          </CardTitle>
          <CardDescription>
            Step-by-step manual testing guide to verify the Agent Onboarding workflow
            implementation. Follow these steps to ensure the AgentOnboardingForm works correctly and
            resolves WF-002.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalSteps}</div>
              <div className="text-sm text-muted-foreground">Total Steps</div>
            </Card>
            <Card className="border-green-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </Card>
            <Card className="border-red-200 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{failedSteps}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </Card>
          </div>

          {/* Quick Links */}
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              <strong>Quick Links:</strong>
              <a href="/testing" className="ml-2 text-blue-600 hover:underline">
                Testing Page
              </a>{' '}
              |
              <a href="/onboarding" className="ml-2 text-blue-600 hover:underline">
                Onboarding
              </a>{' '}
              |
              <a href="/dashboard" className="ml-2 text-blue-600 hover:underline">
                Dashboard
              </a>
            </AlertDescription>
          </Alert>

          {/* Test Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manual Test Steps</h3>
            {testSteps.map((step) => (
              <Card
                key={step.id}
                className={`border-l-4 ${
                  step.status === 'completed'
                    ? 'border-l-green-500'
                    : step.status === 'failed'
                      ? 'border-l-red-500'
                      : 'border-l-gray-300'
                }`}
              >
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(step.status)}
                      <div className="flex-1">
                        <h4 className="font-medium">
                          Step {step.id}: {step.title}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>

                        <div className="mt-3 space-y-2">
                          <div className="rounded bg-blue-50 p-3">
                            <strong className="text-blue-800">Action:</strong>
                            <p className="mt-1 text-blue-700">{step.action}</p>
                          </div>

                          <div className="rounded bg-green-50 p-3">
                            <strong className="text-green-800">Expected Result:</strong>
                            <p className="mt-1 text-green-700">{step.expectedResult}</p>
                          </div>

                          {step.notes && (
                            <div className="rounded bg-yellow-50 p-3">
                              <strong className="text-yellow-800">Notes:</strong>
                              <p className="mt-1 text-yellow-700">{step.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTestStep(step.id, 'completed')}
                            disabled={step.status === 'completed'}
                          >
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateTestStep(step.id, 'failed', 'Manual test failed - see notes')
                            }
                            disabled={step.status === 'failed'}
                          >
                            Mark Failed
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateTestStep(step.id, 'pending')}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(step.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Test Summary */}
          <Alert
            className={
              failedSteps > 0
                ? 'border-red-500 bg-red-50'
                : completedSteps === totalSteps
                  ? 'border-green-500 bg-green-50'
                  : 'border-blue-500 bg-blue-50'
            }
          >
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Progress:</strong> {completedSteps}/{totalSteps} steps completed.
              {failedSteps > 0 && ` ${failedSteps} step(s) failed - review and fix issues.`}
              {completedSteps === totalSteps &&
                failedSteps === 0 &&
                ' ✅ All tests passed! Agent Onboarding workflow is working correctly.'}
              {completedSteps < totalSteps &&
                failedSteps === 0 &&
                ' Continue with manual testing to verify the implementation.'}
            </AlertDescription>
          </Alert>

          {/* Key Verification Points */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <Eye className="h-4 w-4" />
                <span>Key Verification Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-700">
              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong>Form Separation:</strong> Agents see AgentOnboardingForm, not
                  OwnerOnboardingForm
                </li>
                <li>
                  <strong>Agent-Specific Fields:</strong> License, experience, specializations,
                  working areas
                </li>
                <li>
                  <strong>No Owner Fields:</strong> Company name and address fields should not
                  appear
                </li>
                <li>
                  <strong>Data Persistence:</strong> Agent data saved in both profiles and agents
                  tables
                </li>
                <li>
                  <strong>Workflow Integration:</strong> Successful onboarding leads to proper
                  dashboard access
                </li>
                <li>
                  <strong>Security Verification:</strong> Agent only sees assigned properties
                  (previous fix confirmed)
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
