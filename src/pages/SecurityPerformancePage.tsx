import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { SecurityPerformanceDashboard } from '@/components/testing/SecurityPerformanceDashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Zap, AlertTriangle } from 'lucide-react';

const SecurityPerformancePage: React.FC = () => {
  return (
    <PageLayout>
      <PageContent 
        title="Security & Performance Monitoring" 
        description="Comprehensive security audit and performance monitoring for Nigeria Homes platform"
      >
        <div className="space-y-6">
          {/* Introduction Alert */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Enterprise-Grade Security & Performance Monitoring</AlertTitle>
            <AlertDescription>
              This comprehensive monitoring system provides real-time security auditing and performance 
              optimization specifically designed for the Nigerian market. It includes network-aware 
              optimizations for 2G/3G connections and security configurations for Nigerian payment gateways.
            </AlertDescription>
          </Alert>

          {/* Key Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Features</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Real-time security event monitoring</li>
                  <li>• Comprehensive security audit (12 test categories)</li>
                  <li>• Nigerian payment gateway security (Paystack, Flutterwave)</li>
                  <li>• Input validation for Nigerian data formats</li>
                  <li>• Database RLS policy verification</li>
                  <li>• XSS, CSRF, and SQL injection protection</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Performance Features</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Core Web Vitals monitoring (FCP, LCP, CLS, FID)</li>
                  <li>• Nigerian network condition optimization</li>
                  <li>• 2G/3G network-aware performance thresholds</li>
                  <li>• Real-time device capability detection</li>
                  <li>• API response time monitoring</li>
                  <li>• Bundle size and memory usage tracking</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          {/* Usage Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>How to Use This Monitoring System</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2 text-sm">
                <p><strong>1. Overview Tab:</strong> Get a quick health summary of security and performance metrics</p>
                <p><strong>2. Security Tab:</strong> Run comprehensive security audits and view detailed test results</p>
                <p><strong>3. Performance Tab:</strong> Monitor Core Web Vitals and network-specific performance metrics</p>
                <p><strong>4. Events Tab:</strong> View detailed security event logs with severity tracking</p>
                <p><strong>5. Tools Tab:</strong> Access utility functions for testing and optimization</p>
                <p className="mt-3 font-medium">💡 Click "Run Full Audit" to perform a comprehensive security and performance assessment.</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Main Dashboard */}
          <SecurityPerformanceDashboard />
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default SecurityPerformancePage;
