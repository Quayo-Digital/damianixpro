import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Star, Zap, Crown, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuthSession } from '@/contexts/auth';
import { SubscriptionPlan, BillingCycle } from '@/types/subscription';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { SubscriptionService } from '@/services/subscription/subscriptionService';
import { subscriptionGrantsOwnerPaidAccess } from '@/services/subscription/subscriptionEntitlements';

interface SubscriptionPlansProps {
  onPlanSelect?: (planId: string, billingCycle: BillingCycle) => void;
  showCurrentPlan?: boolean;
  /** When false, hides the footer "Compare" row (e.g. on marketing homepage) */
  showCompareLink?: boolean;
}

const tierIcons = {
  free: Star,
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
  white_label: Building2,
};

const tierColors = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-gold-100 text-gold-800',
  white_label: 'bg-indigo-100 text-indigo-800',
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onPlanSelect,
  showCurrentPlan = true,
  showCompareLink = true,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthSession();

  const {
    subscriptionPlans,
    currentSubscription,
    createCheckout,
    startSubscriptionTrial,
    plansLoading,
  } = useSubscription();

  const hasEntitledSubscription = subscriptionGrantsOwnerPaidAccess(currentSubscription);

  /** Paid tiers only — used for checkout-focused actions. */
  const paidPlans = useMemo(
    () => (subscriptionPlans ?? []).filter((p) => p.tier !== 'free'),
    [subscriptionPlans]
  );
  const freePlan = useMemo(
    () =>
      (subscriptionPlans ?? []).find((p) => p.tier === 'free') ??
      SubscriptionService.getSubscriptionPlans().find((p) => p.tier === 'free'),
    [subscriptionPlans]
  );

  const plansForCompare = useMemo(() => {
    if (paidPlans.length > 0) return paidPlans;
    return SubscriptionService.getSubscriptionPlans().filter((p) => p.tier !== 'free');
  }, [paidPlans]);

  const featureMatrix = useMemo(() => SubscriptionService.generateFeatureMatrix(), []);

  const renderFeatureCell = (value: boolean | string | undefined): React.ReactNode => {
    if (value === true) {
      return <Check className="mx-auto h-4 w-4 shrink-0 text-green-600" aria-label="Included" />;
    }
    if (value === false) {
      return (
        <span className="text-muted-foreground" aria-label="Not included">
          —
        </span>
      );
    }
    if (typeof value === 'string') {
      return (
        <span className="text-center text-sm font-medium leading-tight text-foreground">
          {value}
        </span>
      );
    }
    return <span className="text-muted-foreground">—</span>;
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

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (onPlanSelect) {
      onPlanSelect(plan.id, billingCycle);
      return;
    }

    if (!user) {
      navigate('/auth?tab=register');
      toast.info('Sign in or create an account to subscribe.');
      return;
    }

    const price = getDiscountedPrice(plan, billingCycle);
    if (plan.tier === 'free' || price === 0) {
      if (currentSubscription?.plan_id === plan.id) {
        toast.info('You are already on this plan.');
        return;
      }
      navigate('/dashboard');
      toast.success('The free plan is included with your account. Opening your dashboard.');
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
        billingCycle,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleStartTrial = async (plan: SubscriptionPlan) => {
    if (onPlanSelect) {
      onPlanSelect(plan.id, billingCycle);
      return;
    }

    if (!user) {
      navigate('/auth?tab=register');
      toast.info('Sign in or create an account to start a trial.');
      return;
    }

    if (!plan.trial_days || plan.trial_days <= 0) return;

    if (hasEntitledSubscription) {
      toast.info('You already have an active subscription or trial.');
      return;
    }

    if (currentSubscription?.plan_id === plan.id) {
      toast.info('You are already on this plan.');
      return;
    }

    setIsProcessing(plan.id);
    try {
      await startSubscriptionTrial.mutateAsync(plan.id);
    } catch (error) {
      console.error('Start trial error:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  if (plansLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="mb-2 h-6 rounded bg-gray-200"></div>
              <div className="h-4 rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 h-8 rounded bg-gray-200"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 rounded bg-gray-200"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (paidPlans.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No subscription plans are available yet. Please try again later or contact support.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <span
          className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
        >
          Monthly
        </span>
        <Switch
          checked={billingCycle !== 'monthly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <span
          className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
        >
          Yearly
        </span>
        {billingCycle === 'yearly' && (
          <Badge variant="secondary" className="text-xs">
            Save up to 15%
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {freePlan && (
          <Card className="relative transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <Star className="h-8 w-8 text-gray-700" />
              </div>
              <CardTitle className="text-xl font-bold">{freePlan.name}</CardTitle>
              <Badge className={tierColors.free}>Free</Badge>
              <CardDescription className="mt-2 text-sm">{freePlan.description}</CardDescription>
              {freePlan.tagline && (
                <p className="mt-1 text-xs font-medium text-primary">{freePlan.tagline}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-bold text-foreground">
                    {formatCurrency(0, freePlan.pricing.currency)}
                  </span>
                  <span className="ml-1 text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Included automatically with your account
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Features included:</h4>
                <ul className="space-y-2.5 rounded-lg border border-border bg-muted/50 px-3 py-3 dark:bg-muted/30">
                  {freePlan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm leading-snug">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
                        aria-hidden
                      />
                      <span className="text-foreground">{feature.feature_name}</span>
                    </li>
                  ))}
                  {freePlan.features.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      +{freePlan.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>

              <Button
                onClick={() => handleSubscribe(freePlan)}
                disabled={createCheckout.isPending || startSubscriptionTrial.isPending}
                className="w-full"
                variant="outline"
              >
                Continue with Free
              </Button>
            </CardContent>
          </Card>
        )}

        {paidPlans.map((plan) => {
          const TierIcon = tierIcons[plan.tier as keyof typeof tierIcons];
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const canStartTrialHere =
            plan.trial_days > 0 && !hasEntitledSubscription && !isCurrentPlan;
          const price = getDiscountedPrice(plan, billingCycle);
          const monthlyEquivalent = getMonthlyEquivalent(plan, billingCycle);
          const savings = getSavingsPercentage(plan, billingCycle);
          const processing = isProcessing === plan.id;
          const actionPending =
            processing || createCheckout.isPending || startSubscriptionTrial.isPending;

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'scale-105 ring-2 ring-blue-500' : ''
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                  <Badge className="bg-blue-500 text-primary-foreground dark:bg-blue-600">
                    Most Popular
                  </Badge>
                </div>
              )}

              {isCurrentPlan && showCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-primary-foreground dark:bg-green-600">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 text-center">
                <div className="mb-2 flex items-center justify-center">
                  <TierIcon className="h-8 w-8 text-blue-600" />
                </div>

                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>

                <Badge className={tierColors[plan.tier as keyof typeof tierColors]}>
                  {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                </Badge>

                <CardDescription className="mt-2 text-sm">{plan.description}</CardDescription>

                {plan.tagline && (
                  <p className="mt-1 text-xs font-medium text-primary">{plan.tagline}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-foreground">
                      {formatCurrency(monthlyEquivalent, plan.pricing.currency)}
                    </span>
                    <span className="ml-1 text-muted-foreground">/month</span>
                  </div>

                  {billingCycle !== 'monthly' && price > 0 && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {formatCurrency(price, plan.pricing.currency)} billed {billingCycle}
                    </div>
                  )}

                  {savings > 0 && (
                    <Badge
                      variant="outline"
                      className="mt-2 border-green-600 text-green-700 dark:text-green-400"
                    >
                      Save {savings}%
                    </Badge>
                  )}

                  {plan.trial_days > 0 && (
                    <p className="mt-2 text-sm font-medium text-primary">
                      {plan.trial_days}-day free trial
                    </p>
                  )}
                </div>

                {/* Features — inset surface + theme foreground for readable contrast on bg-card */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Features included:</h4>
                  <ul className="space-y-2.5 rounded-lg border border-border bg-muted/50 px-3 py-3 dark:bg-muted/30">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-snug">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
                          aria-hidden
                        />
                        <span className="text-foreground">{feature.feature_name}</span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-sm text-muted-foreground">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Limits */}
                {Object.keys(plan.limits).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Usage limits:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(plan.limits)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-2">
                            <span className="capitalize text-muted-foreground">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {value === 'unlimited' ? '∞' : value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* CTA: app-owned trial (RPC) vs Flutterwave checkout */}
                {canStartTrialHere ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleStartTrial(plan)}
                      disabled={actionPending}
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'default'}
                    >
                      {processing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        `Start ${plan.trial_days}-day free trial`
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSubscribe(plan)}
                      disabled={actionPending}
                    >
                      Subscribe now
                      {billingCycle !== 'monthly'
                        ? ` (${billingCycle === 'yearly' ? 'yearly' : billingCycle})`
                        : ''}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={actionPending || isCurrentPlan}
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
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
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
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showCompareLink && (
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-blue-600 hover:text-blue-700"
            type="button"
            onClick={() => setCompareOpen(true)}
          >
            Compare all features →
          </Button>
        </div>
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col gap-0 p-0 sm:max-w-5xl">
          <DialogHeader className="border-b px-6 py-4 text-left">
            <DialogTitle>Compare all features</DialogTitle>
            <DialogDescription>
              See what is included on each plan. Limits shown are per billing period where
              applicable.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto px-2 pb-4 sm:px-4">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-3 text-left font-semibold text-foreground">
                    Feature
                  </th>
                  {plansForCompare.map((plan) => (
                    <th
                      key={plan.id}
                      className="whitespace-nowrap px-2 py-3 text-center font-semibold text-foreground"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureMatrix.features.map((featureName) => (
                  <tr key={featureName} className="border-b border-border/80">
                    <td className="sticky left-0 z-10 bg-background px-3 py-2.5 font-medium text-foreground">
                      {featureName}
                    </td>
                    {plansForCompare.map((plan) => {
                      const tierData = featureMatrix.plans[plan.tier];
                      const cell = tierData?.[featureName];
                      return (
                        <td key={plan.id} className="px-2 py-2.5 text-center align-middle">
                          {renderFeatureCell(cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
