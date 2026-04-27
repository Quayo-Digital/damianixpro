import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { TenantApplication } from '@/hooks/useTenants';
import { ApplicationReview } from './ApplicationReview';

interface ApplicationDetailSheetProps {
  application: TenantApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailSheet({
  application,
  open,
  onOpenChange,
}: ApplicationDetailSheetProps) {
  if (!application) return null;

  const tenantName = application.tenant
    ? `${application.tenant.first_name || ''} ${application.tenant.last_name || ''}`.trim()
    : 'Applicant';

  const applicationForReview = {
    id: application.id,
    status: application.status,
    property: application.property?.title || application.property?.address || 'Unknown',
    submittedDate: application.application_date,
    applicantName: tenantName,
    email: application.tenant?.email || '',
    phone: application.tenant?.phone || '',
    notes: application.notes,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Application Review</SheetTitle>
          <SheetDescription>Review application details</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ApplicationReview application={applicationForReview} tenantName={tenantName} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
