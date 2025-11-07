import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, User, Home, Wrench, Users, Settings, Eye } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'untested';
  details?: string;
  issues?: string[];
  recommendations?: string[];
}

interface WorkflowCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  steps: WorkflowStep[];
}

export function WorkflowAssessment() {
  const [selectedCategory, setSelectedCategory] = useState<string>('user-onboarding');
  const [testResults, setTestResults] = useState<Record<string, WorkflowStep>>({});

  const workflowCategories: WorkflowCategory[] = [
    {
      id: 'user-onboarding',
      title: 'User Onboarding',
      icon: <User className="h-4 w-4" />,
      steps: [
        {
          id: 'signup-process',
          title: 'User Registration/Signup',
          description: 'Test user registration for all roles (owner, agent, tenant, vendor)',
          status: 'untested',
          issues: ['Need to verify role assignment during signup'],
          recommendations: ['Test with different email addresses', 'Verify trigger functionality']
        },
        {
          id: 'email-verification',
          title: 'Email Verification',
          description: 'Check if email confirmation is required and working',
          status: 'untested'
        },
        {
          id: 'onboarding-flow',
          title: 'Onboarding Completion',
          description: 'Test the onboarding forms for each user role',
          status: 'untested'
        },
        {
          id: 'profile-creation',
          title: 'Profile Creation',
          description: 'Verify profiles are created with correct information',
          status: 'untested'
        },
        {
          id: 'role-assignment',
          title: 'Role Assignment',
          description: 'Confirm users get assigned correct roles during signup',
          status: 'untested'
        }
      ]
    },
    {
      id: 'property-management',
      title: 'Property Management',
      icon: <Home className="h-4 w-4" />,
      steps: [
        {
          id: 'property-creation',
          title: 'Property Creation (Owner)',
          description: 'Test property creation by owners',
          status: 'untested'
        },
        {
          id: 'agent-assignment',
          title: 'Agent Assignment',
          description: 'Test assigning agents to properties',
          status: 'warning',
          issues: ['Agents can see all properties regardless of assignment'],
          recommendations: ['Implement RLS policies to filter properties by assigned agent']
        },
        {
          id: 'property-visibility',
          title: 'Property Visibility Rules',
          description: 'Verify who can see which properties',
          status: 'fail',
          issues: ['Agents see all properties instead of only assigned ones'],
          details: 'Critical security/privacy issue - agents should only see assigned properties'
        },
        {
          id: 'property-editing',
          title: 'Property Editing Permissions',
          description: 'Test who can edit property details',
          status: 'untested'
        },
        {
          id: 'property-deletion',
          title: 'Property Deletion',
          description: 'Test property deletion permissions',
          status: 'untested'
        }
      ]
    },
    {
      id: 'agent-workflow',
      title: 'Agent Workflow',
      icon: <Users className="h-4 w-4" />,
      steps: [
        {
          id: 'agent-dashboard',
          title: 'Agent Dashboard',
          description: 'Test agent dashboard functionality',
          status: 'warning',
          issues: ['Dashboard may show unassigned properties']
        },
        {
          id: 'assigned-properties',
          title: 'Assigned Properties View',
          description: 'Verify agents only see their assigned properties',
          status: 'fail',
          issues: ['Agents see all properties, not just assigned ones']
        },
        {
          id: 'tenant-management',
          title: 'Tenant Management by Agent',
          description: 'Test agent ability to manage tenants for assigned properties',
          status: 'untested'
        },
        {
          id: 'showing-scheduling',
          title: 'Property Showing Scheduling',
          description: 'Test agent ability to schedule property viewings',
          status: 'untested'
        },
        {
          id: 'lead-management',
          title: 'Lead Management',
          description: 'Test agent lead tracking and management',
          status: 'untested'
        }
      ]
    },
    {
      id: 'vendor-workflow',
      title: 'Vendor Workflow',
      icon: <Wrench className="h-4 w-4" />,
      steps: [
        {
          id: 'vendor-onboarding',
          title: 'Vendor Onboarding',
          description: 'Test vendor registration and profile setup',
          status: 'untested'
        },
        {
          id: 'vendor-assignment',
          title: 'Vendor Assignment to Properties',
          description: 'Test assigning vendors to properties for maintenance',
          status: 'untested'
        },
        {
          id: 'maintenance-requests',
          title: 'Maintenance Request Workflow',
          description: 'Test end-to-end maintenance request process',
          status: 'untested'
        },
        {
          id: 'vendor-dashboard',
          title: 'Vendor Dashboard',
          description: 'Test vendor dashboard and assigned tasks view',
          status: 'untested'
        },
        {
          id: 'work-order-completion',
          title: 'Work Order Completion',
          description: 'Test vendor ability to mark work as complete',
          status: 'untested'
        }
      ]
    },
    {
      id: 'tenant-workflow',
      title: 'Tenant Workflow',
      icon: <Eye className="h-4 w-4" />,
      steps: [
        {
          id: 'property-search',
          title: 'Property Search & Browse',
          description: 'Test tenant ability to search and view available properties',
          status: 'untested'
        },
        {
          id: 'application-process',
          title: 'Rental Application Process',
          description: 'Test tenant application submission and approval workflow',
          status: 'untested'
        },
        {
          id: 'tenant-dashboard',
          title: 'Tenant Dashboard',
          description: 'Test tenant dashboard functionality',
          status: 'untested'
        },
        {
          id: 'payment-processing',
          title: 'Rent Payment Processing',
          description: 'Test tenant rent payment functionality',
          status: 'untested'
        },
        {
          id: 'maintenance-requests-tenant',
          title: 'Maintenance Requests (Tenant)',
          description: 'Test tenant ability to submit maintenance requests',
          status: 'untested'
        }
      ]
    },
    {
      id: 'admin-functions',
      title: 'Admin Functions',
      icon: <Settings className="h-4 w-4" />,
      steps: [
        {
          id: 'user-management',
          title: 'User Management',
          description: 'Test admin ability to manage all users',
          status: 'pass',
          details: 'User management working after recent fixes'
        },
        {
          id: 'role-management',
          title: 'Role Management',
          description: 'Test admin ability to assign/change user roles',
          status: 'pass',
          details: 'Role assignment working with new tools'
        },
        {
          id: 'system-settings',
          title: 'System Settings',
          description: 'Test admin access to system configuration',
          status: 'untested'
        },
        {
          id: 'analytics-reports',
          title: 'Analytics & Reports',
          description: 'Test admin analytics and reporting features',
          status: 'untested'
        },
        {
          id: 'data-management',
          title: 'Data Management',
          description: 'Test admin data import/export capabilities',
          status: 'untested'
        }
      ]
    }
  ];

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WorkflowStep['status']) => {
    const variants = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      untested: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const selectedCategoryData = workflowCategories.find(cat => cat.id === selectedCategory);

  const getOverallStats = () => {
    const allSteps = workflowCategories.flatMap(cat => cat.steps);
    const total = allSteps.length;
    const passed = allSteps.filter(step => step.status === 'pass').length;
    const failed = allSteps.filter(step => step.status === 'fail').length;
    const warnings = allSteps.filter(step => step.status === 'warning').length;
    const untested = allSteps.filter(step => step.status === 'untested').length;
    
    return { total, passed, failed, warnings, untested };
  };

  const stats = getOverallStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          🔍 Comprehensive Workflow Assessment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Systematic evaluation of all user workflows and platform functionality
        </p>
        
        {/* Overall Statistics */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Passed: {stats.passed}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Failed: {stats.failed}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Warnings: {stats.warnings}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <span className="text-sm">Untested: {stats.untested}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-6">
            {workflowCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1 text-xs">
                {category.icon}
                <span className="hidden sm:inline">{category.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {workflowCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {category.icon}
                  {category.title}
                </h3>
                
                <div className="space-y-3">
                  {category.steps.map((step) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(step.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{step.title}</h4>
                              {getStatusBadge(step.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {step.description}
                            </p>
                            
                            {step.details && (
                              <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                                <strong>Details:</strong> {step.details}
                              </div>
                            )}
                            
                            {step.issues && step.issues.length > 0 && (
                              <div className="text-sm bg-red-50 border border-red-200 rounded p-2 mb-2">
                                <strong>Issues:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {step.issues.map((issue, index) => (
                                    <li key={index}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {step.recommendations && step.recommendations.length > 0 && (
                              <div className="text-sm bg-green-50 border border-green-200 rounded p-2">
                                <strong>Recommendations:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {step.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Assessment Methodology</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Pass:</strong> Feature works correctly as expected</p>
            <p><strong>Fail:</strong> Feature is broken or has critical issues</p>
            <p><strong>Warning:</strong> Feature works but has minor issues or concerns</p>
            <p><strong>Untested:</strong> Feature needs to be tested</p>
          </div>
        </div>

        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">🚨 Critical Issues Identified</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• <strong>Agent Property Visibility:</strong> Agents can see all properties instead of only assigned ones</li>
            <li>• <strong>Security Concern:</strong> Potential privacy/security issue with property access</li>
            <li>• <strong>Role-Based Access:</strong> Need to implement proper RLS policies for property visibility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
