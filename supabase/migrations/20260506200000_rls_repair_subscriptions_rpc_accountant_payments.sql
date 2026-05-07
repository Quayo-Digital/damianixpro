-- Repair common 403 causes from logs:
-- 1) user_subscriptions / subscription_plans admin policies still scanning auth.users (forbidden to anon/authenticated).
-- 2) expire_own_subscription_trials_if_due missing EXECUTE for authenticated.
-- 3) Accountant role has payments.read in app RBAC but rent_payments RLS only covered tenant/owner/admin.

begin;

-- ---------------------------------------------------------------------------
-- A) Subscriptions + plans (idempotent; same intent as 20260325045000)
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can view all subscriptions" on public.user_subscriptions;

create policy "Admins can view all subscriptions"
on public.user_subscriptions
as permissive
for select
to public
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage subscription plans" on public.subscription_plans;
drop policy if exists "Admins can select subscription plans" on public.subscription_plans;
drop policy if exists "Admins can insert subscription plans" on public.subscription_plans;
drop policy if exists "Admins can update subscription plans" on public.subscription_plans;
drop policy if exists "Admins can delete subscription plans" on public.subscription_plans;

create policy "Admins can select subscription plans"
on public.subscription_plans
as permissive
for select
to public
using (public.is_admin(auth.uid()));

create policy "Admins can insert subscription plans"
on public.subscription_plans
as permissive
for insert
to public
with check (public.is_admin(auth.uid()));

create policy "Admins can update subscription plans"
on public.subscription_plans
as permissive
for update
to public
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can delete subscription plans"
on public.subscription_plans
as permissive
for delete
to public
using (public.is_admin(auth.uid()));

drop policy if exists "Users can view their subscription plan" on public.subscription_plans;

create policy "Users can view their subscription plan"
on public.subscription_plans
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.user_subscriptions us
    where us.plan_id = subscription_plans.id
      and us.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- B) RPC: trial expiry (same intent as 20260416100000)
-- ---------------------------------------------------------------------------

do $g$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'expire_own_subscription_trials_if_due'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute 'revoke all on function public.expire_own_subscription_trials_if_due() from public';
    execute 'grant execute on function public.expire_own_subscription_trials_if_due() to authenticated';
    execute 'grant execute on function public.expire_own_subscription_trials_if_due() to service_role';
  end if;
end;
$g$;

-- ---------------------------------------------------------------------------
-- C) Accountant read on payment tables (aligns with rbac payments.read)
-- ---------------------------------------------------------------------------

drop policy if exists rent_payments_accountant_select on public.rent_payments;
create policy rent_payments_accountant_select
  on public.rent_payments for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'accountant'
    )
  );

do $p$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'payment_breakdowns'
  ) then
    execute 'drop policy if exists payment_breakdowns_accountant_select on public.payment_breakdowns';
    execute $sql$
      create policy payment_breakdowns_accountant_select
        on public.payment_breakdowns for select to authenticated
        using (
          exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.role = 'accountant'
          )
        )
    $sql$;
  end if;
end;
$p$;

commit;
