import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Star, Zap, Crown, Building2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionPlan, BillingCycle } from '@/types/subscription';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  onPlanSelect?: (planId: string, billingCycle: BillingCycle) => void;
  showCurrentPlan?: boolean;
}

const tierIcons = {
  free: Star,
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
  white_label: Building2
};

const tierColors = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-gold-100 text-gold-800',
  white_label: 'bg-indigo-100 text-indigo-800'
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onPlanSelect,
  showCurrentPlan = true
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const {
    subscriptionPlans,
    currentSubscription,
    createCheckout,
    isLoading
  } = useSubscription();

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (onPlanSelect) {
      onPlanSelect(plan.id, billingCycle);
      return;
    }

    if (currentSubscription?.plan_id === plan.id) {
      toast.info('You are already subscribed to this plan');
      return;
    }

    setIsProcessing(plan.id);
    
    try {
      await createCheckout.mutateAsync({
        planId: plan.id,
        billingCycle
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsProcessing(null);
    }
  };

  const getDiscountedPrice = (plan: SubscriptionPlan, cycle: BillingCycle) => {
    const basePrice = plan.pricing[cycle] || 0;
    if (cycle === 'quarterly' && plan.pricing.discount_quarterly) {
      return basePrice * (1 - plan.pricing.discount_quarterly / 100);
    }
    if (cycle === 'yearly' && plan.pricing.discount_yearly) {
      return basePrice * (1 - plan.pricing.discount_yearly / 100);
    }
    return basePrice;
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan, cycle: BillingCycle) => {
    const price = getDiscountedPrice(plan, cycle);
    switch (cycle) {
      case 'quarterly':
        return price / 3;
      case 'yearly':
        return price / 12;
      default:
        return price;
    }
  };

  const getSavingsPercentage = (plan: SubscriptionPlan, cycle: BillingCycle) => {
    if (cycle === 'monthly') return 0;
    
    const monthlyPrice = plan.pricing.monthly || 0;
    const discountedMonthly = getMonthlyEquivalent(plan, cycle);
    
    if (monthlyPrice === 0) return 0;
    
    return Math.round(((monthlyPrice - discountedMonthly) / monthlyPrice) * 100);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <span className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-500'}`}>
          Monthly
        </span>
        <Switch
          checked={billingCycle !== 'monthly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <span className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold' : 'text-gray-500'}`}>
          Yearly
        </span>
        {billingCycle === 'yearly' && (
          <Badge variant="secondary" className="text-xs">
            Save up to 15%
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans?.map((plan) => {
          const TierIcon = tierIcons[plan.tier as keyof typeof tierIcons];
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const price = getDiscountedPrice(plan, billingCycle);
          const monthlyEquivalent = getMonthlyEquivalent(plan, billingCycle);
          const savings = getSavingsPercentage(plan, billingCycle);
          const processing = isProcessing === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}
              
              {isCurrentPlan && showCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  <TierIcon className="h-8 w-8 text-blue-600" />
                </div>
                
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                
                <Badge className={tierColors[plan.tier as keyof typeof tierColors]}>
                  {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                </Badge>
                
                <CardDescription className="text-sm text-gray-600 mt-2">
                  {plan.description}
                </CardDescription>
                
                {plan.tagline && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {plan.tagline}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold">
                      {formatCurrency(monthlyEquivalent, plan.pricing.currency)}
                    </span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                  
                  {billingCycle !== 'monthly' && price > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(price, plan.pricing.currency)} billed {billingCycle}
                    </div>
                  )}
                  
                  {savings > 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-600 mt-2">
                      Save {savings}%
                    </Badge>
                  )}
                  
                  {plan.trial_days > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                      {plan.trial_days}-day free trial
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-900">Features included:</h4>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature.feature_name}</span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-sm text-gray-500">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Limits */}
                {Object.keys(plan.limits).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">Usage limits:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(plan.limits).slice(0, 4).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium">
                            {value === 'unlimited' ? '∞' : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={processing || createCheckout.isPending || isCurrentPlan}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : isCurrentPlan 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : ''
                  }`}
                  variant={plan.popular ? 'default' : isCurrentPlan ? 'default' : 'outline'}
                >
                  {processing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.tier === 'free' ? (
                    'Get Started Free'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Link */}
      <div className="text-center">
        <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
          Compare all features →
        </Button>
      </div>
    </div>
  );
};
