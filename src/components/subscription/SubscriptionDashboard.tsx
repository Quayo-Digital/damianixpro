import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Download,
  Settings,
  Crown,
  Zap,
  Building2,
  Star
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SubscriptionPlans } from './SubscriptionPlans';
import { toast } from 'sonner';

const tierIcons = {
  free: Star,
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
  white_label: Building2
};

export const SubscriptionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    currentSubscription,
    subscriptionPlans,
    invoices,
    usageData,
    analytics,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    isLoading
  } = useSubscription();

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.'
    );
    
    if (confirmed) {
      try {
        await cancelSubscription.mutateAsync(currentSubscription.id);
        toast.success('Subscription cancelled successfully');
      } catch (error) {
        toast.error('Failed to cancel subscription');
      }
    }
  };

  const handleReactivateSubscription = async () => {
    if (!currentSubscription) return;
    
    try {
      await reactivateSubscription.mutateAsync(currentSubscription.id);
      toast.success('Subscription reactivated successfully');
    } catch (error) {
      toast.error('Failed to reactivate subscription');
    }
  };

  const getCurrentPlan = () => {
    if (!currentSubscription || !subscriptionPlans) return null;
    return subscriptionPlans.find(plan => plan.id === currentSubscription.plan_id);
  };

  const getUsagePercentage = (used: number, limit: number | string) => {
    if (limit === 'unlimited') return 0;
    if (typeof limit !== 'number' || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const TierIcon = currentPlan ? tierIcons[currentPlan.tier as keyof typeof tierIcons] : Star;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage your subscription, usage, and billing</p>
        </div>
        
        {currentSubscription && (
          <div className="flex items-center space-x-2">
            <TierIcon className="h-6 w-6 text-blue-600" />
            <Badge variant="outline" className="text-lg px-3 py-1">
              {currentPlan?.name || 'Unknown Plan'}
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentPlan?.name || 'No Active Plan'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentSubscription?.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentSubscription?.current_period_end 
                    ? formatDate(currentSubscription.current_period_end)
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentSubscription?.billing_cycle || 'No billing cycle'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentPlan?.pricing?.monthly 
                    ? formatCurrency(currentPlan.pricing.monthly, 'NGN')
                    : 'Free'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentSubscription?.billing_cycle === 'yearly' ? 'Billed yearly' : 'Per month'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Alerts */}
          {currentSubscription?.status === 'past_due' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription payment is past due. Please update your payment method to avoid service interruption.
              </AlertDescription>
            </Alert>
          )}

          {currentSubscription?.cancel_at_period_end && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Your subscription will be cancelled at the end of the current billing period 
                  ({formatDate(currentSubscription.current_period_end)}).
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleReactivateSubscription}
                  disabled={reactivateSubscription.isPending}
                >
                  Reactivate
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your subscription settings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setActiveTab('plans')}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
              
              <Button variant="outline" onClick={() => setActiveTab('billing')}>
                <CreditCard className="h-4 w-4 mr-2" />
                View Billing
              </Button>
              
              {currentSubscription && !currentSubscription.cancel_at_period_end && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscription.isPending}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Usage</CardTitle>
              <CardDescription>
                Track your usage against plan limits for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {usageData && currentPlan && Object.entries(currentPlan.limits).map(([key, limit]) => {
                const used = usageData[key] || 0;
                const percentage = getUsagePercentage(used, limit);
                const status = getUsageStatus(percentage);
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {used} / {limit === 'unlimited' ? '∞' : limit}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${
                        status === 'destructive' ? 'bg-red-100' :
                        status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}
                    />
                    {percentage >= 90 && limit !== 'unlimited' && (
                      <p className="text-xs text-red-600">
                        You're approaching your limit. Consider upgrading your plan.
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Usage Analytics */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>Your usage patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.total_properties || 0}
                    </div>
                    <p className="text-sm text-gray-600">Total Properties</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.active_tenants || 0}
                    </div>
                    <p className="text-sm text-gray-600">Active Tenants</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.documents_processed || 0}
                    </div>
                    <p className="text-sm text-gray-600">Documents Processed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(invoice.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(invoice.amount_due, invoice.currency)}
                          </p>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        
                        {invoice.pdf_url && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">
                  No invoices found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPlans showCurrentPlan={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
