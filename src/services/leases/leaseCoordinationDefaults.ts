import { addDays } from 'date-fns';
import type { CoordinationTask } from '@/services/leases/leaseCoordinationTypes';

/**
 * Default onboarding / internal coordination tasks after a lease is executed (or activated).
 * Dates are relative to lease start when provided; otherwise from today.
 */
export function buildDefaultPostLeaseCoordinationTasks(
  leaseStartIso?: string | null
): CoordinationTask[] {
  const start = leaseStartIso ? new Date(leaseStartIso) : new Date();
  const due = (offsetDays: number) => addDays(start, offsetDays).toISOString();

  return [
    {
      id: 'task:listing_availability',
      key: 'listing_availability',
      title: 'Confirm listings and unit availability',
      description:
        'Ensure public listings and unit status match the new tenancy (automation may have run; verify manually).',
      owner_team: 'leasing',
      status: 'pending',
      sort_order: 10,
      due_at: due(0),
      completed_at: null,
    },
    {
      id: 'task:system_records',
      key: 'system_records',
      title: 'Reconcile system records',
      description:
        'Confirm property_tenants, lease_agreements, and internal CRM or accounting entries are aligned.',
      owner_team: 'operations',
      status: 'pending',
      sort_order: 20,
      due_at: due(1),
      completed_at: null,
    },
    {
      id: 'task:move_in_instructions',
      key: 'move_in_instructions',
      title: 'Send move-in instructions',
      description:
        'Share access rules, parking, waste, contacts, and timing with the tenant (email or in-app).',
      owner_team: 'leasing',
      status: 'pending',
      sort_order: 30,
      due_at: due(2),
      completed_at: null,
    },
    {
      id: 'task:keys_access',
      key: 'keys_access',
      title: 'Schedule keys / access handoff',
      description: 'Coordinate physical or digital access with security and the tenant.',
      owner_team: 'operations',
      status: 'pending',
      sort_order: 40,
      due_at: due(3),
      completed_at: null,
    },
    {
      id: 'task:deposit_accounting',
      key: 'deposit_accounting',
      title: 'Confirm deposit handling',
      description: 'Verify security deposit posting, receipts, and any statutory requirements.',
      owner_team: 'finance',
      status: 'pending',
      sort_order: 50,
      due_at: due(5),
      completed_at: null,
    },
    {
      id: 'task:utilities_meter',
      key: 'utilities_meter',
      title: 'Utilities / meter readings',
      description: 'Arrange transfer or opening readings if applicable.',
      owner_team: 'operations',
      status: 'pending',
      sort_order: 60,
      due_at: due(7),
      completed_at: null,
    },
  ];
}
