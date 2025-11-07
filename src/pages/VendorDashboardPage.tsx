
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth';
import { useEnhancedVendorData } from '@/hooks/useEnhancedVendorData';
import { VendorDashboardOverview } from '@/components/vendor/VendorDashboardOverview';
import { VendorJobManagement } from '@/components/vendor/VendorJobManagement';
import { VendorPerformanceAnalytics } from '@/components/vendor/VendorPerformanceAnalytics';
import { VendorProfileManagement } from '@/components/vendor/VendorProfileManagement';
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart3, 
  User, 
  AlertCircle,
  Loader2
} from 'lucide-react';

const VendorDashboardPage = () => {
  const { user } = useAuth();
  const {
    profile,
    jobs,
    stats,
    performanceMetrics,
    isLoading,
    error,
    updateJobStatus,
    updateJobCost,
    updateProfile,
    uploadImage
  } = useEnhancedVendorData();

  if (isLoading) {
    return (
      <PageLayout>
        <PageContent title="Vendor Dashboard">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-muted-foreground">Loading your dashboard...</p>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageContent title="Vendor Dashboard">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </PageContent>
      </PageLayout>
    );
  }

  if (!profile || !stats || !performanceMetrics) {
    return (
      <PageLayout>
        <PageContent title="Vendor Dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Setup Required</CardTitle>
              <CardDescription>
                Your vendor profile needs to be completed before you can access the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please contact an administrator to complete your vendor profile setup.
              </p>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent 
        title="Vendor Dashboard" 
        subtitle={`Welcome back, ${profile.name}!`}
      >
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={profile.is_available ? "default" : "secondary"}
              className={profile.is_available ? "bg-green-600" : ""}
            >
              {profile.is_available ? "Available for Jobs" : "Not Available"}
            </Badge>
            <Badge variant="outline">
              {profile.category}
            </Badge>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Jobs ({jobs.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <VendorDashboardOverview
                stats={stats}
                vendorName={profile.name}
                vendorCategory={profile.category}
                isLoading={false}
              />
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <VendorJobManagement
                jobs={jobs}
                onUpdateJobStatus={updateJobStatus}
                onUpdateJobCost={updateJobCost}
                isLoading={false}
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <VendorPerformanceAnalytics
                metrics={performanceMetrics}
                vendorName={profile.name}
                isLoading={false}
              />
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <VendorProfileManagement
                profile={profile}
                onUpdateProfile={updateProfile}
                onUploadImage={uploadImage}
                isLoading={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default VendorDashboardPage;
