import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getLeaseActions,
  updateLeaseActionStatus,
} from '@/services/leases/leaseTerminationService';
import { format, parseISO } from 'date-fns';
import { Check, X, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export function LeaseActionList({
  propertyId,
  onActionUpdated,
}: {
  propertyId?: string;
  onActionUpdated?: () => void;
}) {
  const { user, isTenant, isOwner, isAgent } = useAuthSession();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaseActions();
  }, [user?.id, propertyId]);

  const loadLeaseActions = async () => {
    setLoading(true);
    try {
      const queryOptions: Record<string, string> = {};

      // If property owner/agent and propertyId is provided, filter by property
      if ((isOwner() || isAgent()) && propertyId) {
        queryOptions.propertyId = propertyId;
      }
      // If tenant, get their tenant_id and filter by that
      else if (isTenant() && user?.id) {
        // Get the tenant_id from the tenants table using user_id
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!tenantError && tenantData) {
          queryOptions.tenantId = tenantData.id;
        }
      }

      const leaseActions = await getLeaseActions(queryOptions);
      setActions(leaseActions);
    } catch (error) {
      console.error('Error loading lease actions:', error);
      toast.error('Failed to load lease actions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (actionId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const result = await updateLeaseActionStatus(actionId, newStatus);

      if (result) {
        toast.success(`Action ${newStatus} successfully`);
        loadLeaseActions();

        if (onActionUpdated) {
          onActionUpdated();
        }
      }
    } catch (error) {
      console.error('Error updating lease action:', error);
      toast.error('Failed to update lease action');
    }
  };

  const getActionTypeDisplay = (actionType: string) => {
    switch (actionType) {
      case 'renew':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <RefreshCw className="mr-1 h-3 w-3" />
            Renewal
          </Badge>
        );
      case 'terminate':
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            <X className="mr-1 h-3 w-3" />
            Termination
          </Badge>
        );
      case 'evict':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Eviction
          </Badge>
        );
      default:
        return <Badge>{actionType}</Badge>;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <Check className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            <X className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <Check className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lease Actions</CardTitle>
        <CardDescription>Manage lease renewals, terminations, and evictions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : actions.length === 0 ? (
          <div className="rounded-lg border py-8 text-center text-muted-foreground">
            <p>No lease actions found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>{isOwner() || isAgent() ? 'Tenant' : 'Property'}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {(isOwner() || isAgent()) &&
                  actions.some((action) => action.status === 'pending') && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>{getActionTypeDisplay(action.action_type)}</TableCell>
                  <TableCell>
                    {isOwner() || isAgent()
                      ? `${action.tenants?.first_name} ${action.tenants?.last_name}`
                      : action.properties?.name}
                  </TableCell>
                  <TableCell>{format(parseISO(action.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{getStatusDisplay(action.status)}</TableCell>
                  {(isOwner() || isAgent()) && action.status === 'pending' && (
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(action.id, 'approved')}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(action.id, 'rejected')}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
