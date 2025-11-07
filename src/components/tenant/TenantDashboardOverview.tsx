import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  Wrench,
  TrendingUp,
  Star,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';

// Nigerian currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface TenantDashboardOverviewProps {
  onMakePayment: () => void;
  onSubmitMaintenance: () => void;
  onViewDocuments: () => void;
}

export function TenantDashboardOverview({ 
  onMakePayment, 
  onSubmitMaintenance, 
  onViewDocuments 
}: TenantDashboardOverviewProps) {
  const { 
    profile, 
    lease, 
    payments, 
    maintenanceRequests, 
    stats, 
    analytics, 
    loading, 
    error 
  } = useEnhancedTenantData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading tenant data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile || !lease || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No tenant data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextPaymentDate = new Date(stats.nextPaymentDue);
  const daysUntilPayment = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPaymentDueSoon = daysUntilPayment <= 5;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {profile.first_name}!
              </h2>
              <p className="text-gray-600 mb-4">
                Here's your property and payment overview
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Home className="h-4 w-4" />
                  <span>{lease.property_title}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{lease.property_address}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={lease.lease_status === 'active' ? 'default' : 'secondary'}>
                {lease.lease_status.replace('_', ' ').toUpperCase()}
              </Badge>
              <p className="text-sm text-gray-500 mt-2">
                Lease expires: {new Date(lease.end_date).toLocaleDateString('en-NG')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={isPaymentDueSoon ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.nextPaymentAmount)}
                </p>
                <p className={`text-sm ${isPaymentDueSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                  Due in {daysUntilPayment} days
                </p>
              </div>
              <div className={`p-3 rounded-full ${isPaymentDueSoon ? 'bg-orange-100' : 'bg-blue-100'}`}>
                <CreditCard className={`h-6 w-6 ${isPaymentDueSoon ? 'text-orange-600' : 'text-blue-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.onTimePaymentRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {stats.onTimePayments}/{stats.totalPayments} on time
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lease Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.daysUntilLeaseExpiry}
                </p>
                <p className="text-sm text-gray-500">days left</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.tenantSatisfactionScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">out of 5.0</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Common tasks and important actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={onMakePayment}
              className="h-auto p-4 flex flex-col items-center space-y-2"
              variant={isPaymentDueSoon ? "default" : "outline"}
            >
              <CreditCard className="h-6 w-6" />
              <span className="font-medium">Make Payment</span>
              <span className="text-xs opacity-75">Pay rent online</span>
            </Button>
            
            <Button 
              onClick={onSubmitMaintenance}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Wrench className="h-6 w-6" />
              <span className="font-medium">Request Maintenance</span>
              <span className="text-xs opacity-75">Report issues</span>
            </Button>
            
            <Button 
              onClick={onViewDocuments}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <FileText className="h-6 w-6" />
              <span className="font-medium">View Documents</span>
              <span className="text-xs opacity-75">Lease & receipts</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary & Maintenance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Payment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Paid (YTD)</span>
              <span className="font-medium">{formatCurrency(stats.totalAmountPaid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Late Fees Paid</span>
              <span className="font-medium text-red-600">{formatCurrency(stats.totalLateFees)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Outstanding Balance</span>
              <span className="font-medium">{formatCurrency(stats.outstandingBalance)}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Payment Consistency</span>
                <span>{stats.onTimePaymentRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.onTimePaymentRate} className="h-2" />
            </div>
            
            {/* Recent Payments */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Payments</h4>
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant={payment.payment_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {payment.payment_status}
                    </Badge>
                    <span>{new Date(payment.payment_date).toLocaleDateString('en-NG')}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>Maintenance Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.maintenanceRequestsSubmitted}
                </div>
                <p className="text-xs text-gray-600">Total Requests</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.maintenanceRequestsCompleted}
                </div>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg Response Time</span>
                <span>{stats.averageMaintenanceResponseTime} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Satisfaction Score</span>
                <span>{stats.tenantSatisfactionScore.toFixed(1)}/5.0</span>
              </div>
            </div>
            
            <Separator />
            
            {/* Recent Maintenance Requests */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Requests</h4>
              {maintenanceRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        request.status === 'completed' ? 'default' :
                        request.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {request.status.replace('_', ' ')}
                    </Badge>
                    <span className="truncate max-w-32">{request.title}</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(request.submitted_date).toLocaleDateString('en-NG')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property & Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Property Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Property Type</span>
                <span className="font-medium capitalize">{lease.property_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Rent</span>
                <span className="font-medium">{formatCurrency(lease.monthly_rent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Security Deposit</span>
                <span className="font-medium">{formatCurrency(lease.security_deposit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lease Period</span>
                <span className="font-medium">
                  {new Date(lease.start_date).toLocaleDateString('en-NG')} - {new Date(lease.end_date).toLocaleDateString('en-NG')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Auto Renewal</span>
                <Badge variant={lease.auto_renewal ? 'default' : 'secondary'}>
                  {lease.auto_renewal ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            
            {lease.special_terms && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Special Terms:</strong> {lease.special_terms}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
              {profile.emergency_contact_name && (
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Emergency Contact</p>
                    <p className="font-medium">{profile.emergency_contact_name}</p>
                    <p className="text-sm text-gray-500">{profile.emergency_contact_phone}</p>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Tenant Since</h4>
              <p className="text-sm text-gray-600">
                {new Date(profile.move_in_date || profile.created_at).toLocaleDateString('en-NG')} 
                <span className="ml-2">({stats.monthsAsResident} months)</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
