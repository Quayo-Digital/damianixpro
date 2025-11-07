
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaseRenewalForm } from './LeaseRenewalForm';
import { LeaseTerminationForm } from './LeaseTerminationForm';
import { EvictionRequestForm } from './EvictionRequestForm';
import { useAuth } from '@/contexts/auth';

export function LeaseManagementDialog({
  open,
  onOpenChange,
  leaseId,
  tenantId,
  propertyId,
  currentEndDate,
  initialTab = "renewal",
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  currentEndDate: string;
  initialTab?: "renewal" | "termination" | "eviction";
  onSuccess?: () => void;
}) {
  const { isOwner, isAgent, isTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<"renewal" | "termination" | "eviction">(initialTab);
  
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);
  
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onOpenChange(false);
  };
  
  // Create a type-safe handler for tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as "renewal" | "termination" | "eviction");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'renewal' && 'Lease Renewal Request'}
            {activeTab === 'termination' && 'Lease Termination Request'}
            {activeTab === 'eviction' && 'Eviction Request'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'renewal' && 'Submit a request to renew your lease agreement.'}
            {activeTab === 'termination' && 'Submit a request to end your lease agreement.'}
            {activeTab === 'eviction' && 'Initiate the eviction process for this tenant.'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Tab navigation - Show different tabs based on user role */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            {isTenant() && (
              <>
                <TabsTrigger value="renewal">Renew Lease</TabsTrigger>
                <TabsTrigger value="termination">End Lease</TabsTrigger>
              </>
            )}
            {(isOwner() || isAgent()) && (
              <>
                <TabsTrigger value="renewal">Issue Renewal</TabsTrigger>
                <TabsTrigger value="eviction">Eviction</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="renewal" className="pt-4">
            <LeaseRenewalForm 
              leaseId={leaseId}
              tenantId={tenantId}
              propertyId={propertyId}
              currentEndDate={currentEndDate}
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
          
          <TabsContent value="termination" className="pt-4">
            <LeaseTerminationForm 
              leaseId={leaseId}
              tenantId={tenantId}
              propertyId={propertyId}
              currentEndDate={currentEndDate}
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
          
          <TabsContent value="eviction" className="pt-4">
            <EvictionRequestForm 
              leaseId={leaseId}
              tenantId={tenantId}
              propertyId={propertyId}
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
