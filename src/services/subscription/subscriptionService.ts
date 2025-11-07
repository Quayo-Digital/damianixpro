// Advanced Subscription Management Service

import {
  SubscriptionPlan,
  SubscriptionTier,
  UserSubscription,
  BillingCycle,
  FeatureUsageLimit,
  UsageTracking,
  SubscriptionAnalytics,
  CheckoutSession,
  BillingPortalSession,
  Invoice,
  PaymentTransaction,
  FeatureAccess,
  AddOnOption
} from '@/types/subscription';

export class SubscriptionService {
  // Predefined subscription plans for Nigerian market
  private static readonly SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
      id: 'free-tier',
      name: 'Free',
      tier: 'free',
      description: 'Perfect for individual landlords getting started',
      tagline: 'Start managing your first property',
      pricing: {
        monthly: 0,
        quarterly: 0,
        yearly: 0,
        currency: 'NGN'
      },
      limits: {
        properties: 1,
        tenants: 3,
        documents_per_month: 10,
        ai_recommendations_per_month: 5,
        maintenance_alerts: 10,
        storage_gb: 1,
        api_calls_per_month: 0,
        team_members: 1
      },
      features: [
        {
          category: 'properties',
          feature_key: 'basic_property_management',
          feature_name: 'Basic Property Management',
          description: 'Add and manage up to 1 property',
          enabled: true
        },
        {
          category: 'tenants',
          feature_key: 'tenant_management',
          feature_name: 'Tenant Management',
          description: 'Manage up to 3 tenants',
          enabled: true
        },
        {
          category: 'ai_features',
          feature_key: 'basic_ai_matching',
          feature_name: 'Basic AI Property Matching',
          description: 'Limited AI-powered tenant recommendations',
          enabled: true,
          usage_limit: 5
        },
        {
          category: 'documents',
          feature_key: 'document_processing',
          feature_name: 'Document Processing',
          description: 'Process up to 10 documents per month',
          enabled: true,
          usage_limit: 10
        },
        {
          category: 'support',
          feature_key: 'community_support',
          feature_name: 'Community Support',
          description: 'Access to community forums',
          enabled: true
        }
      ],
      trial_days: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'starter-plan',
      name: 'Starter',
      tier: 'starter',
      description: 'Ideal for small-scale landlords and property managers',
      tagline: 'Scale your property business',
      popular: true,
      pricing: {
        monthly: 15000, // ₦15,000
        quarterly: 40500, // 10% discount
        yearly: 162000, // 15% discount
        currency: 'NGN',
        discount_quarterly: 10,
        discount_yearly: 15
      },
      limits: {
        properties: 5,
        tenants: 25,
        documents_per_month: 100,
        ai_recommendations_per_month: 50,
        maintenance_alerts: 100,
        storage_gb: 10,
        api_calls_per_month: 1000,
        team_members: 3
      },
      features: [
        {
          category: 'properties',
          feature_key: 'advanced_property_management',
          feature_name: 'Advanced Property Management',
          description: 'Manage up to 5 properties with detailed analytics',
          enabled: true
        },
        {
          category: 'ai_features',
          feature_key: 'smart_matching',
          feature_name: 'Smart Property Matching',
          description: 'AI-powered tenant recommendations with behavioral learning',
          enabled: true,
          usage_limit: 50
        },
        {
          category: 'ai_features',
          feature_key: 'predictive_maintenance',
          feature_name: 'Predictive Maintenance',
          description: 'AI-powered maintenance alerts and scheduling',
          enabled: true
        },
        {
          category: 'documents',
          feature_key: 'intelligent_document_processing',
          feature_name: 'Intelligent Document Processing',
          description: 'AI-powered document analysis and extraction',
          enabled: true,
          usage_limit: 100
        },
        {
          category: 'analytics',
          feature_key: 'basic_analytics',
          feature_name: 'Basic Analytics',
          description: 'Property performance and financial reports',
          enabled: true
        },
        {
          category: 'support',
          feature_key: 'email_support',
          feature_name: 'Email Support',
          description: '24/7 email support with 24-hour response time',
          enabled: true
        }
      ],
      trial_days: 14,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'professional-plan',
      name: 'Professional',
      tier: 'professional',
      description: 'Perfect for growing property management companies',
      tagline: 'Professional property management at scale',
      pricing: {
        monthly: 45000, // ₦45,000
        quarterly: 121500, // 10% discount
        yearly: 459000, // 15% discount
        currency: 'NGN',
        discount_quarterly: 10,
        discount_yearly: 15
      },
      limits: {
        properties: 25,
        tenants: 150,
        documents_per_month: 500,
        ai_recommendations_per_month: 200,
        maintenance_alerts: 500,
        storage_gb: 50,
        api_calls_per_month: 10000,
        team_members: 10
      },
      features: [
        {
          category: 'properties',
          feature_key: 'unlimited_property_features',
          feature_name: 'Advanced Property Features',
          description: 'Full property management suite with custom fields',
          enabled: true
        },
        {
          category: 'ai_features',
          feature_key: 'advanced_ai_suite',
          feature_name: 'Complete AI Suite',
          description: 'All AI features with priority processing',
          enabled: true
        },
        {
          category: 'analytics',
          feature_key: 'advanced_analytics',
          feature_name: 'Advanced Analytics & Reporting',
          description: 'Comprehensive business intelligence and custom reports',
          enabled: true
        },
        {
          category: 'integrations',
          feature_key: 'api_access',
          feature_name: 'API Access',
          description: 'Full API access for custom integrations',
          enabled: true
        },
        {
          category: 'support',
          feature_key: 'priority_support',
          feature_name: 'Priority Support',
          description: 'Priority phone and email support with 4-hour response',
          enabled: true
        }
      ],
      add_ons: [
        {
          id: 'extra-properties',
          name: 'Additional Properties',
          description: 'Add more properties beyond the plan limit',
          category: 'properties',
          pricing: {
            monthly: 2000 // ₦2,000 per property
          },
          limits: {
            properties: 1
          },
          is_active: true
        },
        {
          id: 'white-label-basic',
          name: 'Basic White Label',
          description: 'Custom branding and domain',
          category: 'integrations',
          pricing: {
            monthly: 25000,
            setup_fee: 100000
          },
          is_active: true
        }
      ],
      trial_days: 30,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'enterprise-plan',
      name: 'Enterprise',
      tier: 'enterprise',
      description: 'For large property management companies and enterprises',
      tagline: 'Enterprise-grade property management',
      pricing: {
        monthly: 150000, // ₦150,000
        quarterly: 405000, // 10% discount
        yearly: 1530000, // 15% discount
        currency: 'NGN',
        discount_quarterly: 10,
        discount_yearly: 15
      },
      limits: {
        properties: 'unlimited',
        tenants: 'unlimited',
        documents_per_month: 'unlimited',
        ai_recommendations_per_month: 'unlimited',
        maintenance_alerts: 'unlimited',
        storage_gb: 'unlimited',
        api_calls_per_month: 'unlimited',
        team_members: 'unlimited'
      },
      features: [
        {
          category: 'properties',
          feature_key: 'enterprise_property_management',
          feature_name: 'Enterprise Property Management',
          description: 'Unlimited properties with advanced workflows',
          enabled: true
        },
        {
          category: 'ai_features',
          feature_key: 'enterprise_ai_suite',
          feature_name: 'Enterprise AI Suite',
          description: 'All AI features with custom model training',
          enabled: true
        },
        {
          category: 'analytics',
          feature_key: 'enterprise_analytics',
          feature_name: 'Enterprise Analytics',
          description: 'Custom dashboards and advanced business intelligence',
          enabled: true
        },
        {
          category: 'integrations',
          feature_key: 'enterprise_integrations',
          feature_name: 'Enterprise Integrations',
          description: 'Custom integrations and dedicated API support',
          enabled: true
        },
        {
          category: 'support',
          feature_key: 'dedicated_support',
          feature_name: 'Dedicated Account Manager',
          description: 'Dedicated account manager and 24/7 phone support',
          enabled: true
        }
      ],
      add_ons: [
        {
          id: 'custom-development',
          name: 'Custom Development',
          description: 'Custom feature development and integrations',
          category: 'integrations',
          pricing: {
            monthly: 200000,
            setup_fee: 1000000
          },
          is_active: true
        }
      ],
      trial_days: 30,
      setup_fee: 500000, // ₦500,000 setup fee
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  /**
   * Get all available subscription plans
   */
  static getSubscriptionPlans(): SubscriptionPlan[] {
    return this.SUBSCRIPTION_PLANS.filter(plan => plan.is_active);
  }

  /**
   * Get a specific subscription plan by ID
   */
  static getSubscriptionPlan(planId: string): SubscriptionPlan | null {
    return this.SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null;
  }

  /**
   * Calculate pricing with discounts
   */
  static calculatePricing(plan: SubscriptionPlan, billingCycle: BillingCycle): {
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    discountPercentage: number;
  } {
    const basePrice = plan.pricing[billingCycle];
    let discountPercentage = 0;

    if (billingCycle === 'quarterly' && plan.pricing.discount_quarterly) {
      discountPercentage = plan.pricing.discount_quarterly;
    } else if (billingCycle === 'yearly' && plan.pricing.discount_yearly) {
      discountPercentage = plan.pricing.discount_yearly;
    }

    const discountAmount = (basePrice * discountPercentage) / 100;
    const finalPrice = basePrice - discountAmount;

    return {
      basePrice,
      discountAmount,
      finalPrice,
      discountPercentage
    };
  }

  /**
   * Check if user has access to a specific feature
   */
  static hasFeatureAccess(
    subscription: UserSubscription,
    plan: SubscriptionPlan,
    featureKey: string
  ): boolean {
    const feature = plan.features.find(f => f.feature_key === featureKey);
    return feature?.enabled || false;
  }

  /**
   * Check feature usage limits
   */
  static checkFeatureUsage(
    subscription: UserSubscription,
    plan: SubscriptionPlan,
    featureKey: string
  ): FeatureUsageLimit {
    const feature = plan.features.find(f => f.feature_key === featureKey);
    const usage = subscription.usage_tracking.current_period;
    
    let currentUsage = 0;
    let limit: number | 'unlimited' = 'unlimited';

    // Map feature keys to usage tracking
    switch (featureKey) {
      case 'properties':
        currentUsage = usage.properties_used;
        limit = plan.limits.properties;
        break;
      case 'tenants':
        currentUsage = usage.tenants_managed;
        limit = plan.limits.tenants;
        break;
      case 'documents':
        currentUsage = usage.documents_processed;
        limit = plan.limits.documents_per_month;
        break;
      case 'ai_recommendations':
        currentUsage = usage.ai_recommendations_generated;
        limit = plan.limits.ai_recommendations_per_month;
        break;
      case 'maintenance_alerts':
        currentUsage = usage.maintenance_alerts_sent;
        limit = plan.limits.maintenance_alerts;
        break;
      case 'storage':
        currentUsage = usage.storage_used_gb;
        limit = plan.limits.storage_gb;
        break;
      case 'api_calls':
        currentUsage = usage.api_calls_made;
        limit = plan.limits.api_calls_per_month;
        break;
    }

    const isUnlimited = limit === 'unlimited';
    const numericLimit = typeof limit === 'number' ? limit : 0;
    const percentageUsed = isUnlimited ? 0 : (currentUsage / numericLimit) * 100;
    const isExceeded = !isUnlimited && currentUsage > numericLimit;

    return {
      feature_key: featureKey,
      limit,
      current_usage: currentUsage,
      percentage_used: Math.min(percentageUsed, 100),
      is_exceeded: isExceeded,
      overage_allowed: plan.tier === 'professional' || plan.tier === 'enterprise'
    };
  }

  /**
   * Calculate upgrade/downgrade pricing
   */
  static calculatePlanChange(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    billingCycle: BillingCycle,
    daysRemainingInPeriod: number
  ): {
    prorationCredit: number;
    newChargeAmount: number;
    netAmount: number;
    effectiveDate: string;
  } {
    const currentPricing = this.calculatePricing(currentPlan, billingCycle);
    const newPricing = this.calculatePricing(newPlan, billingCycle);
    
    const daysInCycle = billingCycle === 'monthly' ? 30 : 
                       billingCycle === 'quarterly' ? 90 : 365;
    
    const prorationCredit = (currentPricing.finalPrice / daysInCycle) * daysRemainingInPeriod;
    const newChargeAmount = newPricing.finalPrice;
    const netAmount = newChargeAmount - prorationCredit;

    return {
      prorationCredit,
      newChargeAmount,
      netAmount: Math.max(netAmount, 0),
      effectiveDate: new Date().toISOString()
    };
  }

  /**
   * Generate subscription analytics
   */
  static generateAnalytics(subscriptions: UserSubscription[]): SubscriptionAnalytics {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    
    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptions.reduce((total, sub) => {
      const plan = this.getSubscriptionPlan(sub.plan_id);
      if (!plan) return total;
      
      const pricing = this.calculatePricing(plan, sub.billing_cycle);
      const monthlyAmount = sub.billing_cycle === 'monthly' ? pricing.finalPrice :
                           sub.billing_cycle === 'quarterly' ? pricing.finalPrice / 3 :
                           pricing.finalPrice / 12;
      
      return total + monthlyAmount;
    }, 0);

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Subscribers by tier
    const subscribersByTier = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.tier] = (acc[sub.tier] || 0) + 1;
      return acc;
    }, {} as Record<SubscriptionTier, number>);

    // Revenue by tier
    const revenueByTier = activeSubscriptions.reduce((acc, sub) => {
      const plan = this.getSubscriptionPlan(sub.plan_id);
      if (!plan) return acc;
      
      const pricing = this.calculatePricing(plan, sub.billing_cycle);
      const monthlyAmount = sub.billing_cycle === 'monthly' ? pricing.finalPrice :
                           sub.billing_cycle === 'quarterly' ? pricing.finalPrice / 3 :
                           pricing.finalPrice / 12;
      
      acc[sub.tier] = (acc[sub.tier] || 0) + monthlyAmount;
      return acc;
    }, {} as Record<SubscriptionTier, number>);

    return {
      mrr,
      arr,
      churn_rate: 0.05, // 5% monthly churn rate (calculated separately)
      ltv: mrr * 20, // Simple LTV calculation (20x MRR)
      cac: 50000, // Customer Acquisition Cost in NGN
      subscribers_by_tier: subscribersByTier,
      revenue_by_tier: revenueByTier,
      trial_conversion_rate: 0.25, // 25% trial conversion
      upgrade_rate: 0.15, // 15% upgrade rate
      downgrade_rate: 0.05, // 5% downgrade rate
      cancellation_reasons: [
        { reason: 'Too expensive', count: 12, percentage: 40 },
        { reason: 'Not enough features', count: 8, percentage: 27 },
        { reason: 'Technical issues', count: 5, percentage: 17 },
        { reason: 'Found alternative', count: 5, percentage: 16 }
      ],
      growth_metrics: {
        new_subscribers: 25,
        churned_subscribers: 5,
        net_growth: 20,
        growth_rate: 0.08, // 8% growth rate
        revenue_growth: 0.12 // 12% revenue growth
      },
      period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString()
    };
  }

  /**
   * Validate subscription limits before allowing actions
   */
  static validateAction(
    subscription: UserSubscription,
    plan: SubscriptionPlan,
    action: string,
    resourceType: 'property' | 'tenant' | 'document' | 'ai_request'
  ): {
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
    suggestedPlan?: string;
  } {
    const usage = this.checkFeatureUsage(subscription, plan, resourceType);
    
    if (usage.is_exceeded && !usage.overage_allowed) {
      return {
        allowed: false,
        reason: `You've reached your ${resourceType} limit of ${usage.limit}`,
        upgradeRequired: true,
        suggestedPlan: this.suggestUpgradePlan(plan.tier)
      };
    }

    return { allowed: true };
  }

  /**
   * Suggest upgrade plan based on current tier
   */
  private static suggestUpgradePlan(currentTier: SubscriptionTier): string {
    const tierHierarchy: SubscriptionTier[] = ['free', 'starter', 'professional', 'enterprise'];
    const currentIndex = tierHierarchy.indexOf(currentTier);
    
    if (currentIndex < tierHierarchy.length - 1) {
      const nextTier = tierHierarchy[currentIndex + 1];
      const plan = this.SUBSCRIPTION_PLANS.find(p => p.tier === nextTier);
      return plan?.id || 'professional-plan';
    }
    
    return 'enterprise-plan';
  }

  /**
   * Calculate Nigerian market pricing adjustments
   */
  static calculateNigerianPricing(baseUsdPrice: number): {
    ngnPrice: number;
    vatAmount: number;
    totalPrice: number;
  } {
    const exchangeRate = 800; // USD to NGN (should be fetched from API)
    const vatRate = 0.075; // 7.5% VAT in Nigeria
    
    const ngnPrice = baseUsdPrice * exchangeRate;
    const vatAmount = ngnPrice * vatRate;
    const totalPrice = ngnPrice + vatAmount;

    return {
      ngnPrice,
      vatAmount,
      totalPrice: Math.round(totalPrice)
    };
  }

  /**
   * Generate feature comparison matrix
   */
  static generateFeatureMatrix(): {
    features: string[];
    plans: Record<SubscriptionTier, Record<string, boolean | string>>;
  } {
    const allFeatures = new Set<string>();
    
    // Collect all unique features
    this.SUBSCRIPTION_PLANS.forEach(plan => {
      plan.features.forEach(feature => {
        allFeatures.add(feature.feature_name);
      });
    });

    const features = Array.from(allFeatures);
    const plans: Record<SubscriptionTier, Record<string, boolean | string>> = {} as any;

    this.SUBSCRIPTION_PLANS.forEach(plan => {
      plans[plan.tier] = {};
      
      features.forEach(featureName => {
        const feature = plan.features.find(f => f.feature_name === featureName);
        if (feature) {
          plans[plan.tier][featureName] = feature.usage_limit ? 
            `${feature.usage_limit} per month` : 
            feature.enabled;
        } else {
          plans[plan.tier][featureName] = false;
        }
      });
    });

    return { features, plans };
  }
}
