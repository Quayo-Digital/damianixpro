begin;

-- ---------------------------------------------------------------------------
-- Hot-path compound indexes (safe / idempotent)
-- ---------------------------------------------------------------------------

-- Executive analytics + dashboards frequently filter by status and payment_date together.
create index if not exists idx_rent_payments_status_payment_date
  on public.rent_payments (status, payment_date);

-- Owner/agent dashboards often filter property_tenants by property_id and status.
create index if not exists idx_property_tenants_property_status
  on public.property_tenants (property_id, status);

-- Properties list often orders by created_at after filtering by owner/agent.
create index if not exists idx_properties_owner_created_at
  on public.properties (owner_id, created_at desc);

create index if not exists idx_properties_agent_created_at
  on public.properties (agent_id, created_at desc);

commit;

