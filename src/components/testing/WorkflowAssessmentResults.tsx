import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  Home, 
  Settings, 
  FileText, 
  Shield,
  Wrench,
  Eye,
  CreditCard
} from 'lucide-react';

interface WorkflowIssue {
  id: string;
  workflow: string;
  category: 'critical' | 'major' | 'minor' | 'enhancement';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  status: 'identified' | 'investigating' | 'fixed' | 'wont-fix';
  affectedRoles: string[];
}

/**
 * Comprehensive Workflow Assessment Results
 * Documents all identified issues across the Nigeria Homes platform workflows
 */
export const WorkflowAssessmentResults: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Comprehensive list of identified workflow issues
  const workflowIssues: WorkflowIssue[] = [
    // CRITICAL ISSUES (SECURITY/DATA INTEGRITY)
    {
      id: 'WF-001',
      workflow: 'Agent Property Access',
      category: 'critical',
      title: 'Agent Property Visibility Security Breach',
      description: 'Agents could see ALL properties instead of only assigned ones',
      impact: 'Major security/privacy violation - agents could access competitor data',
      recommendation: 'Implement role-based property filtering in useProperties hook',
      status: 'fixed',
      affectedRoles: ['agent', 'owner', 'admin']
    },
    
    // MAJOR ISSUES (WORKFLOW PROBLEMS)
    {
      id: 'WF-002',
      workflow: 'User Onboarding',
      category: 'major',
      title: 'Agents Use Owner Onboarding Form',
      description: 'Agents are directed to OwnerOnboardingForm which contains owner-specific fields (company, address) that may not be relevant for agents',
      impact: 'Confusing UX for agents, inappropriate data collection, workflow mismatch',
      recommendation: 'Create dedicated AgentOnboardingForm with agent-specific fields and workflow',
      status: 'identified',
      affectedRoles: ['agent']
    },
    {
      id: 'WF-003',
      workflow: 'User Role Assignment',
      category: 'major',
      title: 'Missing Automated Role Assignment',
      description: 'User roles are not automatically assigned during signup - requires manual intervention',
      impact: 'Users may be stuck without proper access, admin overhead, poor UX',
      recommendation: 'Implement automated role assignment based on signup context or user selection',
      status: 'identified',
      affectedRoles: ['all']
    },
    {
      id: 'WF-004',
      workflow: 'Agent Assignment',
      category: 'major',
      title: 'No Agent Assignment Workflow',
      description: 'No clear workflow for assigning agents to properties - appears to be manual only',
      impact: 'Properties may remain unassigned, agents may not know their responsibilities',
      recommendation: 'Create agent assignment workflow with notifications and tracking',
      status: 'identified',
      affectedRoles: ['admin', 'agent', 'owner']
    },
    {
      id: 'WF-005',
      workflow: 'Vendor Management',
      category: 'major',
      title: 'Missing Vendor Onboarding and Assignment',
      description: 'No dedicated vendor onboarding flow or maintenance assignment workflow',
      impact: 'Vendors cannot be properly onboarded or assigned to maintenance tasks',
      recommendation: 'Create vendor onboarding form and maintenance assignment system',
      status: 'identified',
      affectedRoles: ['vendor', 'admin', 'owner']
    },
    
    // MINOR ISSUES (UX IMPROVEMENTS)
    {
      id: 'WF-006',
      workflow: 'Property Creation',
      category: 'minor',
      title: 'Agent Dropdown Shows "No Users Found"',
      description: 'Agent assignment dropdown in Add Property form may show "No users with agent role found" even when agents exist',
      impact: 'Properties cannot be assigned to agents during creation',
      recommendation: 'Debug agent role query and ensure proper role assignment',
      status: 'investigating',
      affectedRoles: ['owner', 'admin']
    },
    {
      id: 'WF-007',
      workflow: 'Tenant Application',
      category: 'minor',
      title: 'Tenant Application Process Unclear',
      description: 'No clear workflow for tenants to apply for properties or track application status',
      impact: 'Tenants may not know how to apply, owners may miss applications',
      recommendation: 'Create tenant application workflow with status tracking',
      status: 'identified',
      affectedRoles: ['tenant', 'owner', 'agent']
    },
    {
      id: 'WF-008',
      workflow: 'Document Management',
      category: 'minor',
      title: 'Document Upload/Preview Issues',
      description: 'Document upload and preview functionality had issues (recently fixed)',
      impact: 'Users cannot upload or view important documents',
      recommendation: 'Continue monitoring document functionality for stability',
      status: 'fixed',
      affectedRoles: ['all']
    },
    
    // ENHANCEMENT OPPORTUNITIES
    {
      id: 'WF-009',
      workflow: 'Email Verification',
      category: 'enhancement',
      title: 'Email Verification Workflow',
      description: 'Need to verify email verification workflow is working properly',
      impact: 'Unverified users may have limited access or security issues',
      recommendation: 'Test and document email verification process',
      status: 'identified',
      affectedRoles: ['all']
    },
    {
      id: 'WF-010',
      workflow: 'Payment Processing',
      category: 'enhancement',
      title: 'Payment Workflow Integration',
      description: 'Payment processing workflows need verification and testing',
      impact: 'Payment failures could affect business operations',
      recommendation: 'Comprehensive testing of payment flows with Paystack integration',
      status: 'identified',
      affectedRoles: ['tenant', 'owner']
    },
    {
      id: 'WF-011',
      workflow: 'Maintenance Requests',
      category: 'enhancement',
      title: 'Maintenance Request Workflow',
      description: 'Maintenance request creation, assignment, and tracking workflow needs verification',
      impact: 'Maintenance issues may not be properly tracked or resolved',
      recommendation: 'Test end-to-end maintenance request workflow',
      status: 'identified',
      affectedRoles: ['tenant', 'vendor', 'owner', 'agent']
    },
    {
      id: 'WF-012',
      workflow: 'Notifications',
      category: 'enhancement',
      title: 'Notification System',
      description: 'Email and in-app notification workflows need testing and verification',
      impact: 'Users may miss important updates and communications',
      recommendation: 'Test notification delivery and user preferences',
      status: 'identified',
      affectedRoles: ['all']
    }
  ];

  const getStatusIcon = (status: WorkflowIssue['status']) => {
    switch (status) {
      case 'fixed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'investigating': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'identified': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'wont-fix': return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category: WorkflowIssue['category']) => {
    const variants = {
      critical: 'destructive' as const,
      major: 'secondary' as const,
      minor: 'outline' as const,
      enhancement: 'default' as const,
    };
    const colors = {
      critical: 'bg-red-100 text-red-800',
      major: 'bg-orange-100 text-orange-800',
      minor: 'bg-yellow-100 text-yellow-800',
      enhancement: 'bg-blue-100 text-blue-800',
    };
    return (
      <Badge variant={variants[category]} className={colors[category]}>
        {category.toUpperCase()}
      </Badge>
    );
  };

  const getWorkflowIcon = (workflow: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Agent Property Access': <Shield className="h-4 w-4" />,
      'User Onboarding': <Users className="h-4 w-4" />,
      'User Role Assignment': <Settings className="h-4 w-4" />,
      'Agent Assignment': <Users className="h-4 w-4" />,
      'Vendor Management': <Wrench className="h-4 w-4" />,
      'Property Creation': <Home className="h-4 w-4" />,
      'Tenant Application': <FileText className="h-4 w-4" />,
      'Document Management': <FileText className="h-4 w-4" />,
      'Email Verification': <Settings className="h-4 w-4" />,
      'Payment Processing': <CreditCard className="h-4 w-4" />,
      'Maintenance Requests': <Wrench className="h-4 w-4" />,
      'Notifications': <Settings className="h-4 w-4" />,
    };
    return iconMap[workflow] || <Settings className="h-4 w-4" />;
  };

  const filteredIssues = selectedCategory === 'all' 
    ? workflowIssues 
    : workflowIssues.filter(issue => issue.category === selectedCategory);

  const stats = {
    total: workflowIssues.length,
    critical: workflowIssues.filter(i => i.category === 'critical').length,
    major: workflowIssues.filter(i => i.category === 'major').length,
    minor: workflowIssues.filter(i => i.category === 'minor').length,
    enhancement: workflowIssues.filter(i => i.category === 'enhancement').length,
    fixed: workflowIssues.filter(i => i.status === 'fixed').length,
    identified: workflowIssues.filter(i => i.status === 'identified').length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Comprehensive Workflow Assessment Results</span>
          </CardTitle>
          <CardDescription>
            Systematic evaluation of all major workflows across the Nigeria Homes platform.
            This assessment identifies critical issues, workflow gaps, and improvement opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Issues</div>
            </Card>
            <Card className="p-4 border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </Card>
            <Card className="p-4 border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{stats.major}</div>
              <div className="text-sm text-muted-foreground">Major</div>
            </Card>
            <Card className="p-4 border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.fixed}</div>
              <div className="text-sm text-muted-foreground">Fixed</div>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={selectedCategory === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('critical')}
              className="border-red-200"
            >
              Critical ({stats.critical})
            </Button>
            <Button
              variant={selectedCategory === 'major' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('major')}
              className="border-orange-200"
            >
              Major ({stats.major})
            </Button>
            <Button
              variant={selectedCategory === 'minor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('minor')}
              className="border-yellow-200"
            >
              Minor ({stats.minor})
            </Button>
            <Button
              variant={selectedCategory === 'enhancement' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('enhancement')}
              className="border-blue-200"
            >
              Enhancement ({stats.enhancement})
            </Button>
          </div>

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <Card key={issue.id} className={`border-l-4 ${
                issue.category === 'critical' ? 'border-l-red-500' :
                issue.category === 'major' ? 'border-l-orange-500' :
                issue.category === 'minor' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getWorkflowIcon(issue.workflow)}
                      <div>
                        <h4 className="font-semibold">{issue.title}</h4>
                        <p className="text-sm text-muted-foreground">{issue.workflow} • ID: {issue.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(issue.status)}
                      {getCategoryBadge(issue.category)}
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Description:</strong> {issue.description}
                    </div>
                    <div>
                      <strong>Impact:</strong> {issue.impact}
                    </div>
                    <div>
                      <strong>Recommendation:</strong> {issue.recommendation}
                    </div>
                    <div className="flex items-center space-x-2">
                      <strong>Affected Roles:</strong>
                      {issue.affectedRoles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Summary */}
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Priority Actions:</strong> {stats.critical} critical issues require immediate attention. 
              {stats.major} major workflow problems need resolution. 
              {stats.identified} total issues identified for improvement.
              {stats.fixed > 0 && ` ${stats.fixed} issues have been successfully resolved.`}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
