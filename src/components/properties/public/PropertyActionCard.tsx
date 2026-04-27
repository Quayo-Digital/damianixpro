import { Property } from '@/services/property';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface PropertyActionCardProps {
  property: Property;
  onApplyClick: () => void;
  onRequestViewingClick: () => void;
  onContactAgentClick: () => void;
}

/** True when this listing is for rent/lease (not only `transaction_type`, which is often missing on demo/legacy rows). */
function isLeaseOffering(property: Property): boolean {
  const tt = (property.transaction_type || '').toUpperCase();
  if (tt === 'LEASE') return true;
  if (property.type?.toLowerCase() === 'rent') return true;
  const ls = property.leaseSummary;
  if (ls != null && ls.totalUnits > 0) return true;
  if (property.lease_price != null && property.lease_price > 0) return true;
  return false;
}

export const PropertyActionCard = ({
  property,
  onApplyClick,
  onRequestViewingClick,
  onContactAgentClick,
}: PropertyActionCardProps) => {
  const isLease = isLeaseOffering(property);
  const leaseSummary = property.leaseSummary;
  const fullyLeased = leaseSummary?.fullyLeased === true;
  const canApplyToRent = isLease && property.status === 'Available' && !fullyLeased;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{property.price}</CardTitle>
        <CardDescription>{isLease ? 'Annual rent' : 'Purchase price'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center border-b pb-4">
          <DollarSign className="mr-2 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Payment Terms</p>
            <p className="text-sm text-muted-foreground">
              {isLease ? 'Annual rent + deposit (typical)' : 'Full payment or mortgage'}
            </p>
          </div>
        </div>

        {leaseSummary && leaseSummary.totalUnits > 1 ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Occupancy:</span>{' '}
            {leaseSummary.leasedUnits} of {leaseSummary.totalUnits} units leased
            {fullyLeased ? ' (none available)' : '.'}
          </p>
        ) : null}

        {canApplyToRent ? (
          <Button className="w-full" size="lg" onClick={onApplyClick}>
            Apply to Rent
          </Button>
        ) : (
          <Button className="w-full" size="lg" disabled>
            {fullyLeased && isLease
              ? 'Fully leased'
              : isLease
                ? 'Unavailable to rent'
                : 'Not available'}
          </Button>
        )}

        <Button variant="outline" className="w-full" onClick={onRequestViewingClick}>
          Request Viewing
        </Button>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button
          variant="link"
          className="w-full text-muted-foreground hover:text-primary"
          onClick={onContactAgentClick}
        >
          Contact agent for more details
        </Button>
      </CardFooter>
    </Card>
  );
};
