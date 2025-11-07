
import { Badge } from '@/components/ui/badge';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, Calendar } from 'lucide-react';

interface LeaseExpiryBadgeProps {
  endDate: string;
}

export function LeaseExpiryBadge({ endDate }: LeaseExpiryBadgeProps) {
  const daysRemaining = differenceInDays(parseISO(endDate), new Date());
    
  if (daysRemaining <= 0) {
     return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Expired</span>
        </Badge>
      );
  }
  if (daysRemaining <= 30) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
        <AlertTriangle className="h-3 w-3" />
        <span>Expires in {daysRemaining} days</span>
      </Badge>
    );
  } else if (daysRemaining <= 90) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
        <AlertTriangle className="h-3 w-3" />
        <span>Expires in {daysRemaining} days</span>
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
        <Calendar className="h-3 w-3" />
        <span>Expires in {daysRemaining} days</span>
      </Badge>
    );
  }
}
