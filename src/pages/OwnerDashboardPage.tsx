import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAuthSession } from '@/contexts/auth';
import { Navigate } from 'react-router-dom';
import { StatCard } from '@/components/dashboard/StatCard';
import { PaymentChart } from '@/components/dashboard/PaymentChart';
import { MaintenanceStatus } from '@/components/dashboard/MaintenanceStatus';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PropertyList } from '@/components/dashboard/PropertyList';
import { Home, Users, Wallet, Settings, Clock } from 'lucide-react';
import { useOwnerDashboardData } from '@/hooks/useOwnerDashboardData';
import { useProperties } from '@/hooks/useProperties';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SmartRecommendations } from '@/components/ai/SmartRecommendations';
import { PredictiveMaintenanceDashboard } from '@/components/maintenance/PredictiveMaintenanceDashboard';
import { useMaintenanceAlerts } from '@/hooks/usePredictiveMaintenance';
import { DocumentProcessingDashboard } from '@/components/documents/DocumentProcessingDashboard';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { VoiceAssistantWidget } from '@/components/voice/VoiceAssistantWidget';
import { DamianixProAssistantChat } from '@/components/assistant/DamianixProAssistantChat';
import { KYCVerificationDashboard } from '@/components/kyc/KYCVerificationDashboard';
import { BlockchainDashboard } from '@/components/blockchain/BlockchainDashboard';
import { BlockchainAnalyticsDashboard } from '@/components/blockchain/BlockchainAnalyticsDashboard';
import { VRTourManager } from '@/components/vr/VRTourManager';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileText, Upload } from 'lucide-react';

const OwnerDashboardPage = () => {
  const { user, userRole } = useAuthSession();
  const queryClient = useQueryClient();
  const { data: dashboardData, isLoading: isLoadingDashboardData } = useOwnerDashboardData();
  const { criticalAlerts, criticalCount } = useMaintenanceAlerts();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { documents, getPendingDocuments, getHighRiskDocuments } = useDocumentProcessing({
    userId: user?.id,
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`owner-dashboard-updates-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rental_applications' }, () =>
        queryClient.invalidateQueries({ queryKey: ['ownerDashboardData', user.id] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, () =>
        queryClient.invalidateQueries({ queryKey: ['ownerDashboardData', user.id] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rent_payments' }, () =>
        queryClient.invalidateQueries({ queryKey: ['ownerDashboardData', user.id] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
        queryClient.invalidateQueries({ queryKey: ['ownerDashboardData', user.id] });
        queryClient.invalidateQueries({ queryKey: ['properties', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'property_tenants' }, () =>
        queryClient.invalidateQueries({ queryKey: ['ownerDashboardData', user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  // Check if user is an owner
  if (!user || userRole !== 'owner') {
    return <Navigate to="/unauthorized" replace />;
  }

  const statCards = [
    {
      title: 'Total Properties',
      value: isLoadingDashboardData ? '...' : (dashboardData?.totalProperties ?? 0).toString(),
      icon: <Home className="h-4 w-4" />,
      description: 'Your real estate assets',
    },
    {
      title: 'Total Tenants',
      value: isLoadingDashboardData ? '...' : (dashboardData?.totalTenants ?? 0).toString(),
      icon: <Users className="h-4 w-4" />,
      trend: { value: 12, isPositive: true },
      description: 'Active lease agreements',
    },
    {
      title: 'Monthly Revenue',
      value: isLoadingDashboardData
        ? '...'
        : `₦${((dashboardData?.totalRevenue ?? 0) / 1000000).toFixed(2)}M`,
      icon: <Wallet className="h-4 w-4" />,
      trend: { value: 8, isPositive: true },
      description: 'From rent payments',
    },
    {
      title: 'Pending Maintenance',
      value: isLoadingDashboardData ? '...' : (dashboardData?.pendingMaintenance ?? 0).toString(),
      icon: <Settings className="h-4 w-4" />,
      trend: { value: 3, isPositive: false },
      description: 'Requests awaiting action',
    },
    {
      title: 'Pending Applications',
      value: isLoadingDashboardData ? '...' : (dashboardData?.pendingApplications ?? 0).toString(),
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      description: 'Ready for your review',
    },
  ];

  return (
    <PageLayout>
      <PageContent
        title="Owner Dashboard"
        description="Track your properties, tenants, revenue, and maintenance requests"
      >
        <div className="space-y-5 sm:space-y-6">
          {isMobile ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 pb-4">
                {statCards.map((card, index) => (
                  <div key={index} className="w-[280px]">
                    <StatCard
                      title={card.title}
                      value={card.value}
                      icon={card.icon}
                      trend={card.trend}
                      description={card.description}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card, index) => (
                <StatCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  trend={card.trend}
                  description={card.description}
                />
              ))}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <PaymentChart />
            <MaintenanceStatus />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="md:col-span-2">
              <PropertyList properties={properties || []} isLoading={isLoadingProperties} />
            </div>
            <div className="space-y-4">
              <RecentActivity />

              {/* Voice Assistant Widget */}
              <VoiceAssistantWidget
                className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50"
                compact={false}
                showHistory={false}
              />

              <DamianixProAssistantChat compact className="border-violet-200" />

              {/* KYC Verification Dashboard */}
              <KYCVerificationDashboard
                className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50"
                compact={true}
              />

              {/* Blockchain Dashboard */}
              <BlockchainDashboard
                className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50"
                compact={true}
              />

              {/* Blockchain Analytics Dashboard */}
              <BlockchainAnalyticsDashboard
                className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50"
                compact={true}
                userId={user?.id}
              />

              {/* VR/AR Tour Management */}
              <VRTourManager
                className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
                onTourCreated={(tour) => {
                  console.log('New VR tour created:', tour);
                }}
                onTourUpdated={(tour) => {
                  console.log('VR tour updated:', tour);
                }}
                onTourDeleted={(tourId) => {
                  console.log('VR tour deleted:', tourId);
                }}
              />

              {/* AI Smart Recommendations for Property Owners */}
              <SmartRecommendations
                limit={2}
                showHeader={true}
                className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
              />
              {/* Document Processing Alerts */}
              {(() => {
                const pendingDocs = getPendingDocuments();
                const highRiskDocs = getHighRiskDocuments();
                const totalAlerts = pendingDocs.length + highRiskDocs.length;

                return (
                  totalAlerts > 0 && (
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-lg text-blue-800">
                          <FileText className="mr-2 h-5 w-5" />
                          Document Processing Alerts
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                          {totalAlerts} documents require attention
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {pendingDocs.slice(0, 2).map((doc) => (
                          <div
                            key={doc.id}
                            className="rounded-lg border border-blue-200 bg-card/90 p-3 text-card-foreground dark:border-blue-800/50 dark:bg-blue-950/25"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  {doc.original_filename}
                                </p>
                                <p className="text-xs text-blue-700">
                                  Status: {doc.status.replace('_', ' ').toUpperCase()}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {doc.document_type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {highRiskDocs.slice(0, 1).map((doc) => (
                          <div
                            key={doc.id}
                            className="rounded-lg border border-orange-200 bg-card/90 p-3 text-card-foreground dark:border-orange-800/50 dark:bg-orange-950/25"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-orange-900">
                                  {doc.original_filename}
                                </p>
                                <p className="text-xs text-orange-700">
                                  Low confidence: {Math.round(doc.confidence_score * 100)}%
                                </p>
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                Needs Review
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2">
                          <Link to="/documents">
                            <Button size="sm" className="w-full">
                              <Upload className="mr-2 h-4 w-4" />
                              Manage Documents
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                );
              })()}

              {/* Predictive Maintenance Alerts */}
              {criticalCount > 0 && (
                <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg text-red-800">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Critical Maintenance Alerts
                    </CardTitle>
                    <CardDescription className="text-red-700">
                      {criticalCount} equipment issues require immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {criticalAlerts.slice(0, 2).map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-lg border border-red-200 bg-card/90 p-3 text-card-foreground dark:border-red-800/50 dark:bg-red-950/25"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-900">{alert.title}</p>
                            <p className="text-xs text-red-700">
                              Due in{' '}
                              {Math.ceil(
                                (new Date(alert.predicted_failure_date).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )}{' '}
                              days
                            </p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {Math.round(alert.confidence_score * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Button size="sm" className="mt-2 w-full" asChild>
                      <Link to="/maintenance">View All Alerts</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default OwnerDashboardPage;
