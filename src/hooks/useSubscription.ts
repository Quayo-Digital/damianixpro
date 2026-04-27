// Advanced Subscription Management React Hook

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/AuthContext';
import { SubscriptionService } from '@/services/subscription/subscriptionService';
import { subscriptionGrantsOwnerPaidAccess } from '@/services/subscription/subscriptionEntitlements';
import { flutterwaveInitialize } from '@/services/payments/edgeFunctionApi';
import { toast } from '@/components/ui/sonner';
import {
  SubscriptionPlan,
  UserSubscription,
  BillingCycle,
  SubscriptionTier,
  FeatureUsageLimit,
  SubscriptionAnalytics,
  CheckoutSession,
  Invoice,
  PaymentTransaction,
} from '@/types/subscription';

interface UseSubscriptionOptions {
  userId?: string;
  includeAnalytics?: boolean;
}

/** PostgREST / Postgres errors where trial-expiry RPC can be skipped safely. */
function isBenignTrialExpiryRpcError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const code = err.code ?? '';
  const msg = (err.message ?? '').toLowerCase();
  if (code === '42501') return true;
  if (msg.includes('permission denied')) return true;
  if (msg.includes('does not exist') && msg.includes('function')) return true;
  return false;
}

/** Transient invalid/expired JWT — browser shows HTTP 401; PostgREST message varies by version. */
function isLikelySupabaseAuthError(
  err: { message?: string; details?: string; status?: number; code?: string } | null
): boolean {
  if (!err) return false;
  if (err.status === 401) return true;
  const code = String(err.code ?? '');
  if (code === '401' || code === 'PGRST301') return true;
  const combined = `${err.message ?? ''} ${err.details ?? ''}`.toLowerCase();
  return (
    combined.includes('jwt') ||
    combined.includes('invalid token') ||
    (combined.includes('expired') && combined.includes('token')) ||
    combined.includes('not authorized') ||
    combined.includes('unauthorized')
  );
}

export function useSubscription(options: UseSubscriptionOptions = {}) {
  const { user, session, isLoading: authLoading } = useAuthSession();
  const queryClient = useQueryClient();
  const { userId = user?.id, includeAnalytics = false } = options;

  /** Avoid firing authenticated REST calls before Supabase has attached a JWT (reduces stray 401s). */
  const supabaseAuthReady = Boolean(userId && !authLoading && session?.access_token);

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);

  // Fetch available subscription plans
  const {
    data: subscriptionPlans = [],
    isLoading: plansLoading,
    error: plansError,
  } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => SubscriptionService.getSubscriptionPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's current subscription
  const {
    data: currentSubscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      if (!userId) return null;

      const fetchSubscriptionRow = async () => {
        const { error: expireError } = await supabase.rpc('expire_own_subscription_trials_if_due');
        if (
          expireError &&
          !isBenignTrialExpiryRpcError(expireError) &&
          !isLikelySupabaseAuthError(expireError)
        ) {
          console.warn('expire_own_subscription_trials_if_due:', expireError.message);
        }

        // Avoid `.single()` / `.maybeSingle()` object semantics: multiple active rows (data drift)
        // or PostgREST Accept headers can still yield 406. Use limit(1) + array instead.
        return supabase
          .from('user_subscriptions')
          .select(
            `
          *,
          subscription_plans(*)
        `
          )
          .eq('user_id', userId)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1);
      };

      let { data, error } = await fetchSubscriptionRow();
      if (error && isLikelySupabaseAuthError(error)) {
        await supabase.auth.refreshSession();
        ({ data, error } = await fetchSubscriptionRow());
      }
      if (error) throw error;
      const row = data?.[0];
      return (row ?? null) as UserSubscription | null;
    },
    enabled: supabaseAuthReady,
  });

  /** True when we apply Free-tier entitlements (no row, or trial expired but DB not yet updated). */
  const implicitFreeTier = Boolean(
    userId && (!currentSubscription || !subscriptionGrantsOwnerPaidAccess(currentSubscription))
  );

  /** Use for `hasFeatureAccess` / limits: entitled row if present, else synthetic Free. */
  const entitlementsSubscription = useMemo((): UserSubscription | null => {
    if (!userId) return null;
    if (currentSubscription && subscriptionGrantsOwnerPaidAccess(currentSubscription)) {
      return currentSubscription;
    }
    return SubscriptionService.buildImplicitFreeSubscription(userId);
  }, [userId, currentSubscription]);

  // Fetch subscription analytics (admin only)
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_subscriptions').select('*');

      if (error) throw error;
      return SubscriptionService.generateAnalytics(data);
    },
    enabled: includeAnalytics && user?.role === 'admin',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch user's invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['user-invoices', userId],
    queryFn: async () => {
      if (!userId) return [];

      const fetchInvoices = () =>
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

      let { data, error } = await fetchInvoices();
      if (error && isLikelySupabaseAuthError(error)) {
        await supabase.auth.refreshSession();
        ({ data, error } = await fetchInvoices());
      }
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: supabaseAuthReady,
  });

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async ({
      planId,
      billingCycle,
      successUrl,
      cancelUrl,
    }: {
      planId: string;
      billingCycle: BillingCycle;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      if (!userId) throw new Error('User not authenticated');

      const plan = SubscriptionService.getSubscriptionPlan(planId);
      if (!plan) throw new Error('Plan not found');

      const pricing = SubscriptionService.calculatePricing(plan, billingCycle);
      const txRef = `SUB_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

      // Initialize Flutterwave hosted checkout (subscription is finalized in flutterwave-webhook via meta)
      const result = await flutterwaveInitialize({
        email: user?.email || '',
        amount: pricing.finalPrice,
        tx_ref: txRef,
        redirect_url: successUrl || `${window.location.origin}/subscription/success`,
        currency: 'NGN',
        customizations: {
          title: 'DamianixPro subscription',
          description: `${plan.name} — ${billingCycle} billing`,
        },
        meta: {
          user_id: userId,
          plan_tier: plan.tier,
          billing_cycle: billingCycle,
          app_plan_id: planId,
          payment_type: 'subscription',
        },
      });

      if (result.status !== 'success' || !result.data?.link) {
        throw new Error(result.message || 'Payment initialization failed');
      }

      const session: CheckoutSession = {
        id: result.data.tx_ref,
        url: result.data.link,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        plan_id: planId,
        billing_cycle: billingCycle,
        trial_days: plan.trial_days,
      };

      return session;
    },
    onSuccess: (session) => {
      setCheckoutSession(session);
      if (session.url) {
        window.location.assign(session.url);
        return;
      }
      toast.success('Checkout session created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create checkout session: ${error.message}`);
    },
  });

  const startTrialMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('start_subscription_trial', {
        p_plan_id: planId,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast.success('Your trial has started. Enjoy full plan access until it ends.');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || 'Could not start trial');
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({
      subscriptionId,
      updates,
    }: {
      subscriptionId: string;
      updates: Partial<UserSubscription>;
    }) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast.success('Subscription updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update subscription: ${error.message}`);
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast.success('Subscription will be canceled at the end of the current period.');
    },
    onError: (error) => {
      toast.error(`Failed to cancel subscription: ${error.message}`);
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast.success('Subscription reactivated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to reactivate subscription: ${error.message}`);
    },
  });

  // Utility functions
  const getCurrentPlan = useCallback((): SubscriptionPlan | null => {
    if (!entitlementsSubscription) return null;
    const byId = SubscriptionService.getSubscriptionPlan(entitlementsSubscription.plan_id);
    if (byId) return byId;
    const joined = (
      entitlementsSubscription as UserSubscription & {
        subscription_plans?: { tier?: string } | null;
      }
    ).subscription_plans;
    const tier = joined?.tier as SubscriptionTier | undefined;
    if (tier) return SubscriptionService.getSubscriptionPlanByTier(tier);
    return null;
  }, [entitlementsSubscription]);

  const hasFeatureAccess = useCallback(
    (featureKey: string): boolean => {
      if (!entitlementsSubscription) return false;
      const plan = getCurrentPlan();
      if (!plan) return false;
      return SubscriptionService.hasFeatureAccess(entitlementsSubscription, plan, featureKey);
    },
    [entitlementsSubscription, getCurrentPlan]
  );

  const checkFeatureUsage = useCallback(
    (featureKey: string): FeatureUsageLimit => {
      if (!entitlementsSubscription) {
        return {
          feature_key: featureKey,
          limit: 0,
          current_usage: 0,
          percentage_used: 0,
          is_exceeded: true,
          overage_allowed: false,
        };
      }

      const plan = getCurrentPlan();
      if (!plan) {
        return {
          feature_key: featureKey,
          limit: 0,
          current_usage: 0,
          percentage_used: 0,
          is_exceeded: true,
          overage_allowed: false,
        };
      }

      return SubscriptionService.checkFeatureUsage(entitlementsSubscription, plan, featureKey);
    },
    [entitlementsSubscription, getCurrentPlan]
  );

  const validateAction = useCallback(
    (action: string, resourceType: 'property' | 'tenant' | 'document' | 'ai_request') => {
      if (!entitlementsSubscription) {
        return {
          allowed: false,
          reason: 'No active subscription',
          upgradeRequired: true,
          suggestedPlan: 'starter-plan',
        };
      }

      const plan = getCurrentPlan();
      if (!plan) {
        return {
          allowed: false,
          reason: 'Invalid subscription plan',
          upgradeRequired: true,
          suggestedPlan: 'starter-plan',
        };
      }

      return SubscriptionService.validateAction(
        entitlementsSubscription,
        plan,
        action,
        resourceType
      );
    },
    [entitlementsSubscription, getCurrentPlan]
  );

  const calculatePlanChange = useCallback(
    (newPlanId: string, newBillingCycle: BillingCycle) => {
      if (!entitlementsSubscription) return null;

      const currentPlan = getCurrentPlan();
      const newPlan = SubscriptionService.getSubscriptionPlan(newPlanId);

      if (!currentPlan || !newPlan) return null;

      const daysRemaining = Math.ceil(
        (new Date(entitlementsSubscription.current_period_end).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      return SubscriptionService.calculatePlanChange(
        currentPlan,
        newPlan,
        newBillingCycle,
        daysRemaining
      );
    },
    [entitlementsSubscription, getCurrentPlan]
  );

  const getFeatureMatrix = useCallback(() => {
    return SubscriptionService.generateFeatureMatrix();
  }, []);

  // Real-time subscription updates (deferred to avoid WebSocket "closed before established" on fast mount/unmount)
  useEffect(() => {
    if (!userId) return;

    let channel: Parameters<typeof supabase.removeChannel>[0] | null = null;
    const timeoutId = setTimeout(() => {
      channel = supabase
        .channel(`subscription-updates-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'invoices',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['user-invoices'] });
          }
        )
        .subscribe();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, queryClient]);

  return {
    // Data
    subscriptionPlans,
    currentSubscription,
    /** Entitled paid/trial row from DB, or synthetic Free when not entitled (incl. expired trial). */
    entitlementsSubscription,
    implicitFreeTier,
    currentPlan: getCurrentPlan(),
    invoices,
    analytics,
    checkoutSession,

    // Loading states
    plansLoading,
    subscriptionLoading,
    /** True while plans or current subscription are loading (dashboard / plan pickers) */
    isLoading: plansLoading || subscriptionLoading,
    invoicesLoading,
    analyticsLoading,
    isProcessing: isProcessing || createCheckoutMutation.isPending || startTrialMutation.isPending,
    isUpdating: updateSubscriptionMutation.isPending,
    isCanceling: cancelSubscriptionMutation.isPending,
    isReactivating: reactivateSubscriptionMutation.isPending,

    // Errors
    plansError,
    subscriptionError,
    checkoutError: createCheckoutMutation.error,
    updateError: updateSubscriptionMutation.error,

    // Actions
    createCheckout: createCheckoutMutation,
    startSubscriptionTrial: startTrialMutation,
    updateSubscription: updateSubscriptionMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    reactivateSubscription: reactivateSubscriptionMutation.mutate,
    refetchSubscription,

    // Utility functions
    hasFeatureAccess,
    checkFeatureUsage,
    validateAction,
    calculatePlanChange,
    getFeatureMatrix,

    // Legacy support for existing code
    startSubscription: async (
      planName: string,
      interval: 'monthly' | 'annually',
      amount: number
    ) => {
      const plan = subscriptionPlans.find((p) =>
        p.name.toLowerCase().includes(planName.toLowerCase())
      );
      if (!plan) {
        toast.error('Plan not found');
        return;
      }

      const billingCycle: BillingCycle = interval === 'annually' ? 'yearly' : 'monthly';
      createCheckoutMutation.mutate({ planId: plan.id, billingCycle });
    },
  };
}
