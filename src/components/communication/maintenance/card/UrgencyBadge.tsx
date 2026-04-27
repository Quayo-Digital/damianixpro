import { Badge } from '@/components/ui/badge';

interface UrgencyBadgeProps {
  urgency: 'low' | 'medium' | 'high';
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  switch (urgency) {
    case 'high':
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
          High Priority
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
          Medium Priority
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
          Low Priority
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
