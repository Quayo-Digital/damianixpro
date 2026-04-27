-- Align professional plan DB features with subscriptionService.ts (Nigerian KYC APIs on Professional).

begin;

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
  tier = 'professional'
  and not exists (
    select
      1
    from
      jsonb_array_elements(coalesce(features, '[]'::jsonb)) as f
    where
      f ->> 'feature_key' = 'nigerian_api_integrations'
  );

commit;
