import React from 'react';
import { Link } from 'react-router-dom';
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
  MapPin,
  Search,
} from 'lucide-react';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';
import { annualRentNgn } from '@/utils/nigeriaRent';
import { formatTenantLeaseStatusLabel } from '@/services/leases/tenantLeasePresentation';

// Nigerian currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Safe date formatter with fallback
const formatDate = (dateString: string | null | undefined, fallback?: string): string => {
  if (!dateString) {
    return fallback || 'Not available';
  }

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return fallback || 'Invalid date';
  }

  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface TenantDashboardOverviewProps {
  onMakePayment: () => void;
  onSubmitMaintenance: () => void;
  onViewDocuments: () => void;
}

export function TenantDashboardOverview({
  onMakePayment,
  onSubmitMaintenance,
  onViewDocuments,
}: TenantDashboardOverviewProps) {
  const { profile, lease, payments, maintenanceRequests, stats, analytics, loading, error } =
    useEnhancedTenantData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
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

  if (!profile || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center text-gray-500">
              {loading ? 'Loading tenant data...' : 'No tenant data available'}
            </div>
            {!lease && !loading && (
              <div className="text-center text-sm text-gray-400">
                You don't have an active lease yet. Contact your property manager to get started.
              </div>
            )}
            <div className="flex justify-center pt-2">
              <Button asChild>
                <Link to="/public/properties">Browse rentals</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Welcome back, {profile.first_name}!
              </h2>
              <p className="mb-4 text-gray-600">Here's your property and payment overview</p>
              {lease ? (
                <>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Home className="h-4 w-4" />
                      <span>{lease?.property_title || 'Property'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{lease?.property_address || 'Address not available'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  No active lease. Contact your property manager to get started.
                </div>
              )}
            </div>
            {lease && (
              <div className="text-right">
                <Badge variant={lease?.lease_status === 'active' ? 'default' : 'secondary'}>
                  {formatTenantLeaseStatusLabel(lease?.lease_status)}
                </Badge>
                <p className="mt-2 text-sm text-gray-500">
                  Lease expires: {formatDate(lease?.end_date)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Public listings — always same path as marketing / apply flow */}
      <Card className="border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/80">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Search className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Browse rentals</p>
              <p className="text-sm text-gray-600">
                View available long-term listings and apply from each property page.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/public/properties">Browse rentals</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={isPaymentDueSoon ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {hasValidPaymentDue ? formatCurrency(stats.nextPaymentAmount) : 'N/A'}
                </p>
                <p className={`text-sm ${isPaymentDueSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                  {daysUntilPayment !== null
                    ? `${daysUntilPayment >= 0 ? 'Due in' : 'Overdue by'} ${Math.abs(daysUntilPayment)} ${Math.abs(daysUntilPayment) === 1 ? 'day' : 'days'}`
                    : 'No payment scheduled'}
                </p>
              </div>
              <div
                className={`rounded-full p-3 ${isPaymentDueSoon ? 'bg-orange-100' : 'bg-blue-100'}`}
              >
                <CreditCard
                  className={`h-6 w-6 ${isPaymentDueSoon ? 'text-orange-600' : 'text-blue-600'}`}
                />
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
              <div className="rounded-full bg-green-100 p-3">
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
                <p className="text-2xl font-bold text-gray-900">{stats.daysUntilLeaseExpiry}</p>
                <p className="text-sm text-gray-500">days left</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
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
              <div className="rounded-full bg-yellow-100 p-3">
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
          <CardDescription>Common tasks and important actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              onClick={onMakePayment}
              className="flex h-auto flex-col items-center space-y-2 p-4"
              variant={isPaymentDueSoon ? 'default' : 'outline'}
            >
              <CreditCard className="h-6 w-6" />
              <span className="font-medium">Make Payment</span>
              <span className="text-xs opacity-75">Pay rent online</span>
            </Button>

            <Button
              onClick={onSubmitMaintenance}
              variant="outline"
              className="flex h-auto flex-col items-center space-y-2 p-4"
            >
              <Wrench className="h-6 w-6" />
              <span className="font-medium">Request Maintenance</span>
              <span className="text-xs opacity-75">Report issues</span>
            </Button>

            <Button
              onClick={onViewDocuments}
              variant="outline"
              className="flex h-auto flex-col items-center space-y-2 p-4"
            >
              <FileText className="h-6 w-6" />
              <span className="font-medium">View Documents</span>
              <span className="text-xs opacity-75">Lease & receipts</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary & Maintenance Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Payment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Paid (YTD)</span>
              <span className="font-medium">{formatCurrency(stats.totalAmountPaid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Late Fees Paid</span>
              <span className="font-medium text-red-600">
                {formatCurrency(stats.totalLateFees)}
              </span>
            </div>
            <div className="flex items-center justify-between">
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
              <h4 className="text-sm font-medium">Recent Payments</h4>
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
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
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <div className="mb-1 text-2xl font-bold text-blue-600">
                  {stats.maintenanceRequestsSubmitted}
                </div>
                <p className="text-xs text-gray-600">Total Requests</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <div className="mb-1 text-2xl font-bold text-green-600">
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
              <h4 className="text-sm font-medium">Recent Requests</h4>
              {maintenanceRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        request.status === 'completed'
                          ? 'default'
                          : request.status === 'in_progress'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-xs"
                    >
                      {request.status.replace('_', ' ')}
                    </Badge>
                    <span className="max-w-32 truncate">{request.title}</span>
                  </div>
                  <span className="text-gray-500">
                    {formatDate(request.submitted_date || request.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property & Contact Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Property Details */}
        {lease ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Property Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lease ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Property Type</span>
                      <span className="font-medium capitalize">
                        {lease?.property_type || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Annual Rent</span>
                      <span className="font-medium">
                        {annualRentNgn(lease) > 0 ? formatCurrency(annualRentNgn(lease)) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Security Deposit</span>
                      <span className="font-medium">
                        {formatCurrency(lease?.security_deposit || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lease Period</span>
                      <span className="font-medium">
                        {formatDate(lease?.start_date)} - {formatDate(lease?.end_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Auto Renewal</span>
                      <Badge variant={lease?.auto_renewal ? 'default' : 'secondary'}>
                        {lease?.auto_renewal ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  {lease?.special_terms && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Special Terms:</strong> {lease?.special_terms}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center text-gray-500">No lease information available</div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Property Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-gray-500">
                <Home className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p>No active lease</p>
                <p className="mt-2 text-sm text-gray-400">
                  Contact your property manager to set up your lease
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
              <h4 className="text-sm font-medium">Tenant Since</h4>
              <p className="text-sm text-gray-600">
                {formatDate(profile.move_in_date || profile.created_at)}
                <span className="ml-2">({stats.monthsAsResident} months)</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
