import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { parseISO, differenceInDays } from 'date-fns';

export const getMilestoneStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return 'bg-accent text-accent-foreground border-border';
    case 'active':
      return 'bg-primary/15 text-primary border-border';
    case 'completed':
      return 'bg-secondary text-secondary-foreground border-border';
    case 'overdue':
      return 'bg-destructive/10 text-destructive border-destructive/40';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const getMilestoneTypeIcon = (type: string) => {
  switch (type) {
    case 'lease_expiration':
      return <Calendar className="h-4 w-4" />;
    case 'rent_increase':
      return <AlertTriangle className="h-4 w-4" />;
    case 'inspection':
      return <Clock className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

export const getDaysLabel = (dateString: string) => {
  const date = parseISO(dateString);
  const today = new Date();
  const days = differenceInDays(date, today);

  if (days > 0) {
    return `in ${days} day${days === 1 ? '' : 's'}`;
  } else if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  } else {
    return 'today';
  }
};
