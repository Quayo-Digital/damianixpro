import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MaintenanceRequestDialog } from './maintenance/MaintenanceRequestDialog';
import { MaintenanceRequestCard } from './maintenance/MaintenanceRequestCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceRequest, parseUpdatesFromJson } from './maintenance/maintenance-data';
import { useAuthSession } from '@/contexts/auth';

export function TenantMaintenanceRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthSession();

  // Fetch maintenance requests from Supabase
  const fetchRequests = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform the data to match our MaintenanceRequest type
        const formattedRequests: MaintenanceRequest[] = data.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status as 'pending' | 'in_progress' | 'completed',
          priority: item.priority as 'low' | 'medium' | 'high',
          property_id: item.property_id,
          property_name: item.property_name,
          tenant_name: item.tenant_name,
          image_url: item.image_url,
          created_at: item.created_at,
          updates: parseUpdatesFromJson(item.updates),
          category: item.category,
        }));
        setRequests(formattedRequests);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast({
        title: 'Error Loading Data',
        description: 'There was a problem loading your maintenance requests.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Callback for when a new request is created
  const handleRequestSuccess = (newRequest: MaintenanceRequest) => {
    fetchRequests(); // Refetch all requests to get the latest data
    toast({
      title: 'Maintenance Request Submitted',
      description: 'Your maintenance request has been submitted successfully.',
    });
  };

  // Function to handle status updates
  const handleStatusUpdate = async (
    id: string,
    newStatus: 'pending' | 'in_progress' | 'completed'
  ) => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Refresh the data
      await fetchRequests();

      toast({
        title: 'Status Updated',
        description: `Request status updated to ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating the request status.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Maintenance Requests</h2>
        <MaintenanceRequestDialog onSuccess={handleRequestSuccess} />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && requests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">You have no maintenance requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {!isLoading &&
            requests.map((request) => (
              <MaintenanceRequestCard
                key={request.id}
                request={request}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
        </div>
      )}
    </div>
  );
}
