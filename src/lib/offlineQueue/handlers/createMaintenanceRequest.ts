import { supabase } from '@/integrations/supabase/client';
import { OfflineQueueFatalError, type OfflineQueueHandler } from '../types';

export interface CreateMaintenanceRequestPayload {
  /** Idempotency key. The DB has a UNIQUE partial index on this column. */
  client_request_id: string;
  user_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending';
  image_url: string | null;
  property_id: string | null;
  property_name: string | null;
  tenant_name: string | null;
  category: 'maintenance';
}

/**
 * Inserts a maintenance request, treating a unique-violation on the
 * `client_request_id` as success (because the row already exists from a prior
 * attempt whose response was lost).
 */
async function insertMaintenanceRequest(payload: CreateMaintenanceRequestPayload): Promise<void> {
  const { error } = await supabase.from('maintenance_requests').insert([
    {
      ...payload,
      updates: [],
    },
  ]);

  if (!error) return;

  const code = (error as { code?: string | null }).code ?? '';
  // 23505 = unique_violation. The row from a previous attempt is already there.
  if (code === '23505') return;

  // Class 23 (integrity), 42 (syntax/missing column) → not retryable.
  if (/^(23|42)/.test(code)) {
    throw new OfflineQueueFatalError(
      `Maintenance request rejected by server: ${error.message}`,
      error
    );
  }

  // Anything else (network, 5xx, RLS misconfig) → bubble up so the queue retries.
  throw error;
}

export const createMaintenanceRequestHandler: OfflineQueueHandler<CreateMaintenanceRequestPayload> =
  {
    name: 'create-maintenance-request',
    label: (payload) => payload.title || 'New maintenance request',
    execute: insertMaintenanceRequest,
  };
