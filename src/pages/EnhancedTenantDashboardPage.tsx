import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  BarChart3,
  Bell,
  User,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Receipt,
  ClipboardList,
} from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { useSearchShortletListings } from '@/hooks/useShortletListings';
import { TenantDashboardOverview } from '@/components/tenant/TenantDashboardOverview';
import { TenantPaymentManagement } from '@/components/tenant/TenantPaymentManagement';
import { TenantMaintenanceSupport } from '@/components/tenant/TenantMaintenanceSupport';
import { PropertyGrid } from '@/components/properties/PropertyGrid';
import { ShortletListingCard } from '@/components/shortlet/ShortletListingCard';
import { annualRentNgn } from '@/utils/nigeriaRent';
import { formatTenantLeaseStatusLabel } from '@/services/leases/tenantLeasePresentation';
import { RoleScreeningBanner } from '@/components/screening/RoleScreeningBanner';
import { TenantApplicationNextStepStrip } from '@/components/tenant/TenantApplicationNextStepStrip';
import { RoleDashboardInsights } from '@/components/dashboard/role-dashboard/RoleDashboardInsights';
import type {
  RoleDashboardActivity,
  RoleDashboardQuickAction,
  RoleDashboardStat,
} from '@/components/dashboard/role-dashboard/types';
import { formatDistanceToNow } from 'date-fns';

// Nigerian currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const TENANT_DASH_TABS = [
  'overview',
  'properties',
  'payments',
  'maintenance',
  'documents',
] as const;

const EnhancedTenantDashboardPage = () => {
  const { user, userRole } = useAuthSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (TENANT_DASH_TABS as readonly string[]).includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { profile, lease, stats, notifications, payments, maintenanceRequests, loading, error } =
    useEnhancedTenantData();
  // Use public properties hook for tenants to see available properties
  const {
    filteredProperties: availableProperties,
    loading: propertiesLoading,
    preferences,
    preferencesLoading,
  } = usePublicProperties();
  const { data: shortletListingsData, isLoading: shortletsLoading } = useSearchShortletListings({
    page: 1,
    page_size: 12,
  });
  const shortletListings = shortletListingsData?.listings || [];

  const tenantPulse = useMemo(() => {
    const nextDue = stats?.nextPaymentDue
      ? formatDistanceToNow(new Date(stats.nextPaymentDue), { addSuffix: true })
      : '—';
    const statsRow: RoleDashboardStat[] = [
      {
        title: 'Next rent',
        value: stats?.nextPaymentAmount ? formatCurrency(stats.nextPaymentAmount) : '—',
        icon: <CreditCard className="h-4 w-4" />,
        description: stats?.nextPaymentDue ? `Due ${nextDue}` : 'No upcoming charge on file',
      },
      {
        title: 'Payments recorded',
        value: String(stats?.totalPayments ?? 0),
        icon: <Receipt className="h-4 w-4" />,
        description: 'Completed rent-related payments',
      },
      {
        title: 'Outstanding balance',
        value: stats?.outstandingBalance != null ? formatCurrency(stats.outstandingBalance) : '—',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'Per ledger / lease summary',
      },
      {
        title: 'Maintenance requests',
        value: String(stats?.maintenanceRequestsSubmitted ?? 0),
        icon: <Wrench className="h-4 w-4" />,
        description: `${stats?.maintenanceRequestsCompleted ?? 0} completed`,
      },
    ];

    const quickActions: RoleDashboardQuickAction[] = [
      { label: 'Pay rent & history', to: '/tenant/dashboard?tab=payments', icon: CreditCard },
      { label: 'Maintenance & requests', to: '/tenant/dashboard?tab=maintenance', icon: Wrench },
      { label: 'Service tickets', to: '/tenant/maintenance-tickets', icon: ClipboardList },
      { label: 'Documents', to: '/tenant/dashboard?tab=documents', icon: FileText },
    ];

    const payActs: RoleDashboardActivity[] = [...(payments || [])]
      .filter((p) => p.payment_status === 'completed')
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, 4)
      .map((p) => ({
        id: `p-${p.id}`,
        title: `Payment · ${formatCurrency(p.amount)}`,
        meta: p.description || p.payment_type,
        time: p.payment_date
          ? formatDistanceToNow(new Date(p.payment_date), { addSuffix: true })
          : undefined,
        icon: '✅',
      }));

    const maintActs: RoleDashboardActivity[] = [...(maintenanceRequests || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4)
      .map((m) => ({
        id: `m-${m.id}`,
        title: m.title || 'Maintenance request',
        meta: [m.status, m.category].filter(Boolean).join(' · '),
        time: m.created_at
          ? formatDistanceToNow(new Date(m.created_at), { addSuffix: true })
          : undefined,
        icon: '🔧',
      }));

    const activities = [...payActs, ...maintActs].slice(0, 8);

    return { statsRow, quickActions, activities };
  }, [stats, payments, maintenanceRequests]);

  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleMakePayment = () => {
    setActiveTab('payments');
  };

  const handleSubmitMaintenance = () => {
    setActiveTab('maintenance');
  };

  const handleViewDocuments = () => {
    setActiveTab('documents');
  };

  if (loading) {
    return (
      <PageLayout>
        <PageContent
          title="Tenant dashboard"
          description="Loading your workspace…"
          showBreadcrumbs={false}
        >
          <div className="animate-pulse space-y-6">
            <div className="mb-4 h-8 w-1/3 max-w-xs rounded bg-muted" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                    <div className="h-8 w-1/2 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageContent
          title="Tenant dashboard"
          description="We could not load this view."
          showBreadcrumbs={false}
        >
          <Card className="border-destructive/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>Error loading tenant dashboard: {error}</span>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    );
  }

  // Calculate next payment date and days until payment
  const nextPaymentDate = stats?.nextPaymentDue ? new Date(stats.nextPaymentDue) : null;
  const daysUntilPayment = nextPaymentDate
    ? Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isPaymentDueSoon =
    daysUntilPayment !== null && daysUntilPayment <= 5 && daysUntilPayment >= 0;
  const hasValidPaymentDue =
    nextPaymentDate && stats?.nextPaymentAmount && stats.nextPaymentAmount > 0;

  const unreadNotifications = notifications?.filter((n) => !n.read_status).length || 0;
  const urgentNotifications =
    notifications?.filter((n) => n.priority === 'high' && !n.read_status).length || 0;

  return (
    <PageLayout>
      <PageContent
        title="Tenant dashboard"
        description="Manage your tenancy, payments, and property services."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            {unreadNotifications > 0 && (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`${unreadNotifications} unread notifications`}
                >
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                    {unreadNotifications}
                  </Badge>
                </Button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading…'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lease?.lease_status === 'active' ? 'Active tenant' : 'Tenant'}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <RoleScreeningBanner />
          <TenantApplicationNextStepStrip />

          <RoleDashboardInsights
            sectionTitle="Tenancy pulse"
            stats={tenantPulse.statsRow}
            quickActions={tenantPulse.quickActions}
            activities={tenantPulse.activities}
            activityTitle="Rent & maintenance activity"
            activityEmptyMessage="No recent payments or maintenance updates."
          />

          {/* Urgent Alerts */}
          {(isPaymentDueSoon || urgentNotifications > 0) && (
            <div className="space-y-3">
              {isPaymentDueSoon && stats && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-full bg-orange-100 p-2">
                          <CreditCard className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-orange-900">Payment Due Soon</p>
                          <p className="text-sm text-orange-700">
                            {formatCurrency(stats.nextPaymentAmount)} due in {daysUntilPayment} days
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleMakePayment}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Pay Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {urgentNotifications > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-red-100 p-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-900">
                          {urgentNotifications} Urgent Notification
                          {urgentNotifications > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-red-700">
                          Please check your notifications for important updates
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Next Payment</p>
                      <p className="text-lg font-bold text-blue-900">
                        {daysUntilPayment !== null
                          ? `${daysUntilPayment >= 0 ? daysUntilPayment : 'Overdue'} ${Math.abs(daysUntilPayment) === 1 ? 'day' : 'days'}`
                          : 'N/A'}
                      </p>
                    </div>
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Payment Score</p>
                      <p className="text-lg font-bold text-green-900">
                        {stats.onTimePaymentRate.toFixed(1)}%
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Lease Days Left</p>
                      <p className="text-lg font-bold text-purple-900">
                        {stats.daysUntilLeaseExpiry}
                      </p>
                    </div>
                    <Home className="h-6 w-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Satisfaction</p>
                      <p className="text-lg font-bold text-yellow-900">
                        {stats.tenantSatisfactionScore.toFixed(1)}/5
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Dashboard Content */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b">
                  <TabsList className="grid h-auto w-full grid-cols-5 p-1">
                    <TabsTrigger value="overview" className="flex items-center space-x-2 py-3">
                      <Home className="h-4 w-4" />
                      <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="properties" className="flex items-center space-x-2 py-3">
                      <Home className="h-4 w-4" />
                      <span>Properties</span>
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex items-center space-x-2 py-3">
                      <CreditCard className="h-4 w-4" />
                      <span>Payments</span>
                      {isPaymentDueSoon && (
                        <Badge className="ml-1 h-2 w-2 bg-orange-500 p-0"></Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="maintenance" className="flex items-center space-x-2 py-3">
                      <Wrench className="h-4 w-4" />
                      <span>Maintenance</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center space-x-2 py-3">
                      <FileText className="h-4 w-4" />
                      <span>Documents</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="p-6">
                  <TenantDashboardOverview
                    onMakePayment={handleMakePayment}
                    onSubmitMaintenance={handleSubmitMaintenance}
                    onViewDocuments={handleViewDocuments}
                  />
                </TabsContent>

                <TabsContent value="properties" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="mb-4 text-2xl font-bold text-gray-900">Properties</h2>
                      <p className="text-gray-600">
                        View your current property, browse longterm rentals, or explore shortlet
                        options
                      </p>
                    </div>

                    {/* Current Property */}
                    {lease && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Home className="h-5 w-5" />
                            <span>Your Current Property</span>
                          </CardTitle>
                          <CardDescription>
                            {lease.property_title || 'Property Information'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Property Address</p>
                              <p className="text-gray-900">{lease.property_address || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Lease Status</p>
                                <Badge
                                  variant={
                                    lease.lease_status === 'active' ? 'default' : 'secondary'
                                  }
                                >
                                  {formatTenantLeaseStatusLabel(lease.lease_status)}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Annual Rent</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {annualRentNgn(lease) > 0
                                    ? formatCurrency(annualRentNgn(lease))
                                    : '—'}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Lease Start</p>
                                <p className="text-gray-900">
                                  {new Date(lease.start_date).toLocaleDateString('en-NG')}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Lease End</p>
                                <p className="text-gray-900">
                                  {new Date(lease.end_date).toLocaleDateString('en-NG')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Browse Properties */}
                    <div className="space-y-6">
                      {/* Longterm Properties Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Available Longterm Properties</h3>
                          <Button variant="outline" onClick={() => navigate('/public/properties')}>
                            View All Properties
                          </Button>
                        </div>

                        {propertiesLoading ? (
                          <div className="py-8 text-center">
                            <p className="text-gray-500">Loading properties...</p>
                          </div>
                        ) : availableProperties.length > 0 ? (
                          <PropertyGrid
                            properties={availableProperties.slice(0, 6)}
                            preferences={preferences}
                            showMatchScore={!preferencesLoading && !!preferences}
                          />
                        ) : (
                          <Card>
                            <CardContent className="py-12 text-center">
                              <Home className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                              <h3 className="mb-2 text-lg font-medium text-gray-900">
                                No properties available
                              </h3>
                              <p className="mb-4 text-gray-600">
                                There are currently no available properties for rent.
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => navigate('/public/properties')}
                              >
                                Browse All Properties
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      <Separator />

                      {/* Shortlets Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Available Shortlet Listings</h3>
                          <Button variant="outline" onClick={() => navigate('/shortlets')}>
                            View All Shortlets
                          </Button>
                        </div>
                        {shortletsLoading ? (
                          <div className="py-8 text-center">
                            <p className="text-gray-500">Loading shortlets...</p>
                          </div>
                        ) : shortletListings.length > 0 ? (
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {shortletListings.slice(0, 6).map((listing) => (
                              <ShortletListingCard
                                key={listing.id}
                                listing={listing}
                                onClick={() => navigate(`/shortlets/${listing.id}`)}
                              />
                            ))}
                          </div>
                        ) : (
                          <Card>
                            <CardContent className="py-12 text-center">
                              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                              <h3 className="mb-2 text-lg font-medium text-gray-900">
                                No shortlets available
                              </h3>
                              <p className="mb-4 text-gray-600">
                                There are currently no available shortlet listings.
                              </p>
                              <Button variant="outline" onClick={() => navigate('/shortlets')}>
                                Browse All Shortlets
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="p-6">
                  <TenantPaymentManagement />
                </TabsContent>

                <TabsContent value="maintenance" className="p-6">
                  <TenantMaintenanceSupport />
                </TabsContent>

                <TabsContent value="documents" className="p-6">
                  <div className="space-y-6">
                    <div className="py-12 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        Document Management
                      </h3>
                      <p className="mb-4 text-gray-600">
                        Access your lease documents, receipts, and important notices
                      </p>
                      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                        <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
                          <div className="text-center">
                            <FileText className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                            <h4 className="font-medium">Lease Agreement</h4>
                            <p className="text-sm text-gray-500">View your current lease</p>
                          </div>
                        </Card>
                        <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
                          <div className="text-center">
                            <CreditCard className="mx-auto mb-2 h-8 w-8 text-green-600" />
                            <h4 className="font-medium">Payment Receipts</h4>
                            <p className="text-sm text-gray-500">Download receipts</p>
                          </div>
                        </Card>
                        <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
                          <div className="text-center">
                            <Bell className="mx-auto mb-2 h-8 w-8 text-orange-600" />
                            <h4 className="font-medium">Notices</h4>
                            <p className="text-sm text-gray-500">Important updates</p>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact property management at{' '}
              <a href="mailto:support@nigeriahomes.com" className="text-primary hover:underline">
                support@nigeriahomes.com
              </a>{' '}
              or{' '}
              <a href="tel:+234-800-HOMES" className="text-primary hover:underline">
                +234-800-HOMES
              </a>
            </p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default EnhancedTenantDashboardPage;
