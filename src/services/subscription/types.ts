export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'incomplete' | 'cancelled' | 'past_due' | 'pending';
  paystack_plan_code?: string;
  paystack_subscription_code?: string;
  paystack_customer_code?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}
