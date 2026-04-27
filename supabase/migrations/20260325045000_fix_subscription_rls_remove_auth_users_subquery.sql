-- Fix 403 on user_subscriptions + embedded subscription_plans.
-- Baseline policies used: auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin').
-- Authenticated clients cannot read auth.users, so policy evaluation fails → PostgREST 403.
-- Replace with public.is_admin(auth.uid()) (SECURITY DEFINER, reads user_roles).

begin;

-- -----------------------------------------------------------------
-- user_subscriptions
-- -----------------------------------------------------------------

drop policy if exists "Admins can view all subscriptions" on public.user_subscriptions;

create policy "Admins can view all subscriptions"
on public.user_subscriptions
as permissive
for select
to public
using (public.is_admin(auth.uid()));

-- Keep existing: "Users can view their own subscriptions", "System can create subscriptions", etc.

-- -----------------------------------------------------------------
-- subscription_plans
-- -----------------------------------------------------------------

drop policy if exists "Admins can manage subscription plans" on public.subscription_plans;

-- Split ALL into explicit admin-only commands (no auth.users scan).
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

-- Allow users to read the plan row linked to their subscription (embed / FK),
-- even if is_active was toggled off.
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

commit;
