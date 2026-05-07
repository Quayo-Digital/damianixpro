-- Link manual accounting expenses to enterprise maintenance tickets (additive).

alter table public.accounting_expenses
  add column if not exists maintenance_ticket_id uuid references public.maintenance_tickets (id) on delete set null;

create index if not exists idx_accounting_expenses_maintenance_ticket
  on public.accounting_expenses (maintenance_ticket_id)
  where maintenance_ticket_id is not null;

comment on column public.accounting_expenses.maintenance_ticket_id is
  'Optional link to maintenance_tickets when this expense records work-order spend.';
