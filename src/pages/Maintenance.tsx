import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Wrench, Plus } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';
import { MaintenanceRequestDialog } from '@/components/maintenance/MaintenanceRequestDialog';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { notifyError, notifySuccess } from '@/utils/notify';

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { maintenanceRequests, isLoading, refetch } = useMaintenanceRequests();
  const { isOwner, isAgent, isTenant, isVendor } = useAuthSession();

  const handleStatusUpdate = async (
    id: string,
    newStatus: 'pending' | 'in_progress' | 'completed'
  ) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      refetch();

      notifySuccess('Status updated', `Request status updated to ${newStatus.replace('_', ' ')}.`);
    } catch (error) {
      console.error('Error updating status:', error);
      notifyError('Update failed', 'Failed to update maintenance request status');
    }
  };

  const handleMaintenanceSuccess = (newRequest: MaintenanceRequest) => {
    refetch();
  };

  const pendingRequests = maintenanceRequests.filter((r) => r.status === 'pending');
  const inProgressRequests = maintenanceRequests.filter((r) => r.status === 'in_progress');
  const isOwnerOrAgent = isOwner() || isAgent();

  const renderContent = (requests: MaintenanceRequest[], showPriority: boolean = false) => {
    if (isLoading) {
      return <TableSkeleton rows={7} cols={5} />;
    }
    return (
      <MaintenanceTable
        requests={requests}
        isOwnerOrAgent={isOwnerOrAgent}
        onStatusUpdate={handleStatusUpdate}
        showPriority={showPriority}
      />
    );
  };

  return (
    <PageLayout>
      <PageContent
        title="Maintenance Management"
        description="View and manage all maintenance requests"
        actions={
          <>
            {isTenant() && <MaintenanceRequestDialog onSuccess={handleMaintenanceSuccess} />}
            {isVendor() && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit Job Report
              </Button>
            )}
          </>
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-5">
          <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto">
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="inprogress">In Progress ({inProgressRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-2 sm:mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  All Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>{renderContent(maintenanceRequests)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-2 sm:mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Pending Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>{renderContent(pendingRequests, true)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inprogress" className="mt-2 sm:mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  In Progress Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>{renderContent(inProgressRequests)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default Maintenance;
