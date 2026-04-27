import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPriorityBadge, getStatusBadge } from '@/utils/badgeUtils';

interface MaintenanceRequest {
  id: string;
  title: string;
  property_name: string;
  tenant_name: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  description: string;
  created_at: string;
}

export function MaintenanceRequestList() {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      try {
        setIsLoading(true);
        // Use any type to bypass TypeScript's type checking
        const { data, error } = await (supabase as any)
          .from('maintenance_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setMaintenanceRequests(data || []);
      } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load maintenance requests',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaintenanceRequests();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {maintenanceRequests.length === 0 ? (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-center text-muted-foreground">No maintenance requests found.</p>
          </CardContent>
        </Card>
      ) : (
        maintenanceRequests.map((request) => (
          <Card key={request.id} className="cursor-pointer transition-colors hover:bg-accent/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{request.title}</CardTitle>
                <div className="flex space-x-2">
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {request.property_name} • {request.tenant_name}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="mb-2 line-clamp-2 text-sm">{request.description}</p>
              <div className="text-xs text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
