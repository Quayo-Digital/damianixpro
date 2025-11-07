
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaseExpirationNotice } from '@/components/leases/LeaseExpirationNotice';
import { LeaseManagementDialog } from '@/components/leases/LeaseManagementDialog';
import { getActiveLease } from '@/services/leases/leaseTerminationService';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { WelcomeCard } from './dashboard/WelcomeCard';
import { QuickActions } from './dashboard/QuickActions';
import { RecentActivity } from './dashboard/RecentActivity';
import { SmartRecommendations } from '@/components/ai/SmartRecommendations';

interface TenantDashboardProps {
  onMakePayment: () => void;
}

export function TenantDashboard({ onMakePayment }: TenantDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [activeLease, setActiveLease] = useState<any | null>(null);
  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'renewal' | 'termination'>('renewal');
  const [tenantData, setTenantData] = useState<any>(null);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default fallback data while loading
  const tenant = {
    name: tenantData ? `${tenantData.first_name} ${tenantData.last_name}` : 'Loading...',
    property: propertyData ? `${propertyData.title}, ${propertyData.address}` : 'Loading...',
    leaseStart: activeLease?.start_date || 'N/A',
    leaseEnd: activeLease?.end_date || 'N/A',
    nextPayment: activeLease?.end_date || 'N/A',
    paymentAmount: activeLease?.monthly_rent || 0,
  };

  useEffect(() => {
    const fetchTenantData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Get the tenant data with profile information
        const { data: tenantInfo, error: tenantError } = await supabase
          .from('tenants')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            status,
            created_at
          `)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
          
        if (tenantError) throw tenantError;
        
        if (tenantInfo) {
          setTenantId(tenantInfo.id);
          setTenantData(tenantInfo);
          
          // Get active lease information
          const lease = await getActiveLease(tenantInfo.id);
          setActiveLease(lease);
          
          // Get property information if lease exists
          if (lease?.property_id) {
            const { data: property, error: propertyError } = await supabase
              .from('properties')
              .select('id, title, address, type')
              .eq('id', lease.property_id)
              .single();
              
            if (!propertyError && property) {
              setPropertyData(property);
            }
          }
          
          // Fetch recent activity (payments, maintenance, messages)
          await fetchRecentActivity(tenantInfo.id);
        }
      } catch (error) {
        console.error('Error fetching tenant data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenantData();
  }, [user?.id]);

  const fetchRecentActivity = async (tenantId: string) => {
    try {
      const activities = [];
      
      // Fetch recent payments
      const { data: payments } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (payments) {
        activities.push(...payments.map(payment => ({
          id: `payment_${payment.id}`,
          type: 'payment' as const,
          description: `${payment.category} payment of ₦${payment.amount.toLocaleString()}`,
          date: payment.date,
          status: 'completed' as const
        })));
      }
      
      // Fetch recent maintenance requests
      const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (maintenance) {
        activities.push(...maintenance.map(request => ({
          id: `maintenance_${request.id}`,
          type: 'maintenance' as const,
          description: `Maintenance request: ${request.title}`,
          date: request.created_at.split('T')[0],
          status: request.status as 'completed' | 'in-progress' | 'unread'
        })));
      }
      
      // Sort by date and limit to 5 most recent
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
        
      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Set fallback activity if database query fails
      setRecentActivity([
        { id: 1, type: 'message' as const, description: 'Welcome to your tenant dashboard!', date: new Date().toISOString().split('T')[0], status: 'unread' as const }
      ]);
    }
  };

  const handleNavigateTo = (section: string) => {
    // Navigate to tenant portal with the specific section
    navigate(`/tenant-portal#${section}`);
  };

  const handleRenewClick = () => {
    setInitialTab('renewal');
    setLeaseDialogOpen(true);
  };

  const handleTerminateClick = () => {
    setInitialTab('termination');
    setLeaseDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
          <div className="bg-gray-200 rounded-lg h-32 mb-4"></div>
          <div className="bg-gray-200 rounded-lg h-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeCard
        name={tenant.name}
        property={tenant.property}
        leaseStart={tenant.leaseStart}
        leaseEnd={tenant.leaseEnd}
        nextPayment={tenant.nextPayment}
        paymentAmount={tenant.paymentAmount}
        onMakePayment={onMakePayment}
      />
      
      {/* AI Smart Recommendations */}
      <SmartRecommendations 
        limit={3}
        showHeader={true}
        className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
      />
      
      {/* Lease Expiration Notice (will only show if lease is expiring within 90 days) */}
      {tenantId && activeLease && (
        <LeaseExpirationNotice
          onRenew={handleRenewClick}
          onTerminate={handleTerminateClick}
        />
      )}
      
      <QuickActions onNavigate={handleNavigateTo} />
      
      <RecentActivity activities={recentActivity} />

      {/* Lease Management Dialog */}
      {tenantId && activeLease && (
        <LeaseManagementDialog
          open={leaseDialogOpen}
          onOpenChange={setLeaseDialogOpen}
          leaseId={activeLease.id}
          tenantId={tenantId}
          propertyId={activeLease.property_id}
          currentEndDate={activeLease.end_date}
          initialTab={initialTab}
        />
      )}
    </div>
  );
}
