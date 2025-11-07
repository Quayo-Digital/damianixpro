
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Wrench, Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { MaintenanceRequestDialog } from '@/components/maintenance/MaintenanceRequestDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable';

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { maintenanceRequests, isLoading, refetch } = useMaintenanceRequests();
  const { isOwner, isAgent, isTenant, isVendor } = useAuth();
  const { toast } = useToast();

  const handleStatusUpdate = async (id: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      refetch();
      
      toast({
        title: "Status Updated",
        description: `Request status updated to ${newStatus.replace('_', ' ')}.`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update maintenance request status",
        variant: "destructive"
      });
    }
  };

  const handleMaintenanceSuccess = (newRequest: MaintenanceRequest) => {
    refetch();
  };

  const pendingRequests = maintenanceRequests.filter(r => r.status === 'pending');
  const inProgressRequests = maintenanceRequests.filter(r => r.status === 'in_progress');
  const isOwnerOrAgent = isOwner() || isAgent();

  const renderContent = (requests: MaintenanceRequest[], showPriority: boolean = false) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    return <MaintenanceTable requests={requests} isOwnerOrAgent={isOwnerOrAgent} onStatusUpdate={handleStatusUpdate} showPriority={showPriority} />;
  }

  return (
    <PageLayout>
      <PageContent
        title="Maintenance Management"
        description="View and manage all maintenance requests"
        actions={
          <>
            {isTenant() && (
              <MaintenanceRequestDialog onSuccess={handleMaintenanceSuccess} />
            )}
            {isVendor() && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit Job Report
              </Button>
            )}
          </>
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="inprogress">In Progress ({inProgressRequests.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  All Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContent(maintenanceRequests)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Pending Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContent(pendingRequests, true)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="inprogress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  In Progress Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContent(inProgressRequests)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default Maintenance;
