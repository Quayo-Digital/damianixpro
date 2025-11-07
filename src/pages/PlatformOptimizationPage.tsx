import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import PlatformOptimizationAssessment from '@/components/testing/PlatformOptimizationAssessment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Zap, Shield, Smartphone, Activity } from 'lucide-react';

const PlatformOptimizationPage: React.FC = () => {
  return (
    <PageLayout>
      <PageContent 
        title="Platform Optimization & Polish" 
        description="Comprehensive platform assessment, performance monitoring, and optimization tools"
      >
        <div className="space-y-6">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              This comprehensive optimization suite analyzes your platform across 8 key areas: Performance, Security, Mobile Responsiveness, 
              User Experience, Database Optimization, SEO, Accessibility, and Documentation. Use these tools to achieve production-ready quality.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Load times, bundle size, memory usage, and rendering performance assessment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  Security Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Authentication, authorization, data protection, and vulnerability scanning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4 text-purple-500" />
                  Mobile Responsiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Cross-device compatibility and mobile user experience optimization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-orange-500" />
                  Real-Time Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Live performance metrics tracking and system health monitoring
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Platform Optimization Suite
              </CardTitle>
              <CardDescription>
                Comprehensive platform assessment and optimization tools for production-ready quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlatformOptimizationAssessment />
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default PlatformOptimizationPage;
