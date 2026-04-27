import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, UserCircle2 } from 'lucide-react';
import { LeaseExpiryBadge } from './LeaseExpiryBadge';

interface LeaseCardProps {
  lease: any; // Ideally this should be a proper type
  onInitiateEviction: (lease: any) => void;
}

export function LeaseCard({ lease, onInitiateEviction }: LeaseCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">
            {lease.tenants?.first_name} {lease.tenants?.last_name}
          </h3>
        </div>
        <LeaseExpiryBadge endDate={lease.end_date} />
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm md:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Email: </span>
          <span>{lease.tenants?.email}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Phone: </span>
          <span>{lease.tenants?.phone || 'N/A'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Start Date: </span>
          <span>{format(parseISO(lease.start_date), 'MMM d, yyyy')}</span>
        </div>
        <div>
          <span className="text-muted-foreground">End Date: </span>
          <span>{format(parseISO(lease.end_date), 'MMM d, yyyy')}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Monthly Rent: </span>
          <span>₦{lease.monthly_rent?.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Security Deposit: </span>
          <span>₦{lease.security_deposit?.toLocaleString()}</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onInitiateEviction(lease)}
          className="flex items-center gap-1"
        >
          <AlertTriangle className="h-4 w-4" />
          Initiate Eviction
        </Button>
      </div>
    </div>
  );
}
