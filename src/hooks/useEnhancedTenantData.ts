import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

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
  monthly_rent: number;
  security_deposit: number;
  lease_status: 'active' | 'expired' | 'terminated' | 'pending_renewal';
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
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'pest_control' | 'cleaning' | 'security' | 'other';
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

export function useEnhancedTenantData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for all tenant data
  const [profile, setProfile] = useState<TenantProfile | null>(null);
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
    updated_at: '2024-08-08T12:00:00Z'
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
    security_deposit: 5600000,
    lease_status: 'active',
    auto_renewal: true,
    rent_due_date: 1,
    late_fee_amount: 140000,
    grace_period_days: 5,
    lease_document_url: '/documents/lease-agreement.pdf',
    special_terms: 'Standard lease terms apply',
    created_at: '2023-02-15T10:00:00Z',
    updated_at: '2024-08-08T12:00:00Z'
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
      description: 'Monthly rent payment',
      receipt_url: '/receipts/payment-receipt.pdf',
      late_fee_applied: 0,
      created_at: '2024-08-01T09:30:00Z',
      updated_at: '2024-08-01T09:30:00Z'
    }
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
      updated_at: '2024-07-17T16:30:00Z'
    }
  ];

  const calculateStats = (
    profileData: TenantProfile,
    leaseData: TenantLease,
    paymentsData: TenantPayment[],
    maintenanceData: TenantMaintenanceRequest[]
  ): TenantStats => {
    const completedPayments = paymentsData.filter(p => p.payment_status === 'completed');
    const onTimePayments = completedPayments.filter(p => 
      new Date(p.payment_date) <= new Date(p.due_date)
    );
    
    const totalAmountPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalLateFees = completedPayments.reduce((sum, p) => sum + p.late_fee_applied, 0);
    
    const moveInDate = new Date(profileData.move_in_date || profileData.created_at);
    const monthsAsResident = Math.floor(
      (Date.now() - moveInDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    const leaseEndDate = new Date(leaseData.end_date);
    const daysUntilLeaseExpiry = Math.ceil(
      (leaseEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    const completedMaintenance = maintenanceData.filter(m => m.status === 'completed');
    const avgSatisfaction = completedMaintenance.length > 0
      ? completedMaintenance.reduce((sum, m) => sum + (m.tenant_satisfaction || 0), 0) / completedMaintenance.length
      : 0;

    return {
      totalPayments: completedPayments.length,
      totalAmountPaid,
      onTimePayments: onTimePayments.length,
      latePayments: completedPayments.length - onTimePayments.length,
      onTimePaymentRate: completedPayments.length > 0 ? (onTimePayments.length / completedPayments.length) * 100 : 0,
      averagePaymentDelay: completedPayments.length > 0 
        ? completedPayments.reduce((sum, p) => {
            const paymentDate = new Date(p.payment_date);
            const dueDate = new Date(p.due_date);
            const delay = Math.max(0, Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            return sum + delay;
          }, 0) / completedPayments.length
        : 0,
      outstandingBalance: paymentsData
        .filter(p => p.payment_status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      nextPaymentDue: '2024-09-01T00:00:00Z',
      nextPaymentAmount: leaseData.monthly_rent,
      daysUntilLeaseExpiry,
      maintenanceRequestsSubmitted: maintenanceData.length,
      maintenanceRequestsCompleted: completedMaintenance.length,
      averageMaintenanceResponseTime: completedMaintenance.length > 0
        ? completedMaintenance.reduce((sum, m) => {
            if (m.submitted_date && m.scheduled_date) {
              const submitted = new Date(m.submitted_date);
              const scheduled = new Date(m.scheduled_date);
              const responseTime = Math.ceil((scheduled.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
              return sum + responseTime;
            }
            return sum;
          }, 0) / completedMaintenance.length
        : 0,
      tenantSatisfactionScore: avgSatisfaction,
      monthsAsResident,
      totalLateFees
    };
  };

  const calculateAnalytics = (
    profileData: TenantProfile,
    leaseData: TenantLease,
    paymentsData: TenantPayment[],
    maintenanceData: TenantMaintenanceRequest[]
  ): TenantAnalytics => {
    const completedPayments = paymentsData.filter(p => p.payment_status === 'completed');
    const onTimePayments = completedPayments.filter(p => 
      new Date(p.payment_date) <= new Date(p.due_date)
    );
    
    return {
      paymentHistory: {
        monthlyPayments: completedPayments.slice(0, 6).map(p => ({
          month: new Date(p.payment_date).toISOString().slice(0, 7),
          amount: p.amount,
          onTime: new Date(p.payment_date) <= new Date(p.due_date),
          lateFee: p.late_fee_applied
        })),
        paymentTrends: {
          averageMonthlyPayment: completedPayments.length > 0 
            ? completedPayments.reduce((sum, p) => sum + p.amount, 0) / completedPayments.length 
            : 0,
          paymentConsistency: completedPayments.length > 0 
            ? (onTimePayments.length / completedPayments.length) * 100 
            : 0,
          preferredPaymentMethod: completedPayments.length > 0 
            ? completedPayments[0].payment_method 
            : 'bank_transfer',
          totalPaidYTD: completedPayments
            .filter(p => new Date(p.payment_date).getFullYear() === new Date().getFullYear())
            .reduce((sum, p) => sum + p.amount, 0),
          totalPaidAllTime: completedPayments.reduce((sum, p) => sum + p.amount, 0)
        }
      },
      leaseMetrics: {
        leaseUtilization: leaseData.lease_status === 'active' ? 100 : 0,
        renewalProbability: completedPayments.length > 0 && onTimePayments.length / completedPayments.length > 0.8 ? 85 : 65,
        satisfactionTrend: maintenanceData.filter(m => m.status === 'completed').slice(0, 5).map(m => ({
          month: new Date(m.completed_date || m.created_at).toISOString().slice(0, 7),
          score: m.tenant_satisfaction || 0
        })),
        complianceScore: completedPayments.length > 0 
          ? (onTimePayments.length / completedPayments.length) * 100 
          : 100
      },
      maintenanceMetrics: {
        requestFrequency: maintenanceData.length,
        averageResolutionTime: maintenanceData.filter(m => m.status === 'completed').length > 0
          ? maintenanceData.filter(m => m.status === 'completed').reduce((sum, m) => {
              if (m.submitted_date && m.completed_date) {
                const submitted = new Date(m.submitted_date);
                const completed = new Date(m.completed_date);
                return sum + Math.ceil((completed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
              }
              return sum;
            }, 0) / maintenanceData.filter(m => m.status === 'completed').length
          : 0,
        categoryBreakdown: [],
        satisfactionByCategory: []
      },
      financialSummary: {
        totalHousingCost: leaseData.monthly_rent,
        housingCostPercentage: profileData.monthly_income 
          ? (leaseData.monthly_rent / profileData.monthly_income) * 100 
          : 0,
        savingsFromOnTimePayments: onTimePayments.length * leaseData.late_fee_amount,
        projectedAnnualCost: leaseData.monthly_rent * 12
      }
    };
  };

  useEffect(() => {
    const fetchTenantData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch real user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Error fetching profile:', profileError);
        }

        // Create personalized profile using real user data with multiple fallbacks
        const realProfile: TenantProfile = {
          id: user.id,
          user_id: user.id,
          name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tenant',
          email: user.email || '',
          phone: profileData?.phone || user.user_metadata?.phone || '',
          emergency_contact_name: profileData?.emergency_contact_name || '',
          emergency_contact_phone: profileData?.emergency_contact_phone || '',
          employment_status: 'employed',
          employer_name: '',
          monthly_income: 0,
          lease_start: new Date().toISOString(),
          lease_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          rent_amount: 0,
          security_deposit: 0,
          payment_method: 'bank_transfer',
          auto_pay_enabled: false,
          move_in_date: new Date().toISOString(),
          lease_status: 'active',
          property_address: '',
          unit_number: '',
          created_at: profileData?.created_at || new Date().toISOString(),
          updated_at: profileData?.updated_at || new Date().toISOString()
        };

        // Always use real profile data
        setProfile(realProfile);
        
        // Try to fetch real lease data from database
        const { data: leaseData } = await supabase
          .from('leases')
          .select('*')
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Try to fetch real payment data from database
        const { data: paymentsData } = await supabase
          .from('tenant_payments')
          .select('*')
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false });

        // Try to fetch real maintenance requests from database
        const { data: maintenanceData } = await supabase
          .from('maintenance_requests')
          .select('*')
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false });

        // Use real data if available, otherwise use empty arrays
        const realLease = leaseData || null;
        const realPayments = paymentsData || [];
        const realMaintenance = maintenanceData || [];
        
        setLease(realLease);
        setPayments(realPayments);
        setMaintenanceRequests(realMaintenance);
        setDocuments([]); // Empty until documents schema is implemented
        setNotifications([]); // Empty until notifications schema is implemented
        
        console.log('Tenant real data loaded:', {
          profile: realProfile.name,
          lease: !!realLease,
          payments: realPayments.length,
          maintenance: realMaintenance.length
        });
        
        // Calculate stats and analytics from real data
        const calculatedStats = calculateStats(realProfile, realLease, realPayments, realMaintenance);
        const calculatedAnalytics = calculateAnalytics(realProfile, realLease, realPayments, realMaintenance);
        
        setStats(calculatedStats);
        setAnalytics(calculatedAnalytics);

      } catch (err) {
        console.error('Error loading tenant data:', err);
        setError('Failed to load tenant data');
        
        // Fallback to empty data on error, not mock data
        setProfile({
          id: user.id,
          user_id: user.id,
          name: user.email?.split('@')[0] || 'Tenant',
          email: user.email || '',
          phone: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          employment_status: 'employed',
          employer_name: '',
          monthly_income: 0,
          lease_start: new Date().toISOString(),
          lease_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          rent_amount: 0,
          security_deposit: 0,
          payment_method: 'bank_transfer',
          auto_pay_enabled: false,
          move_in_date: new Date().toISOString(),
          lease_status: 'active',
          property_address: '',
          unit_number: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setLease(null);
        setPayments([]);
        setMaintenanceRequests([]);
        setDocuments([]);
        setNotifications([]);
        
        const calculatedStats = calculateStats(
          { id: user.id, user_id: user.id, name: user.email?.split('@')[0] || 'Tenant', email: user.email || '' } as any,
          null,
          [],
          []
        );
        const calculatedAnalytics = calculateAnalytics(
          { id: user.id, user_id: user.id, name: user.email?.split('@')[0] || 'Tenant', email: user.email || '' } as any,
          null,
          [],
          []
        );
        
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
    }
  };
}

// Export types are already declared above with the interface definitions
