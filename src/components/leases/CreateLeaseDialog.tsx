
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RentalApplication } from '@/services/applications/types';
import { createLeaseAgreement } from '@/services/applications/applicationApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface CreateLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvedApplications: RentalApplication[];
  onLeaseCreated: () => void;
}

export const CreateLeaseDialog = ({ open, onOpenChange, approvedApplications, onLeaseCreated }: CreateLeaseDialogProps) => {
  const [selectedApplicant, setSelectedApplicant] = useState<string>('');
  const [leaseDetails, setLeaseDetails] = useState({
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: ''
  });
  const [isCreatingLease, setIsCreatingLease] = useState(false);

  const handleCreateLease = async () => {
    if (!selectedApplicant) {
      toast.error('Please select an applicant');
      return;
    }
    
    const application = approvedApplications.find(app => app.id === selectedApplicant);
    if (!application) return;
    
    setIsCreatingLease(true);
    
    try {
      let tenantId: string;
      
      const { data: existingTenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', application.user_id)
        .single();
      
      if (tenantError && tenantError.code !== 'PGRST116') {
        throw tenantError;
      }
      
      if (existingTenant) {
        tenantId = existingTenant.id;
      } else {
        const { data: newTenant, error: createError } = await supabase
          .from('tenants')
          .insert({
            user_id: application.user_id,
            first_name: application.first_name,
            last_name: application.last_name,
            email: application.email,
            phone: application.phone,
            status: 'active'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        tenantId = newTenant.id;
      }
      
      const lease = await createLeaseAgreement(
        application.property_id,
        tenantId,
        application.id,
        {
          startDate: leaseDetails.startDate,
          endDate: leaseDetails.endDate,
          monthlyRent: Number(leaseDetails.monthlyRent),
          securityDeposit: Number(leaseDetails.securityDeposit)
        }
      );
      
      if (lease) {
        toast.success('Lease agreement created successfully');
        onOpenChange(false);
        onLeaseCreated();
        
        setSelectedApplicant('');
        setLeaseDetails({
          startDate: '',
          endDate: '',
          monthlyRent: '',
          securityDeposit: ''
        });
      } else {
        toast.error('Failed to create lease agreement');
      }
    } catch (error) {
      console.error('Error creating lease:', error);
      toast.error('Failed to create lease agreement');
    } finally {
      setIsCreatingLease(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Lease Agreement</DialogTitle>
          <DialogDescription>
            Create a new lease agreement for an approved tenant application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="applicant">Select Approved Applicant</Label>
            <Select 
              value={selectedApplicant} 
              onValueChange={setSelectedApplicant}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an approved applicant" />
              </SelectTrigger>
              <SelectContent>
                {approvedApplications.length > 0 ? (
                  approvedApplications.map(app => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.first_name} {app.last_name} - {app.property_name || app.property_id}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No approved applications</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={leaseDetails.startDate}
                onChange={(e) => setLeaseDetails({...leaseDetails, startDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={leaseDetails.endDate}
                onChange={(e) => setLeaseDetails({...leaseDetails, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent">Monthly Rent (₦)</Label>
              <Input
                id="rent"
                type="number"
                placeholder="45000"
                value={leaseDetails.monthlyRent}
                onChange={(e) => setLeaseDetails({...leaseDetails, monthlyRent: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deposit">Security Deposit (₦)</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="45000"
                value={leaseDetails.securityDeposit}
                onChange={(e) => setLeaseDetails({...leaseDetails, securityDeposit: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isCreatingLease}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateLease}
            disabled={isCreatingLease || !selectedApplicant}
          >
            {isCreatingLease ? 'Creating...' : 'Create Lease'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
