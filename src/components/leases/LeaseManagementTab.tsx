import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeaseActionList } from './LeaseActionList';
import { LeaseManagementDialog } from './LeaseManagementDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { LeaseCard } from './LeaseCard';

const fetchPropertyLeases = async (propertyId: string) => {
  const { data, error } = await supabase
    .from('lease_agreements')
    .select(`
      *,
      tenants:tenant_id (id, first_name, last_name, email, phone)
    `)
    .eq('property_id', propertyId)
    .eq('status', 'active');
    
  if (error) throw error;
  return data || [];
};

export function LeaseManagementTab({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLease, setSelectedLease] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: activeLeases = [], isLoading: loading, error } = useQuery({
    queryKey: ['propertyLeases', propertyId],
    queryFn: () => fetchPropertyLeases(propertyId),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`property-leases-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lease_agreements',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['propertyLeases', propertyId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lease_actions',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['propertyLeases', propertyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, propertyId]);
  
  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['propertyLeases', propertyId] });
  };

  const handleInitiateEviction = (lease: any) => {
    setSelectedLease(lease);
    setIsDialogOpen(true);
  };

  if (error) {
    return <div className="p-4 text-red-500">Error fetching leases: {(error as Error).message}</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Lease Management</h2>
      
      <div className="grid gap-6 md:grid-cols-5">
        {/* Active Leases */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Active Leases</CardTitle>
            <CardDescription>Current lease agreements for this property</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : activeLeases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No active leases for this property.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {activeLeases.map((lease) => (
                    <LeaseCard key={lease.id} lease={lease} onInitiateEviction={handleInitiateEviction} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        {/* Lease Actions Quick Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Lease Action Summary</CardTitle>
            <CardDescription>Recent lease actions for this property</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaseActionList propertyId={propertyId} onActionUpdated={handleSuccess} />
          </CardContent>
        </Card>
      </div>
      
      {/* Lease Management Dialog for eviction */}
      {selectedLease && (
        <LeaseManagementDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          leaseId={selectedLease.id}
          tenantId={selectedLease.tenant_id}
          propertyId={propertyId}
          currentEndDate={selectedLease.end_date}
          initialTab="eviction"
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
