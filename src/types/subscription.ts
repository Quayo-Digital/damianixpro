// Advanced Subscription Models and Monetization Types

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise' | 'white_label';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export type PaymentStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'trialing';

export type FeatureCategory =
  | 'properties'
  | 'tenants'
  | 'ai_features'
  | 'documents'
  | 'maintenance'
  | 'analytics'
  | 'support'
  | 'integrations';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  tagline?: string;
  popular?: boolean;
  pricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
    currency: 'NGN' | 'USD';
    discount_yearly?: number; // percentage
    discount_quarterly?: number; // percentage
  };
  limits: {
    properties: number | 'unlimited';
    tenants: number | 'unlimited';
    documents_per_month: number | 'unlimited';
    ai_recommendations_per_month: number | 'unlimited';
    maintenance_alerts: number | 'unlimited';
    storage_gb: number | 'unlimited';
    api_calls_per_month: number | 'unlimited';
    team_members: number | 'unlimited';
  };
  features: FeatureAccess[];
  add_ons?: AddOnOption[];
  trial_days?: number;
  setup_fee?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureAccess {
  category: FeatureCategory;
  feature_key: string;
  feature_name: string;
  description: string;
  enabled: boolean;
  usage_limit?: number;
  premium_only?: boolean;
}

export interface AddOnOption {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  pricing: {
    monthly: number;
    setup_fee?: number;
  };
  limits?: {
    [key: string]: number | 'unlimited';
  };
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  tier: SubscriptionTier;
  status: PaymentStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  paystack_subscription_code?: string;
  paystack_customer_code?: string;
  add_ons: SubscriptionAddOn[];
  usage_tracking: UsageTracking;
  billing_address?: BillingAddress;
  payment_method?: PaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionAddOn {
  add_on_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: string;
}

export interface UsageTracking {
  current_period: {
    properties_used: number;
    tenants_managed: number;
    documents_processed: number;
    ai_recommendations_generated: number;
    maintenance_alerts_sent: number;
    storage_used_gb: number;
    api_calls_made: number;
  };
  historical: UsageHistory[];
  last_updated: string;
}

export interface UsageHistory {
  period_start: string;
  period_end: string;
  usage_data: Record<string, number>;
  overage_charges?: OverageCharge[];
}

export interface OverageCharge {
  feature: string;
  overage_amount: number;
  unit_price: number;
  total_charge: number;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface PaymentMethod {
  type: 'card' | 'bank_transfer' | 'mobile_money';
  last_four?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  bank_name?: string;
  account_number_last_four?: string;
  mobile_money_provider?: 'mtn' | 'airtel' | 'glo' | '9mobile';
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string;
  invoice_number: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  due_date: string;
  paid_at?: string;
  line_items: InvoiceLineItem[];
  tax_amount?: number;
  discount_amount?: number;
  stripe_invoice_id?: string;
  paystack_invoice_code?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  period_start?: string;
  period_end?: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  invoice_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  gateway: 'stripe' | 'paystack';
  gateway_transaction_id: string;
  gateway_reference?: string;
  failure_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionAnalytics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churn_rate: number;
  ltv: number; // Customer Lifetime Value
  cac: number; // Customer Acquisition Cost
  subscribers_by_tier: Record<SubscriptionTier, number>;
  revenue_by_tier: Record<SubscriptionTier, number>;
  trial_conversion_rate: number;
  upgrade_rate: number;
  downgrade_rate: number;
  cancellation_reasons: CancellationReason[];
  growth_metrics: GrowthMetrics;
  period_start: string;
  period_end: string;
}

export interface CancellationReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface GrowthMetrics {
  new_subscribers: number;
  churned_subscribers: number;
  net_growth: number;
  growth_rate: number;
  revenue_growth: number;
}

export interface FeatureUsageLimit {
  feature_key: string;
  limit: number | 'unlimited';
  current_usage: number;
  percentage_used: number;
  is_exceeded: boolean;
  overage_allowed: boolean;
  overage_rate?: number;
}

export interface SubscriptionEvent {
  id: string;
  user_id: string;
  subscription_id: string;
  event_type:
    | 'subscription_created'
    | 'subscription_updated'
    | 'subscription_canceled'
    | 'subscription_reactivated'
    | 'trial_started'
    | 'trial_ended'
    | 'payment_succeeded'
    | 'payment_failed'
    | 'invoice_created'
    | 'invoice_paid'
    | 'plan_upgraded'
    | 'plan_downgraded'
    | 'add_on_added'
    | 'add_on_removed'
    | 'usage_limit_exceeded';
  event_data: Record<string, any>;
  created_at: string;
}

export interface WhiteLabelConfig {
  id: string;
  user_id: string;
  subscription_id: string;
  brand_name: string;
  domain: string;
  custom_domain?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  custom_css?: string;
  email_templates: EmailTemplate[];
  features_enabled: string[];
  api_access: {
    enabled: boolean;
    rate_limit: number;
    webhook_url?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  template_type: 'welcome' | 'invoice' | 'payment_failed' | 'subscription_ended';
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
}

export interface PricingExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variants: PricingVariant[];
  traffic_allocation: number; // percentage
  success_metrics: string[];
  start_date: string;
  end_date?: string;
  results?: ExperimentResults;
  created_at: string;
  updated_at: string;
}

export interface PricingVariant {
  id: string;
  name: string;
  pricing_changes: Record<string, number>;
  feature_changes: Record<string, boolean>;
  traffic_percentage: number;
}

export interface ExperimentResults {
  conversion_rates: Record<string, number>;
  revenue_impact: number;
  statistical_significance: number;
  winner_variant?: string;
  insights: string[];
}

// API Response Types
export interface SubscriptionResponse {
  subscription: UserSubscription;
  plan: SubscriptionPlan;
  usage: UsageTracking;
  upcoming_invoice?: Invoice;
}

export interface BillingPortalSession {
  url: string;
  expires_at: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  expires_at: string;
  plan_id: string;
  billing_cycle: BillingCycle;
  trial_days?: number;
}

// Utility Types
export interface SubscriptionFilters {
  tiers?: SubscriptionTier[];
  statuses?: PaymentStatus[];
  billing_cycles?: BillingCycle[];
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface SubscriptionSortOptions {
  field: 'created_at' | 'amount' | 'tier' | 'status' | 'next_billing_date';
  direction: 'asc' | 'desc';
}

// Nigerian Market Specific Types
export interface NigerianPricingConfig {
  exchange_rate_usd_to_ngn: number;
  local_payment_methods: {
    bank_transfer: boolean;
    ussd: boolean;
    mobile_money: boolean;
    pos: boolean;
  };
  tax_rates: {
    vat: number;
    withholding_tax?: number;
  };
  compliance_requirements: {
    business_registration: boolean;
    tax_identification: boolean;
    bank_verification: boolean;
  };
}

export interface MarketSegmentation {
  segment:
    | 'individual_landlord'
    | 'property_management_company'
    | 'real_estate_developer'
    | 'government_agency';
  pricing_multiplier: number;
  features_included: string[];
  support_level: 'basic' | 'priority' | 'dedicated';
  onboarding_type: 'self_service' | 'assisted' | 'white_glove';
}
