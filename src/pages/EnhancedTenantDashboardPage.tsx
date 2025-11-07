import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
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
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';
import { TenantDashboardOverview } from '@/components/tenant/TenantDashboardOverview';
import { TenantPaymentManagement } from '@/components/tenant/TenantPaymentManagement';
import { TenantMaintenanceSupport } from '@/components/tenant/TenantMaintenanceSupport';

// Nigerian currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const EnhancedTenantDashboardPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    profile, 
    lease, 
    stats, 
    notifications, 
    loading, 
    error 
  } = useEnhancedTenantData();

  // Check if user is a tenant
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
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Error loading tenant dashboard: {error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const nextPaymentDate = stats ? new Date(stats.nextPaymentDue) : new Date();
  const daysUntilPayment = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPaymentDueSoon = daysUntilPayment <= 5;

  const unreadNotifications = notifications?.filter(n => !n.read_status).length || 0;
  const urgentNotifications = notifications?.filter(n => n.priority === 'high' && !n.read_status).length || 0;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Enhanced Tenant Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your tenancy, payments, and property services
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {unreadNotifications > 0 && (
                <div className="relative">
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Tenant Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lease?.lease_status === 'active' ? 'Active Tenant' : 'Tenant'}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Alerts */}
          {(isPaymentDueSoon || urgentNotifications > 0) && (
            <div className="space-y-3">
              {isPaymentDueSoon && stats && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <CreditCard className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-orange-900">
                            Payment Due Soon
                          </p>
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
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-900">
                          {urgentNotifications} Urgent Notification{urgentNotifications > 1 ? 's' : ''}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Next Payment</p>
                      <p className="text-lg font-bold text-blue-900">
                        {daysUntilPayment} days
                      </p>
                    </div>
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
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

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
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

              <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
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
                  <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                    <TabsTrigger 
                      value="overview" 
                      className="flex items-center space-x-2 py-3"
                    >
                      <Home className="h-4 w-4" />
                      <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="payments" 
                      className="flex items-center space-x-2 py-3"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Payments</span>
                      {isPaymentDueSoon && (
                        <Badge className="ml-1 h-2 w-2 p-0 bg-orange-500"></Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="maintenance" 
                      className="flex items-center space-x-2 py-3"
                    >
                      <Wrench className="h-4 w-4" />
                      <span>Maintenance</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documents" 
                      className="flex items-center space-x-2 py-3"
                    >
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

                <TabsContent value="payments" className="p-6">
                  <TenantPaymentManagement />
                </TabsContent>

                <TabsContent value="maintenance" className="p-6">
                  <TenantMaintenanceSupport />
                </TabsContent>

                <TabsContent value="documents" className="p-6">
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Document Management
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Access your lease documents, receipts, and important notices
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <h4 className="font-medium">Lease Agreement</h4>
                            <p className="text-sm text-gray-500">View your current lease</p>
                          </div>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="text-center">
                            <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <h4 className="font-medium">Payment Receipts</h4>
                            <p className="text-sm text-gray-500">Download receipts</p>
                          </div>
                        </Card>
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="text-center">
                            <Bell className="h-8 w-8 text-orange-600 mx-auto mb-2" />
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
          <div className="text-center text-sm text-gray-500">
            <p>
              Need help? Contact property management at{' '}
              <a href="mailto:support@nigeriahomes.com" className="text-blue-600 hover:underline">
                support@nigeriahomes.com
              </a>{' '}
              or{' '}
              <a href="tel:+234-800-HOMES" className="text-blue-600 hover:underline">
                +234-800-HOMES
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default EnhancedTenantDashboardPage;
