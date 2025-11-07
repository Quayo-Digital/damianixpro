
// Advanced Subscription Management React Hook

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionService } from '@/services/subscription/subscriptionService';
import { createPaystackPlan, initializePayment } from '@/utils/PaystackUtils';
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
  PaymentTransaction
} from '@/types/subscription';

interface UseSubscriptionOptions {
  userId?: string;
  includeAnalytics?: boolean;
}

export function useSubscription(options: UseSubscriptionOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { userId = user?.id, includeAnalytics = false } = options;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);

  // Fetch available subscription plans
  const {
    data: subscriptionPlans = [],
    isLoading: plansLoading,
    error: plansError
  } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => SubscriptionService.getSubscriptionPlans(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch user's current subscription
  const {
    data: currentSubscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserSubscription;
    },
    enabled: !!userId
  });

  // Fetch subscription analytics (admin only)
  const {
    data: analytics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*');
      
      if (error) throw error;
      return SubscriptionService.generateAnalytics(data);
    },
    enabled: includeAnalytics && user?.role === 'admin',
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Fetch user's invoices
  const {
    data: invoices = [],
    isLoading: invoicesLoading
  } = useQuery({
    queryKey: ['user-invoices', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!userId
  });

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async ({
      planId,
      billingCycle,
      successUrl,
      cancelUrl
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
      
      // Create Paystack plan if it doesn't exist
      const paystackPlan = await createPaystackPlan(
        `${plan.name} - ${billingCycle}`,
        pricing.finalPrice,
        billingCycle === 'monthly' ? 'monthly' : 
        billingCycle === 'quarterly' ? 'quarterly' : 'annually'
      );
      
      // Initialize payment
      const paymentData = await initializePayment({
        email: user?.email || '',
        amount: pricing.finalPrice,
        plan: paystackPlan.plan_code,
        callback_url: successUrl || `${window.location.origin}/subscription/success`,
        metadata: {
          user_id: userId,
          plan_id: planId,
          billing_cycle: billingCycle
        }
      });
      
      const session: CheckoutSession = {
        id: paymentData.reference,
        url: paymentData.authorization_url,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        plan_id: planId,
        billing_cycle: billingCycle,
        trial_days: plan.trial_days
      };
      
      return session;
    },
    onSuccess: (session) => {
      setCheckoutSession(session);
      toast.success('Checkout session created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create checkout session: ${error.message}`);
    }
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({
      subscriptionId,
      updates
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
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
    }
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: new Date().toISOString()
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
    }
  });

  // Utility functions
  const getCurrentPlan = useCallback((): SubscriptionPlan | null => {
    if (!currentSubscription) return null;
    return SubscriptionService.getSubscriptionPlan(currentSubscription.plan_id);
  }, [currentSubscription]);

  const hasFeatureAccess = useCallback((featureKey: string): boolean => {
    if (!currentSubscription) return false;
    const plan = getCurrentPlan();
    if (!plan) return false;
    return SubscriptionService.hasFeatureAccess(currentSubscription, plan, featureKey);
  }, [currentSubscription, getCurrentPlan]);

  const checkFeatureUsage = useCallback((featureKey: string): FeatureUsageLimit => {
    if (!currentSubscription) {
      return {
        feature_key: featureKey,
        limit: 0,
        current_usage: 0,
        percentage_used: 0,
        is_exceeded: true,
        overage_allowed: false
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
        overage_allowed: false
      };
    }
    
    return SubscriptionService.checkFeatureUsage(currentSubscription, plan, featureKey);
  }, [currentSubscription, getCurrentPlan]);

  const validateAction = useCallback((
    action: string,
    resourceType: 'property' | 'tenant' | 'document' | 'ai_request'
  ) => {
    if (!currentSubscription) {
      return {
        allowed: false,
        reason: 'No active subscription',
        upgradeRequired: true,
        suggestedPlan: 'starter-plan'
      };
    }
    
    const plan = getCurrentPlan();
    if (!plan) {
      return {
        allowed: false,
        reason: 'Invalid subscription plan',
        upgradeRequired: true,
        suggestedPlan: 'starter-plan'
      };
    }
    
    return SubscriptionService.validateAction(currentSubscription, plan, action, resourceType);
  }, [currentSubscription, getCurrentPlan]);

  const calculatePlanChange = useCallback((
    newPlanId: string,
    newBillingCycle: BillingCycle
  ) => {
    if (!currentSubscription) return null;
    
    const currentPlan = getCurrentPlan();
    const newPlan = SubscriptionService.getSubscriptionPlan(newPlanId);
    
    if (!currentPlan || !newPlan) return null;
    
    const daysRemaining = Math.ceil(
      (new Date(currentSubscription.current_period_end).getTime() - Date.now()) / 
      (1000 * 60 * 60 * 24)
    );
    
    return SubscriptionService.calculatePlanChange(
      currentPlan,
      newPlan,
      newBillingCycle,
      daysRemaining
    );
  }, [currentSubscription, getCurrentPlan]);

  const getFeatureMatrix = useCallback(() => {
    return SubscriptionService.generateFeatureMatrix();
  }, []);

  // Real-time subscription updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`subscription-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${userId}`
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
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-invoices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return {
    // Data
    subscriptionPlans,
    currentSubscription,
    currentPlan: getCurrentPlan(),
    invoices,
    analytics,
    checkoutSession,

    // Loading states
    plansLoading,
    subscriptionLoading,
    invoicesLoading,
    analyticsLoading,
    isProcessing: isProcessing || createCheckoutMutation.isPending,
    isUpdating: updateSubscriptionMutation.isPending,
    isCanceling: cancelSubscriptionMutation.isPending,
    isReactivating: reactivateSubscriptionMutation.isPending,

    // Errors
    plansError,
    subscriptionError,
    checkoutError: createCheckoutMutation.error,
    updateError: updateSubscriptionMutation.error,

    // Actions
    createCheckout: createCheckoutMutation.mutate,
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
      const plan = subscriptionPlans.find(p => p.name.toLowerCase().includes(planName.toLowerCase()));
      if (!plan) {
        toast.error('Plan not found');
        return;
      }
      
      const billingCycle: BillingCycle = interval === 'annually' ? 'yearly' : 'monthly';
      createCheckoutMutation.mutate({ planId: plan.id, billingCycle });
    }
  };
}

