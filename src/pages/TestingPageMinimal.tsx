// Minimal Testing Page for Agent Onboarding Workflow Testing
// Bypasses the persistent "Info is not defined" error

import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { AgentOnboardingWorkflowTest } from '@/components/testing/AgentOnboardingWorkflowTest';
import { AgentOnboardingManualTest } from '@/components/testing/AgentOnboardingManualTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Users, AlertTriangle } from 'lucide-react';

const TestingPageMinimal: React.FC = () => {
  return (
    <PageLayout>
      <PageContent
        title="Agent Onboarding Testing"
        description="Test and verify the Agent Onboarding workflow"
      >
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is a minimal testing page focused on Agent Onboarding workflow verification.
              Test the agent-specific onboarding form and workflow integration.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="agent-onboarding" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agent-onboarding" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Agent Onboarding Test</span>
              </TabsTrigger>
              <TabsTrigger value="comprehensive" className="flex items-center space-x-2">
                <TestTube className="h-4 w-4" />
                <span>Manual Testing Guide</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agent-onboarding">
              <div className="space-y-6">
                <AgentOnboardingWorkflowTest />
              </div>
            </TabsContent>

            <TabsContent value="comprehensive">
              <div className="space-y-6">
                <AgentOnboardingManualTest />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default TestingPageMinimal;
