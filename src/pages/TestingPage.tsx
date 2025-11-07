// Testing Page for AI Features

import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { ComprehensiveTestSuite } from '@/components/testing/ComprehensiveTestSuite';
import { AIMatchingDemo } from '@/components/ai/AIMatchingDemo';
import { DocumentProcessingTests } from '@/components/testing/DocumentProcessingTests';
import { SubscriptionTests } from '@/components/testing/SubscriptionTests';
import { VoiceAssistantTests } from '@/components/testing/VoiceAssistantTests';
import { NigerianApiTests } from '@/components/testing/NigerianApiTests';
import { BlockchainTests } from '@/components/testing/BlockchainTests';
import { BlockchainAnalyticsTests } from '@/components/testing/BlockchainAnalyticsTests';
import { VRTourTests } from '@/components/testing/VRTourTests';
import { DatabaseCleanupTests } from '@/components/testing/DatabaseCleanupTests';
import { RoleAssignmentTool } from '@/components/testing/RoleAssignmentTool';
import { UserDatabaseCheck } from '@/components/testing/UserDatabaseCheck';
import { ManualUserCreation } from '@/components/testing/ManualUserCreation';
import { WorkflowAssessment } from '@/components/testing/WorkflowAssessment';
import { AgentPropertyVisibilityTest } from '@/components/testing/AgentPropertyVisibilityTest';
import { WorkflowAssessmentResults } from '@/components/testing/WorkflowAssessmentResults';
import { AgentOnboardingWorkflowTest } from '@/components/testing/AgentOnboardingWorkflowTest';
import { AgentOnboardingManualTest } from '@/components/testing/AgentOnboardingManualTest';
import { ComprehensiveAgentWorkflowTest } from '@/components/testing/ComprehensiveAgentWorkflowTest';
import { VendorOnboardingEndToEndTest } from '@/components/testing/VendorOnboardingEndToEndTest';
import { VendorDashboardTestRunner } from '@/components/testing/VendorDashboardTestRunner';
import EnhancedAgentDashboardTest from '@/components/testing/EnhancedAgentDashboardTest';
import EnhancedOwnerDashboardTest from '@/components/testing/EnhancedOwnerDashboardTest';
import { EnhancedTenantDashboardTest } from '@/components/testing/EnhancedTenantDashboardTest';
import { PaymentFunctionalityTest } from '@/components/testing/PaymentFunctionalityTest';
import PlatformOptimizationAssessment from '@/components/testing/PlatformOptimizationAssessment';
import { SecurityAuditTest } from '@/components/testing/SecurityAuditTest';
import { ComprehensiveOptimizationQA } from '@/components/testing/ComprehensiveOptimizationQA';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Users, Database, Settings, Activity, Brain, Zap, FileText, Smartphone, Headphones, Globe, Lock, BarChart3, Eye, Shield, AlertTriangle, Briefcase, Layout, CreditCard, TrendingUp } from 'lucide-react';

const TestingPage: React.FC = () => {
  return (
    <PageLayout>
      <PageContent 
        title="System Testing" 
        description="Comprehensive testing suite for AI-powered features"
      >
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This testing suite validates both the AI-powered property matching system and the predictive maintenance system.
              Run these tests to ensure all features are working correctly before production deployment.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="comprehensive" className="w-full">
            <TabsList className="flex w-full overflow-x-auto scrollbar-hide gap-1 p-1">
              <TabsTrigger value="comprehensive" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <TestTube className="h-4 w-4" />
                <span>Comprehensive Tests</span>
              </TabsTrigger>
              <TabsTrigger value="platform-optimization" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <TrendingUp className="h-4 w-4" />
                <span>Platform Optimization</span>
              </TabsTrigger>
              <TabsTrigger value="comprehensive-qa" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <Shield className="h-4 w-4" />
                <span>Comprehensive QA</span>
              </TabsTrigger>
              <TabsTrigger value="payment-functionality" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <CreditCard className="h-4 w-4" />
                <span>Payment System</span>
              </TabsTrigger>
              <TabsTrigger value="vendor-onboarding" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <Briefcase className="h-4 w-4" />
                <span>Vendor Onboarding</span>
              </TabsTrigger>
              <TabsTrigger value="vendor-dashboard" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <Layout className="h-4 w-4" />
                <span>Vendor Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="agent-dashboard" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <Users className="h-4 w-4" />
                <span>Agent Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="owner-dashboard" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <Layout className="h-4 w-4" />
                <span>Owner Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="tenant-dashboard" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <Users className="h-4 w-4" />
                <span>Tenant Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="security-audit" className="flex items-center space-x-2 whitespace-nowrap px-3 py-2">
                <Shield className="h-4 w-4" />
                <span>Security & Performance</span>
              </TabsTrigger>
              <TabsTrigger value="ai-matching" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Matching Demo</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Document Processing</span>
              </TabsTrigger>
              <TabsTrigger value="subscription-system" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Subscription System</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Maintenance Testing</span>
              </TabsTrigger>
              <TabsTrigger value="voice-assistant" className="flex items-center space-x-2">
                <Headphones className="h-4 w-4" />
                <span>Voice Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="nigerian-apis" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Nigerian APIs</span>
              </TabsTrigger>
              <TabsTrigger value="blockchain" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Blockchain</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="vr-tours" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>VR Tours</span>
              </TabsTrigger>
              <TabsTrigger value="database-cleanup" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Database Cleanup</span>
              </TabsTrigger>
              <TabsTrigger value="role-assignment" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Role Assignment</span>
              </TabsTrigger>
              <TabsTrigger value="user-database" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>User Database</span>
              </TabsTrigger>
              <TabsTrigger value="manual-user" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Create User</span>
              </TabsTrigger>
              <TabsTrigger value="workflow-assessment" className="flex items-center space-x-2">
                <TestTube className="h-4 w-4" />
                <span>Workflow Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="security-test" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Security Test</span>
              </TabsTrigger>
              <TabsTrigger value="workflow-results" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Assessment Results</span>
              </TabsTrigger>
              <TabsTrigger value="agent-onboarding-test" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Agent Onboarding Test</span>
              </TabsTrigger>
              <TabsTrigger value="comprehensive-agent-test" className="flex items-center space-x-2">
                <TestTube className="h-4 w-4" />
                <span>End-to-End Agent Test</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comprehensive">
              <ComprehensiveTestSuite />
            </TabsContent>

            <TabsContent value="platform-optimization">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Platform Optimization & Polish
                  </CardTitle>
                  <CardDescription>
                    Comprehensive assessment of platform performance, security, UX, and optimization opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlatformOptimizationAssessment />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comprehensive-qa">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Comprehensive Optimization QA
                  </CardTitle>
                  <CardDescription>
                    Complete validation of all optimization features including security, performance, AI/ML, caching, and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ComprehensiveOptimizationQA />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendor-onboarding">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Vendor Onboarding End-to-End Tests
                  </CardTitle>
                  <CardDescription>
                    Complete vendor onboarding workflow testing including user creation, profile setup, and job management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VendorOnboardingEndToEndTest />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendor-dashboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Enhanced Vendor Dashboard Tests
                  </CardTitle>
                  <CardDescription>
                    Comprehensive testing of the enhanced vendor dashboard features including overview, job management, analytics, and profile management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VendorDashboardTestRunner />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="owner-dashboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Layout className="h-5 w-5" />
                    <span>Enhanced Owner Dashboard Testing</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive testing suite for the Enhanced Owner Dashboard with advanced property management features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedOwnerDashboardTest />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tenant-dashboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Enhanced Tenant Dashboard Testing</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive testing of the enhanced tenant dashboard features including overview, payment management, maintenance support, and document management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedTenantDashboardTest />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment-functionality">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Functionality Testing</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive testing of the enhanced payment processing system with multiple payment methods including Paystack, Flutterwave, bank transfers, and USSD codes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentFunctionalityTest />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agent-dashboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Enhanced Agent Dashboard Tests
                  </CardTitle>
                  <CardDescription>
                    Comprehensive testing of the enhanced agent dashboard features including lead management, performance analytics, commission tracking, and client relationship management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedAgentDashboardTest />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="owner-dashboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Enhanced Owner Dashboard Tests
                  </CardTitle>
                  <CardDescription>
                    Comprehensive testing of the enhanced owner dashboard features including property portfolio management, financial analytics, tenant relationship management, and business intelligence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedOwnerDashboardTest />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-matching">
              <AIMatchingDemo />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentProcessingTests />
            </TabsContent>

            <TabsContent value="subscription-system">
              <SubscriptionTests />
            </TabsContent>

            <TabsContent value="voice-assistant">
              <VoiceAssistantTests />
            </TabsContent>

            <TabsContent value="nigerian-apis">
              <NigerianApiTests />
            </TabsContent>

            <TabsContent value="blockchain">
              <BlockchainTests />
            </TabsContent>

            <TabsContent value="analytics">
              <BlockchainAnalyticsTests />
            </TabsContent>

            <TabsContent value="vr-tours">
              <VRTourTests />
            </TabsContent>

            <TabsContent value="maintenance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-orange-600" />
                    Predictive Maintenance Testing
                  </CardTitle>
                  <CardDescription>
                    Test the predictive maintenance system components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4" />
                    <p>Predictive maintenance testing is integrated into the comprehensive test suite.</p>
                    <p className="text-sm mt-2">Switch to the "Comprehensive Tests" tab to run all tests.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voice-assistant">
              <VoiceAssistantTests />
            </TabsContent>

            <TabsContent value="nigerian-apis">
              <NigerianApiTests />
            </TabsContent>

            <TabsContent value="blockchain">
              <BlockchainTests />
            </TabsContent>

            <TabsContent value="analytics">
              <BlockchainAnalyticsTests />
            </TabsContent>

            <TabsContent value="vr-tours">
              <VRTourTests />
            </TabsContent>

            <TabsContent value="database-cleanup">
              <DatabaseCleanupTests />
            </TabsContent>

<TabsContent value="security-test">
  <AgentPropertyVisibilityTest />
</TabsContent>

<TabsContent value="workflow-results">
  <WorkflowAssessmentResults />
</TabsContent>

<TabsContent value="agent-onboarding-test">
  <div className="space-y-6">
    <AgentOnboardingWorkflowTest />
    <AgentOnboardingManualTest />
  </div>
</TabsContent>

<TabsContent value="comprehensive-agent-test">
  <ComprehensiveAgentWorkflowTest />
</TabsContent>
            <TabsContent value="workflow-assessment">
              <WorkflowAssessment />
            </TabsContent>

            <TabsContent value="security-test">
              <AgentPropertyVisibilityTest />
            </TabsContent>

            <TabsContent value="workflow-results">
              <WorkflowAssessmentResults />
            </TabsContent>

            <TabsContent value="agent-onboarding-test">
              <div className="space-y-6">
                <AgentOnboardingWorkflowTest />
                <AgentOnboardingManualTest />
              </div>
            </TabsContent>

            <TabsContent value="comprehensive-agent-test">
              <ComprehensiveAgentWorkflowTest />
            </TabsContent>

            <TabsContent value="vendor-end-to-end">
              <VendorOnboardingEndToEndTest />
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default TestingPage;
