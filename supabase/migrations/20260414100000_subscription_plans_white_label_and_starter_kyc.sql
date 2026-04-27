-- Align DB subscription_plans with app tiers (subscriptionService + flutterwave-webhook VALID_TIERS).
-- 1) Seed white_label (was missing — webhook could not resolve plan UUID for that tier).
-- 2) Add nigerian_api_integrations to starter.features if absent (parity with TS catalog).

begin;

insert into public.subscription_plans (
  name,
  tier,
  description,
  tagline,
  popular,
  pricing,
  limits,
  features,
  trial_days,
  setup_fee,
  is_active
)
values
(
  'White Label',
  'white_label',
  'Custom branding, domain, and enterprise-grade isolation for large operators',
  'Your platform, your brand',
  false,
  '{"monthly": 350000, "quarterly": 945000, "yearly": 3570000, "currency": "NGN", "discount_quarterly": 10, "discount_yearly": 15}'::jsonb,
  '{"properties": "unlimited", "tenants": "unlimited", "documents_per_month": "unlimited", "ai_recommendations_per_month": "unlimited", "maintenance_alerts": "unlimited", "storage_gb": "unlimited", "api_calls_per_month": "unlimited", "team_members": "unlimited"}'::jsonb,
  '[
    {"category": "integrations", "feature_key": "white_label_branding", "feature_name": "Custom branding & domain", "description": "Branded web app, custom domain, and theme controls", "enabled": true},
    {"category": "integrations", "feature_key": "enterprise_integrations", "feature_name": "Enterprise integrations", "description": "Dedicated integration support and custom connectors", "enabled": true},
    {"category": "integrations", "feature_key": "nigerian_api_integrations", "feature_name": "Nigerian KYC & verification APIs", "description": "BVN, NIN, CAC, bank and phone verification via integrated providers", "enabled": true},
    {"category": "support", "feature_key": "dedicated_support", "feature_name": "Dedicated account team", "description": "Named contacts, SLA-backed support", "enabled": true}
  ]'::jsonb,
  14,
  250000,
  true
)
on conflict (tier) do nothing;

update public.subscription_plans
set
  features = coalesce(features, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'category',
      'integrations',
      'feature_key',
      'nigerian_api_integrations',
      'feature_name',
      'Nigerian KYC & verification APIs',
      'description',
      'BVN, NIN, CAC, bank and phone verification via integrated providers',
      'enabled',
      true
    )
  ),
  updated_at = now()
where
  tier = 'starter'
  and not exists (
    select
      1
    from
      jsonb_array_elements(coalesce(features, '[]'::jsonb)) as f
    where
      f ->> 'feature_key' = 'nigerian_api_integrations'
  );

commit;
