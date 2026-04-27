import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import {
  enrichRowsWithPropertiesAndTenants,
  fetchLeaseRows,
} from '@/services/leases/enrichLeaseAgreements';
import {
  fetchTenantLeaseFromApprovedApplication,
  fetchTenantLeaseFromPropertyTenants,
  mapLeaseLikeRowToTenantLease,
} from '@/services/leases/tenantLeaseFromDb';
import { logger } from '@/utils/logger';
import {
  isMissingSupabaseRelationError,
  isPropertyTenantsRelationMissing,
  markPropertyTenantsRelationMissing,
} from '@/utils/supabaseErrors';
import { mapRentRowToPaymentUi, type RentPaymentRow } from '@/services/payments/rentPaymentCompat';
import { annualRentNgn } from '@/utils/nigeriaRent';
import { finalizeTenantLeaseForUi } from '@/services/leases/tenantLeasePresentation';

// Enhanced Tenant Data Interfaces
export interface TenantProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  occupation?: string;
  employer?: string;
  monthly_income?: number;
  status: 'active' | 'inactive' | 'pending' | 'terminated';
  move_in_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantLease {
  id: string;
  tenant_id: string;
  property_id: string;
  property_title: string;
  property_address: string;
  property_type: string;
  start_date: string;
  end_date: string;
  /** Stored monthly equivalent when the DB uses split rent (NGN). */
  monthly_rent: number;
  /** Annual rent total when available (e.g. `properties.lease_price`); else derived from monthly × 12. */
  lease_price?: number;
  security_deposit: number;
  lease_status: 'active' | 'expired' | 'terminated' | 'pending_renewal' | 'pending_payment';
  auto_renewal: boolean;
  rent_due_date: number; // Day of month
  late_fee_amount: number;
  grace_period_days: number;
  lease_document_url?: string;
  special_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantPayment {
  id: string;
  tenant_id: string;
  lease_id: string;
  amount: number;
  payment_type: 'rent' | 'deposit' | 'late_fee' | 'utility' | 'maintenance' | 'other';
  payment_method: 'bank_transfer' | 'card' | 'cash' | 'cheque' | 'mobile_money';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date: string;
  due_date: string;
  reference_number: string;
  description: string;
  receipt_url?: string;
  late_fee_applied: number;
  created_at: string;
  updated_at: string;
}

export interface TenantMaintenanceRequest {
  id: string;
  tenant_id: string;
  property_id: string;
  title: string;
  description: string;
  category:
    | 'plumbing'
    | 'electrical'
    | 'hvac'
    | 'appliances'
    | 'structural'
    | 'pest_control'
    | 'cleaning'
    | 'security'
    | 'other';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  submitted_date: string;
  scheduled_date?: string;
  completed_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
  vendor_assigned?: string;
  tenant_satisfaction?: number;
  photos?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantDocument {
  id: string;
  tenant_id: string;
  document_type: 'lease' | 'receipt' | 'notice' | 'insurance' | 'inspection' | 'other';
  title: string;
  description?: string;
  file_url: string;
  file_size: number;
  file_type: string;
  is_important: boolean;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantNotification {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: 'payment_reminder' | 'lease_expiry' | 'maintenance_update' | 'general' | 'emergency';
  priority: 'low' | 'medium' | 'high';
  read_status: boolean;
  action_required: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

export interface TenantStats {
  totalPayments: number;
  totalAmountPaid: number;
  onTimePayments: number;
  latePayments: number;
  onTimePaymentRate: number;
  averagePaymentDelay: number;
  outstandingBalance: number;
  nextPaymentDue: string;
  nextPaymentAmount: number;
  daysUntilLeaseExpiry: number;
  maintenanceRequestsSubmitted: number;
  maintenanceRequestsCompleted: number;
  averageMaintenanceResponseTime: number;
  tenantSatisfactionScore: number;
  monthsAsResident: number;
  totalLateFees: number;
}

export interface TenantAnalytics {
  paymentHistory: {
    monthlyPayments: Array<{
      month: string;
      amount: number;
      onTime: boolean;
      lateFee: number;
    }>;
    paymentTrends: {
      averageMonthlyPayment: number;
      paymentConsistency: number;
      preferredPaymentMethod: string;
      totalPaidYTD: number;
      totalPaidAllTime: number;
    };
  };
  leaseMetrics: {
    leaseUtilization: number;
    renewalProbability: number;
    satisfactionTrend: Array<{
      month: string;
      score: number;
    }>;
    complianceScore: number;
  };
  maintenanceMetrics: {
    requestFrequency: number;
    averageResolutionTime: number;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      averageCost: number;
    }>;
    satisfactionByCategory: Array<{
      category: string;
      satisfaction: number;
    }>;
  };
  financialSummary: {
    totalHousingCost: number;
    housingCostPercentage: number;
    savingsFromOnTimePayments: number;
    projectedAnnualCost: number;
  };
}

/** Modal `payment_method` among completed payments (`paymentsData` is newest-first; ties → most recent). */
function preferredPaymentMethodFromCompleted(completedPayments: TenantPayment[]): string {
  if (completedPayments.length === 0) return 'none';
  const counts = new Map<TenantPayment['payment_method'], number>();
  for (const p of completedPayments) {
    const m = p.payment_method;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  const maxCount = Math.max(...counts.values());
  const tied = [...counts.entries()].filter(([, c]) => c === maxCount).map(([m]) => m);
  if (tied.length === 1) return tied[0];
  for (const p of completedPayments) {
    if (tied.includes(p.payment_method)) return p.payment_method;
  }
  return tied[0]!;
}

export function useEnhancedTenantData() {
  const { user } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for all tenant data
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  /** `tenants.id` for payment APIs (distinct from auth user id). */
  const [tenantRecordId, setTenantRecordId] = useState<string | null>(null);
  const [lease, setLease] = useState<TenantLease | null>(null);
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<TenantMaintenanceRequest[]>([]);
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null);

  // Production tenant data with existing database schema
  const mockProfile: TenantProfile = {
    id: 'current-tenant',
    user_id: 'current-user',
    first_name: 'Current',
    last_name: 'Tenant',
    email: 'tenant@example.com',
    phone: '+234 803 000 0000',
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: '+234 807 000 0000',
    occupation: 'Professional',
    employer: 'Current Employer',
    monthly_income: 8500000,
    status: 'active',
    move_in_date: '2023-03-01T00:00:00Z',
    created_at: '2023-03-01T10:00:00Z',
    updated_at: '2024-08-08T12:00:00Z',
  };

  const mockLease: TenantLease = {
    id: 'current-lease',
    tenant_id: 'current-tenant',
    property_id: 'current-property',
    property_title: 'Current Property',
    property_address: 'Current Property Address',
    property_type: 'apartment',
    start_date: '2023-03-01T00:00:00Z',
    end_date: '2025-02-28T00:00:00Z',
    monthly_rent: 2800000,
    lease_price: 2800000 * 12,
    security_deposit: 5600000,
    lease_status: 'active',
    auto_renewal: true,
    rent_due_date: 1,
    late_fee_amount: 140000,
    grace_period_days: 5,
    lease_document_url: '/documents/lease-agreement.pdf',
    special_terms: 'Standard lease terms apply',
    created_at: '2023-02-15T10:00:00Z',
    updated_at: '2024-08-08T12:00:00Z',
  };

  const mockPayments: TenantPayment[] = [
    {
      id: 'payment-record',
      tenant_id: 'current-tenant',
      lease_id: 'current-lease',
      amount: 2800000,
      payment_type: 'rent',
      payment_method: 'bank_transfer',
      payment_status: 'completed',
      payment_date: '2024-08-01T09:30:00Z',
      due_date: '2024-08-01T00:00:00Z',
      reference_number: 'PAYMENT-REF',
      description: 'Annual rent payment',
      receipt_url: '/receipts/payment-receipt.pdf',
      late_fee_applied: 0,
      created_at: '2024-08-01T09:30:00Z',
      updated_at: '2024-08-01T09:30:00Z',
    },
  ];

  const mockMaintenanceRequests: TenantMaintenanceRequest[] = [
    {
      id: 'maintenance-request',
      tenant_id: 'current-tenant',
      property_id: 'current-property',
      title: 'Maintenance Request',
      description: 'Maintenance issue reported by tenant.',
      category: 'plumbing',
      priority: 'medium',
      status: 'completed',
      submitted_date: '2024-07-15T10:30:00Z',
      scheduled_date: '2024-07-17T14:00:00Z',
      completed_date: '2024-07-17T16:30:00Z',
      estimated_cost: 85000,
      actual_cost: 75000,
      vendor_assigned: 'Maintenance Vendor',
      tenant_satisfaction: 5,
      photos: ['/maintenance/before-photo.jpg', '/maintenance/after-photo.jpg'],
      notes: 'Maintenance completed successfully.',
      created_at: '2024-07-15T10:30:00Z',
      updated_at: '2024-07-17T16:30:00Z',
    },
  ];

  const calculateStats = (
    profileData: TenantProfile,
    leaseData: TenantLease | null,
    paymentsData: TenantPayment[],
    maintenanceData: TenantMaintenanceRequest[]
  ): TenantStats => {
    const completedPayments = paymentsData.filter((p) => p.payment_status === 'completed');
    const onTimePayments = completedPayments.filter(
      (p) => new Date(p.payment_date) <= new Date(p.due_date)
    );

    const totalAmountPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalLateFees = completedPayments.reduce((sum, p) => sum + p.late_fee_applied, 0);

    const moveInDate = new Date(profileData.move_in_date || profileData.created_at);
    const monthsAsResident = Math.floor(
      (Date.now() - moveInDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    const leaseEndDate = leaseData?.end_date ? new Date(leaseData.end_date) : null;
    const daysUntilLeaseExpiry = leaseEndDate
      ? Math.ceil((leaseEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    const completedMaintenance = maintenanceData.filter((m) => m.status === 'completed');
    const avgSatisfaction =
      completedMaintenance.length > 0
        ? completedMaintenance.reduce((sum, m) => sum + (m.tenant_satisfaction || 0), 0) /
          completedMaintenance.length
        : 0;

    return {
      totalPayments: completedPayments.length,
      totalAmountPaid,
      onTimePayments: onTimePayments.length,
      latePayments: completedPayments.length - onTimePayments.length,
      onTimePaymentRate:
        completedPayments.length > 0 ? (onTimePayments.length / completedPayments.length) * 100 : 0,
      averagePaymentDelay:
        completedPayments.length > 0
          ? completedPayments.reduce((sum, p) => {
              const paymentDate = new Date(p.payment_date);
              const dueDate = new Date(p.due_date);
              const delay = Math.max(
                0,
                Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
              );
              return sum + delay;
            }, 0) / completedPayments.length
          : 0,
      outstandingBalance: paymentsData
        .filter((p) => p.payment_status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      nextPaymentDue: (() => {
        // Find the next pending payment due date
        const pendingPayments = paymentsData
          .filter((p) => p.payment_status === 'pending')
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        if (pendingPayments.length > 0) {
          return pendingPayments[0].due_date;
        }

        // If no pending payments, calculate next due date from lease
        if (leaseData?.rent_due_date && leaseData?.start_date) {
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();
          const rentDueDay = leaseData.rent_due_date;

          // Create next payment date
          let nextDueDate = new Date(currentYear, currentMonth, rentDueDay);

          // If the due date has passed this month, move to next month
          if (nextDueDate < today) {
            nextDueDate = new Date(currentYear, currentMonth + 1, rentDueDay);
          }

          return nextDueDate.toISOString();
        }

        // Fallback: 30 days from now
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 30);
        return fallbackDate.toISOString();
      })(),
      nextPaymentAmount: (() => {
        // Find the next pending payment amount
        const pendingPayments = paymentsData
          .filter(
            (p) =>
              p.payment_status === 'pending' &&
              Number.isFinite(Number(p.amount)) &&
              Number(p.amount) > 0
          )
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        if (pendingPayments.length > 0) {
          return Number(pendingPayments[0].amount);
        }

        // Nigeria: headline rent is annual
        return leaseData ? annualRentNgn(leaseData) : 0;
      })(),
      daysUntilLeaseExpiry,
      maintenanceRequestsSubmitted: maintenanceData.length,
      maintenanceRequestsCompleted: completedMaintenance.length,
      averageMaintenanceResponseTime:
        completedMaintenance.length > 0
          ? completedMaintenance.reduce((sum, m) => {
              if (m.submitted_date && m.scheduled_date) {
                const submitted = new Date(m.submitted_date);
                const scheduled = new Date(m.scheduled_date);
                const responseTime = Math.ceil(
                  (scheduled.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
                );
                return sum + responseTime;
              }
              return sum;
            }, 0) / completedMaintenance.length
          : 0,
      tenantSatisfactionScore: avgSatisfaction,
      monthsAsResident,
      totalLateFees,
    };
  };

  const calculateAnalytics = (
    profileData: TenantProfile,
    leaseData: TenantLease | null,
    paymentsData: TenantPayment[],
    maintenanceData: TenantMaintenanceRequest[]
  ): TenantAnalytics => {
    const completedPayments = paymentsData.filter((p) => p.payment_status === 'completed');
    const onTimePayments = completedPayments.filter(
      (p) => new Date(p.payment_date) <= new Date(p.due_date)
    );

    return {
      paymentHistory: {
        monthlyPayments: completedPayments.slice(0, 6).map((p) => ({
          month: new Date(p.payment_date).toISOString().slice(0, 7),
          amount: p.amount,
          onTime: new Date(p.payment_date) <= new Date(p.due_date),
          lateFee: p.late_fee_applied,
        })),
        paymentTrends: {
          averageMonthlyPayment:
            completedPayments.length > 0
              ? completedPayments.reduce((sum, p) => sum + p.amount, 0) / completedPayments.length
              : 0,
          paymentConsistency:
            completedPayments.length > 0
              ? (onTimePayments.length / completedPayments.length) * 100
              : 0,
          preferredPaymentMethod: preferredPaymentMethodFromCompleted(completedPayments),
          totalPaidYTD: completedPayments
            .filter((p) => new Date(p.payment_date).getFullYear() === new Date().getFullYear())
            .reduce((sum, p) => sum + p.amount, 0),
          totalPaidAllTime: completedPayments.reduce((sum, p) => sum + p.amount, 0),
        },
      },
      leaseMetrics: {
        leaseUtilization: leaseData?.lease_status === 'active' ? 100 : 0,
        renewalProbability:
          completedPayments.length > 0 && onTimePayments.length / completedPayments.length > 0.8
            ? 85
            : 65,
        satisfactionTrend: maintenanceData
          .filter((m) => m.status === 'completed')
          .slice(0, 5)
          .map((m) => ({
            month: new Date(m.completed_date || m.created_at).toISOString().slice(0, 7),
            score: m.tenant_satisfaction || 0,
          })),
        complianceScore:
          completedPayments.length > 0
            ? (onTimePayments.length / completedPayments.length) * 100
            : 100,
      },
      maintenanceMetrics: {
        requestFrequency: maintenanceData.length,
        averageResolutionTime:
          maintenanceData.filter((m) => m.status === 'completed').length > 0
            ? maintenanceData
                .filter((m) => m.status === 'completed')
                .reduce((sum, m) => {
                  if (m.submitted_date && m.completed_date) {
                    const submitted = new Date(m.submitted_date);
                    const completed = new Date(m.completed_date);
                    return (
                      sum +
                      Math.ceil((completed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
                    );
                  }
                  return sum;
                }, 0) / maintenanceData.filter((m) => m.status === 'completed').length
            : 0,
        categoryBreakdown: [],
        satisfactionByCategory: [],
      },
      financialSummary: {
        totalHousingCost: leaseData ? annualRentNgn(leaseData) : 0,
        housingCostPercentage:
          profileData.monthly_income && leaseData?.monthly_rent
            ? (leaseData.monthly_rent / profileData.monthly_income) * 100
            : 0,
        savingsFromOnTimePayments: onTimePayments.length * (leaseData?.late_fee_amount || 0),
        projectedAnnualCost: leaseData ? annualRentNgn(leaseData) : 0,
      },
    };
  };

  useEffect(() => {
    const fetchTenantData = async () => {
      if (!user?.id) {
        setTenantRecordId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch real user profile data (use maybeSingle to handle missing profile gracefully)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Error fetching profile:', profileError);
        }

        // Create personalized profile using real user data with multiple fallbacks
        // Split name into first_name and last_name for TenantProfile interface
        const fullName =
          profileData?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Tenant';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'Tenant';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        const realProfile: TenantProfile = {
          id: user.id,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email || '',
          phone: profileData?.phone || user.user_metadata?.phone || '',
          emergency_contact_name: profileData?.emergency_contact_name || '',
          emergency_contact_phone: profileData?.emergency_contact_phone || '',
          monthly_income: 0,
          status: 'active',
          move_in_date: new Date().toISOString(),
          created_at: profileData?.created_at || new Date().toISOString(),
          updated_at: profileData?.updated_at || new Date().toISOString(),
        };

        // Always use real profile data
        setProfile(realProfile);

        // First, get the tenant record for this user (tenant_id references tenants.id, not user.id)
        const { data: tenantRecord, error: tenantRecordError } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (tenantRecordError) {
          const status = (tenantRecordError as { status?: number }).status;
          if (status === 401 || tenantRecordError.code === 'PGRST301') {
            setError('Session expired. Please sign in again.');
            setTenantRecordId(null);
            setLease(null);
            setPayments([]);
            setMaintenanceRequests([]);
            setLoading(false);
            return;
          }
          if (tenantRecordError.code !== 'PGRST116') {
            console.warn('Error fetching tenant record:', tenantRecordError);
          } else {
            console.log(
              'No tenant record found for user (this is normal for new tenants):',
              user.id
            );
          }
        }

        const tenantId = tenantRecord?.id;
        setTenantRecordId(tenantId ?? null);

        if (!tenantId) {
          console.log(
            'No tenant record exists yet. User can still view dashboard, but lease/payment data will be empty.'
          );
        }

        // Latest lease: lease_agreements → leases → property_tenants (fallback). Map to TenantLease for UI.
        let leaseData: TenantLease | null = null;
        let leaseError: unknown = null;
        if (tenantId) {
          try {
            const { rows } = await fetchLeaseRows({ tenantId });
            if (rows.length) {
              const enriched = await enrichRowsWithPropertiesAndTenants(rows.slice(0, 1), {
                propertyColumns:
                  'id, name, address, city, state, lease_price, monthly_rent, property_type, shortlet_details',
              });
              const row0 = enriched[0] as Record<string, unknown> & {
                properties?: Record<string, unknown> | null;
              };
              leaseData = mapLeaseLikeRowToTenantLease(row0, {
                properties: row0.properties ?? null,
              }) as TenantLease;
            }
            if (!leaseData) {
              leaseData = (await fetchTenantLeaseFromPropertyTenants(
                tenantId
              )) as TenantLease | null;
            }
          } catch (e) {
            leaseError = e;
            try {
              leaseData = (await fetchTenantLeaseFromPropertyTenants(
                tenantId
              )) as TenantLease | null;
            } catch {
              /* ignore */
            }
          }
        }

        if (leaseError) {
          console.warn('Error fetching lease:', leaseError);
        }

        // Approved application + property (no `tenants` row or lease row yet — still show rent & property in UI)
        if (!leaseData && user.id) {
          try {
            const fromApp = await fetchTenantLeaseFromApprovedApplication(
              user.id,
              tenantId ?? null
            );
            if (fromApp) {
              leaseData = fromApp as TenantLease;
            }
          } catch (e) {
            console.warn('[tenant] approved application lease fallback failed:', e);
          }
        }

        // Try to fetch real payment data from database
        let paymentsData = [];
        let paymentsError = null;
        if (tenantId) {
          if (isPropertyTenantsRelationMissing()) {
            paymentsData = [];
          } else {
            const { data: ptForPay, error: ptPayErr } = await supabase
              .from('property_tenants')
              .select('id')
              .eq('tenant_id', tenantId);

            if (ptPayErr) {
              if (isMissingSupabaseRelationError(ptPayErr)) {
                markPropertyTenantsRelationMissing();
                if (import.meta.env.DEV) {
                  console.debug(
                    '[tenant] property_tenants unavailable (migration or schema); payment list empty'
                  );
                }
              } else {
                console.warn('Error fetching property_tenants for payments:', ptPayErr);
              }
              paymentsData = [];
            } else {
              const ptIds = (ptForPay ?? []).map((r) => r.id);
              if (ptIds.length === 0) {
                paymentsData = [];
              } else {
                const paymentsResult = await supabase
                  .from('rent_payments')
                  .select('*')
                  .in('property_tenant_id', ptIds)
                  .order('created_at', { ascending: false });
                paymentsData =
                  (paymentsResult.data as RentPaymentRow[] | null)?.map((row) => {
                    const u = mapRentRowToPaymentUi(row, tenantId);
                    return {
                      id: u.id,
                      tenant_id: u.tenant_id,
                      lease_id: u.lease_id,
                      amount: u.amount,
                      payment_type: u.payment_type as TenantPayment['payment_type'],
                      payment_method: u.payment_method as TenantPayment['payment_method'],
                      payment_status: u.payment_status as TenantPayment['payment_status'],
                      payment_date: u.payment_date,
                      due_date: u.due_date,
                      reference_number: u.reference_number,
                      description: u.description,
                      receipt_url: u.receipt_url,
                      late_fee_applied: u.late_fee_applied,
                      created_at: u.created_at,
                      updated_at: u.updated_at,
                    };
                  }) ?? [];
                paymentsError = paymentsResult.error;
              }
            }
          }
        }

        if (paymentsError) {
          if ((paymentsError as { code?: string }).code === '42P01') {
            console.warn('rent_payments table is missing; using empty payment history');
            paymentsData = [];
            paymentsError = null;
          } else {
            console.warn('Error fetching payments:', paymentsError);
          }
        }

        // Try to fetch real maintenance requests from database
        // RLS policy checks user_id, not tenant_id, so query by user_id
        let maintenanceData = [];
        let maintenanceError = null;
        if (user?.id) {
          const maintenanceResult = await supabase
            .from('maintenance_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          maintenanceData = maintenanceResult.data || [];
          maintenanceError = maintenanceResult.error;
        }

        if (maintenanceError) {
          console.warn('Error fetching maintenance requests:', maintenanceError);
        }

        // Use real data if available, otherwise use empty arrays
        const rawLease = leaseData || null;
        const realPayments = paymentsData || [];
        const realMaintenance = maintenanceData || [];

        const realLease = finalizeTenantLeaseForUi(rawLease, realPayments);

        setLease(realLease);
        setPayments(realPayments);
        setMaintenanceRequests(realMaintenance);
        setDocuments([]); // Empty until documents schema is implemented
        setNotifications([]); // Empty until notifications schema is implemented

        logger.debug('Tenant data loaded', {
          profile: `${realProfile.first_name} ${realProfile.last_name}`,
          tenantId: tenantId || 'No tenant record',
          lease: !!realLease,
          payments: realPayments.length,
          maintenance: realMaintenance.length,
        });

        // Calculate stats and analytics from real data
        const calculatedStats = calculateStats(
          realProfile,
          realLease,
          realPayments,
          realMaintenance
        );
        const calculatedAnalytics = calculateAnalytics(
          realProfile,
          realLease,
          realPayments,
          realMaintenance
        );

        setStats(calculatedStats);
        setAnalytics(calculatedAnalytics);
      } catch (err) {
        console.error('Error loading tenant data:', err);

        // Only set error for critical failures, not for missing data or expected errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorCode = (err as any)?.code;

        // Don't show error for missing data (expected for new tenants)
        if (
          errorCode === 'PGRST116' ||
          errorMessage.includes('No rows') ||
          errorMessage.includes('not found')
        ) {
          console.log('No tenant data found (expected for new tenants)');
          // Still set fallback data but don't show error
        } else {
          // Only show error for actual failures
          setError('Failed to load tenant data');
        }

        // Fallback to empty data on error, not mock data
        const fallbackProfile: TenantProfile = {
          id: user.id,
          user_id: user.id,
          first_name: user.email?.split('@')[0] || 'Tenant',
          last_name: 'User',
          email: user.email || '',
          phone: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          occupation: '',
          employer: '',
          monthly_income: 0,
          status: 'active',
          move_in_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setProfile(fallbackProfile);
        setTenantRecordId(null);
        setLease(null);
        setPayments([]);
        setMaintenanceRequests([]);
        setDocuments([]);
        setNotifications([]);

        // Always calculate stats and analytics, even with minimal data
        const calculatedStats = calculateStats(fallbackProfile, null, [], []);
        const calculatedAnalytics = calculateAnalytics(fallbackProfile, null, [], []);

        setStats(calculatedStats);
        setAnalytics(calculatedAnalytics);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [user?.id]);

  return {
    profile,
    tenantRecordId,
    lease,
    payments,
    maintenanceRequests,
    documents,
    notifications,
    stats,
    analytics,
    loading,
    error,
    refetch: () => {
      // Trigger data refetch
      setLoading(true);
      // Re-run the effect
    },
  };
}

// Export types are already declared above with the interface definitions
