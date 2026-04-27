import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { LeaseAgreement } from '@/services/applications/types';
import { LeaseStatusBadge } from './LeaseStatusBadge';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, parseISO } from 'date-fns';

interface LeaseListProps {
  leases: LeaseAgreement[];
  isLoading: boolean;
  onOpenOnboarding?: (lease: LeaseAgreement) => void;
}

const getExpiryBadge = (endDate: string | null) => {
  if (!endDate) return null;
  const daysRemaining = differenceInDays(parseISO(endDate), new Date());

  if (daysRemaining < 0) {
    return null; // Don't show for already expired leases
  }

  if (daysRemaining <= 30) {
    return (
      <Badge variant="outline" className="ml-2 gap-1 border-red-200 bg-red-50 text-xs text-red-700">
        <AlertTriangle className="h-3 w-3" />
        <span>Expires in {daysRemaining} days</span>
      </Badge>
    );
  } else if (daysRemaining <= 90) {
    return (
      <Badge
        variant="outline"
        className="ml-2 gap-1 border-amber-200 bg-amber-50 text-xs text-amber-700"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>Expires in {daysRemaining} days</span>
      </Badge>
    );
  }
  return null;
};

export const LeaseList = ({ leases, isLoading, onOpenOnboarding }: LeaseListProps) => {
  return (
    <Table>
      <TableCaption>A list of your current leases.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Tenant</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              Loading leases...
            </TableCell>
          </TableRow>
        ) : leases.length > 0 ? (
          leases.map((lease) => (
            <TableRow key={lease.id}>
              <TableCell className="font-medium">{lease.property_name}</TableCell>
              <TableCell>{lease.tenant_name}</TableCell>
              <TableCell>
                {lease.start_date ? new Date(lease.start_date).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell>
                {lease.end_date ? new Date(lease.end_date).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <LeaseStatusBadge status={lease.status} />
                  {getExpiryBadge(lease.end_date)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {onOpenOnboarding ? (
                  <Button variant="outline" size="sm" onClick={() => onOpenOnboarding(lease)}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Onboarding
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No leases found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
