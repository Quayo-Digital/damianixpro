import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { TenantScreening as TenantScreeningType } from '@/hooks/useTenants';
import { TenantScreening } from './TenantScreening';

interface ScreeningDetailSheetProps {
  screening: TenantScreeningType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreeningDetailSheet({ screening, open, onOpenChange }: ScreeningDetailSheetProps) {
  if (!screening) return null;

  const tenantName = screening.tenant
    ? `${screening.tenant.first_name || ''} ${screening.tenant.last_name || ''}`.trim()
    : 'Applicant';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Screening Details</SheetTitle>
          <SheetDescription>Screening results for {tenantName}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <TenantScreening tenantId={screening.tenant_id} tenantName={tenantName} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
