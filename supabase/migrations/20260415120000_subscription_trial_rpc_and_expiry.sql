-- App-owned trials (Option A): trialing + trial_start/trial_end, expiry job, single active-or-trial row per user.

begin;

-- At most one subscription row in an "entitled" state (active or trialing) per user.
drop index if exists public.idx_user_subscriptions_one_active_per_user;

create unique index if not exists uq_user_subscriptions_one_active_or_trialing on public.user_subscriptions (user_id)
  where status in ('active', 'trialing');

-- Expire the current user's trial rows when past trial_end (safe for any authenticated user).
create or replace function public.expire_own_subscription_trials_if_due()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
begin
  if auth.uid() is null then
    return 0;
  end if;

  update public.user_subscriptions us
  set
    status = 'canceled',
    canceled_at = coalesce(us.canceled_at, now()),
    updated_at = now()
  where us.user_id = auth.uid()
    and us.status = 'trialing'
    and us.trial_end is not null
    and us.trial_end < now();

  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.expire_own_subscription_trials_if_due() is
  'Sets trialing subscriptions to canceled when trial_end is in the past (current user only). Call from client on load; pair with expire_all + pg_cron for reliability.';

revoke all on function public.expire_own_subscription_trials_if_due() from public;
grant execute on function public.expire_own_subscription_trials_if_due() to authenticated;
grant execute on function public.expire_own_subscription_trials_if_due() to service_role;

-- Maintenance: expire all users'' past trials (run from SQL editor, pg_cron, or automation).
create or replace function public.expire_all_subscription_trials_if_due()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
begin
  update public.user_subscriptions
  set
    status = 'canceled',
    canceled_at = coalesce(canceled_at, now()),
    updated_at = now()
  where status = 'trialing'
    and trial_end is not null
    and trial_end < now();

  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.expire_all_subscription_trials_if_due() is
  'Expires every past-due trialing row. Schedule via pg_cron, e.g. */15 * * * * SELECT public.expire_all_subscription_trials_if_due();';

revoke all on function public.expire_all_subscription_trials_if_due() from public;
grant execute on function public.expire_all_subscription_trials_if_due() to service_role;

-- Start a time-boxed trial from subscription_plans.trial_days (owners and platform admins only).
create or replace function public.start_subscription_trial(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan record;
  v_trial_days int;
  v_start timestamptz := now();
  v_end timestamptz;
  v_existing int;
  v_id uuid;
  v_usage jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin(v_uid) then
    if not exists (
      select 1 from public.user_roles ur
      where ur.user_id = v_uid and ur.role = 'owner'
    ) then
      raise exception 'Only property owners (or admins) can start a subscription trial';
    end if;
  end if;

  select id, tier, trial_days
  into v_plan
  from public.subscription_plans
  where id = p_plan_id
    and (is_active is null or is_active = true);

  if not found then
    raise exception 'Plan not found or inactive';
  end if;

  v_trial_days := coalesce(v_plan.trial_days, 0);
  if v_trial_days <= 0 then
    raise exception 'This plan does not offer a trial period';
  end if;

  select count(*)::int into v_existing
  from public.user_subscriptions us
  where us.user_id = v_uid
    and us.status in ('active', 'trialing');

  if v_existing > 0 then
    raise exception 'You already have an active subscription or trial';
  end if;

  v_end := v_start + make_interval(days => v_trial_days);

  v_usage := jsonb_build_object(
    'current_period', jsonb_build_object(
      'properties_used', 0,
      'tenants_managed', 0,
      'documents_processed', 0,
      'ai_recommendations_generated', 0,
      'maintenance_alerts_sent', 0,
      'storage_used_gb', 0,
      'api_calls_made', 0
    ),
    'historical', '[]'::jsonb,
    'last_updated', to_jsonb(v_start)
  );

  insert into public.user_subscriptions (
    user_id,
    plan_id,
    tier,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end,
    cancel_at_period_end,
    canceled_at,
    usage_tracking,
    created_at,
    updated_at
  ) values (
    v_uid,
    v_plan.id,
    v_plan.tier,
    'trialing',
    'monthly',
    v_start,
    v_end,
    v_start,
    v_end,
    false,
    null,
    v_usage,
    v_start,
    v_start
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.start_subscription_trial(uuid) is
  'Creates a user_subscriptions row with status trialing and trial_end = now + plan.trial_days.';

revoke all on function public.start_subscription_trial(uuid) from public;
grant execute on function public.start_subscription_trial(uuid) to authenticated;
grant execute on function public.start_subscription_trial(uuid) to service_role;

commit;

-- Optional (Supabase): enable pg_cron in Dashboard, then:
-- select cron.schedule(
--   'expire-subscription-trials',
--   '*/15 * * * *',
--   $$select public.expire_all_subscription_trials_if_due()$$
-- );
