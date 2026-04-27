import { supabase } from '@/integrations/supabase/client';
import {
  enrichRowsWithPropertiesAndTenants,
  fetchLeaseRows,
  isLikelyActiveLeaseStatus,
} from '@/services/leases/enrichLeaseAgreements';
import { toast } from '@/components/ui/sonner';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

export type LeaseEndOption = 'renew' | 'terminate' | 'evict';

export interface LeaseAction {
  id: string;
  lease_id: string;
  tenant_id: string;
  property_id: string;
  action_type: LeaseEndOption;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  effective_date: string | null;
  initiated_by: 'tenant' | 'owner' | 'system';
  new_monthly_rent?: number | null;
  new_end_date?: string | null;
  renewal_term_months?: number | null;
}

/**
 * Initiates a lease action (renew, terminate, evict)
 */
export const initiateLeaseAction = async (
  leaseId: string,
  tenantId: string,
  propertyId: string,
  actionType: LeaseEndOption,
  reason: string | null,
  initiatedBy: 'tenant' | 'owner',
  effectiveDate: string | null,
  additionalData?: {
    newMonthlyRent?: number;
    newEndDate?: string;
    renewalTermMonths?: number;
  }
): Promise<{ success: boolean; actionId?: string; error?: string }> => {
  try {
    // Insert into the lease_actions table
    const { data, error } = await supabase
      .from('lease_actions')
      .insert({
        lease_id: leaseId,
        tenant_id: tenantId,
        property_id: propertyId,
        action_type: actionType,
        reason,
        status: 'pending',
        initiated_by: initiatedBy,
        effective_date: effectiveDate,
        new_monthly_rent: additionalData?.newMonthlyRent || null,
        new_end_date: additionalData?.newEndDate || null,
        renewal_term_months: additionalData?.renewalTermMonths || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    let toastMessage = '';

    switch (actionType) {
      case 'renew':
        toastMessage = 'Lease renewal request submitted successfully';
        break;
      case 'terminate':
        toastMessage = 'Lease termination request submitted successfully';
        break;
      case 'evict':
        toastMessage = 'Eviction process initiated';
        break;
    }

    toast.success(toastMessage);

    return { success: true, actionId: data.id };
  } catch (error) {
    console.error(`Error initiating ${actionType}:`, error);
    toast.error(`Failed to initiate ${actionType}`);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Updates the status of a lease action
 */
export const updateLeaseActionStatus = async (
  actionId: string,
  status: 'approved' | 'rejected' | 'completed'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lease_actions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId);

    if (error) throw error;

    toast.success(`Lease action ${status}`);
    return true;
  } catch (error) {
    console.error(`Error updating lease action status:`, error);
    toast.error('Failed to update lease action status');
    return false;
  }
};

/**
 * Gets all lease actions for a tenant or property owner
 */
export const getLeaseActions = async (options: {
  tenantId?: string;
  propertyId?: string;
  leaseId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
}): Promise<LeaseAction[]> => {
  try {
    let query = supabase.from('lease_actions').select('*');

    if (options.tenantId) {
      query = query.eq('tenant_id', options.tenantId);
    }

    if (options.propertyId) {
      query = query.eq('property_id', options.propertyId);
    }

    if (options.leaseId) {
      query = query.eq('lease_id', options.leaseId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Order by creation date, newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    const rows = data || [];
    const enriched =
      rows.length > 0
        ? await enrichRowsWithPropertiesAndTenants(rows, {
            propertyColumns: 'id, name',
            tenantColumns: 'id, first_name, last_name',
          })
        : [];

    // Type assertion to ensure Supabase returns match our LeaseAction interface
    return enriched.map((item) => ({
      ...item,
      action_type: item.action_type as LeaseEndOption,
      initiated_by: item.initiated_by as 'tenant' | 'owner' | 'system',
      status: item.status as 'pending' | 'approved' | 'rejected' | 'completed',
    }));
  } catch (error) {
    console.error('Error getting lease actions:', error);
    return [];
  }
};

/**
 * Gets a tenant's active lease information
 */
export const getActiveLease = async (tenantId: string): Promise<any | null> => {
  try {
    const { rows } = await fetchLeaseRows({ tenantId });
    const active = rows.find((r) => isLikelyActiveLeaseStatus(r.status));
    if (!active) return null;

    const [enriched] = await enrichRowsWithPropertiesAndTenants([active], {
      propertyColumns: 'id, name, address',
      tenantColumns: 'id, first_name, last_name',
    });
    return enriched ?? active;
  } catch (error) {
    console.error('Error getting active lease:', error);
    return null;
  }
};
