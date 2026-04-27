import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RentalApplication } from '@/services/applications/types';
import { createLeaseAgreement, updateLeaseStatus } from '@/services/applications/applicationApi';
import { syncPublicListingAfterLeaseExecuted } from '@/services/property/leaseListingSync';
import { ensureLeaseCoordinationChecklist } from '@/services/leases/leaseCoordinationApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvedApplications: RentalApplication[];
  onLeaseCreated: () => void;
}

export const CreateLeaseDialog = ({
  open,
  onOpenChange,
  approvedApplications,
  onLeaseCreated,
}: CreateLeaseDialogProps) => {
  const [selectedApplicant, setSelectedApplicant] = useState<string>('');
  const [leaseDetails, setLeaseDetails] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    annualRent: '',
    securityDeposit: '',
  });
  const [isCreatingLease, setIsCreatingLease] = useState(false);

  const handleCreateLease = async () => {
    if (!selectedApplicant) {
      toast.error('Please select an applicant');
      return;
    }

    const application = approvedApplications.find((app) => app.id === selectedApplicant);
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
            status: 'active',
          })
          .select()
          .single();

        if (createError) throw createError;
        tenantId = newTenant.id;
      }

      // Store monthly_rent in DB (Nigeria: user enters annual, we convert)
      const annualRent = Number(leaseDetails.annualRent);
      if (!Number.isFinite(annualRent) || annualRent <= 0) {
        toast.error('Enter a valid annual rent amount');
        setIsCreatingLease(false);
        return;
      }

      const depositAmountRaw =
        leaseDetails.securityDeposit !== '' ? Number(leaseDetails.securityDeposit) : null;
      const depositAmount =
        depositAmountRaw != null && Number.isFinite(depositAmountRaw) ? depositAmountRaw : null;

      const safeStartDate = leaseDetails.startDate || new Date().toISOString().split('T')[0];
      const tenancyMonths = Number(application.tenancy_period ?? 12) || 12;

      // `leases.end_date` may be NOT NULL in some deployments, so derive a safe end date.
      const safeEndDate =
        leaseDetails.endDate ||
        new Date(
          new Date(safeStartDate).setMonth(new Date(safeStartDate).getMonth() + tenancyMonths)
        )
          .toISOString()
          .split('T')[0];

      // Prefer `lease_agreements`, but fall back to `leases` if the agreements table
      // isn't present in the DB.
      const lease =
        (await createLeaseAgreement(application.property_id, tenantId, application.id, {
          startDate: safeStartDate,
          endDate: safeEndDate,
          monthlyRent: annualRent / 12,
          securityDeposit: depositAmount ?? 0,
        })) ??
        (await supabase
          .from('leases')
          .insert({
            property_id: application.property_id,
            tenant_id: tenantId,
            start_date: safeStartDate,
            end_date: safeEndDate,
            monthly_rent: annualRent / 12,
            security_deposit: depositAmount ?? 0,
            status: 'ACTIVE',
          })
          .select()
          .single()
          .then((r) => (r.error ? null : (r.data as any))));

      if (lease) {
        // Create/refresh the tenant's tenancy link required by the payment flow.
        // `usePaymentProcessing` looks up `property_tenants` to link rent_payments.
        try {
          const propertyId = application.property_id;
          const startDate = safeStartDate;
          const endDate = safeEndDate;

          const { data: existingPT } = await supabase
            .from('property_tenants')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('property_id', propertyId)
            .maybeSingle();

          const payload = {
            property_id: propertyId,
            tenant_id: tenantId,
            rent_amount: annualRent / 12,
            deposit_amount: depositAmount,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
          };

          if (existingPT?.id) {
            await supabase.from('property_tenants').update(payload).eq('id', existingPT.id);
          } else {
            await supabase.from('property_tenants').insert(payload);
          }
        } catch (ptErr) {
          // Lease can still exist, but payments won't work without property_tenants.
          console.error('Failed to create property_tenants for payment flow:', ptErr);
          toast.error('Lease created but tenancy link failed; tenant payments may not work.');
        }

        // Mark lease as active so other parts of the UI treat it as a real tenancy.
        if ('application_id' in lease && lease.id) {
          // `updateLeaseStatus` updates `lease_agreements` only.
          await updateLeaseStatus(lease.id, 'active');
        }

        try {
          await syncPublicListingAfterLeaseExecuted(
            application.property_id,
            application.unit_id ?? null
          );
        } catch (syncErr) {
          console.warn('Listing sync after lease (non-fatal):', syncErr);
        }

        try {
          if ('application_id' in lease && lease.id) {
            await ensureLeaseCoordinationChecklist({
              leaseId: lease.id,
              propertyId: application.property_id,
              tenantId,
              leaseStartDate: safeStartDate,
            });
          }
        } catch (coordErr) {
          console.warn('Lease coordination checklist seed (non-fatal):', coordErr);
        }

        toast.success('Lease agreement created successfully');
        onOpenChange(false);
        onLeaseCreated();

        setSelectedApplicant('');
        setLeaseDetails({
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          annualRent: '',
          securityDeposit: '',
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
            <Select value={selectedApplicant} onValueChange={setSelectedApplicant}>
              <SelectTrigger>
                <SelectValue placeholder="Select an approved applicant" />
              </SelectTrigger>
              <SelectContent>
                {approvedApplications.length > 0 ? (
                  approvedApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.first_name} {app.last_name} - {app.property_name || app.property_id}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No approved applications
                  </SelectItem>
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
                onChange={(e) => setLeaseDetails({ ...leaseDetails, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={leaseDetails.endDate}
                onChange={(e) => setLeaseDetails({ ...leaseDetails, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent">Annual Rent (₦) - Nigeria standard</Label>
              <Input
                id="rent"
                type="number"
                placeholder="6000000"
                value={leaseDetails.annualRent}
                onChange={(e) => setLeaseDetails({ ...leaseDetails, annualRent: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">Security Deposit (₦)</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="45000"
                value={leaseDetails.securityDeposit}
                onChange={(e) =>
                  setLeaseDetails({ ...leaseDetails, securityDeposit: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreatingLease}>
            Cancel
          </Button>
          <Button onClick={handleCreateLease} disabled={isCreatingLease || !selectedApplicant}>
            {isCreatingLease ? 'Creating...' : 'Create Lease'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
