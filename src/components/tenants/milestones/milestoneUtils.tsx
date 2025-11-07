
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { parseISO, differenceInDays } from 'date-fns';

export const getMilestoneStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'completed':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'overdue':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
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
