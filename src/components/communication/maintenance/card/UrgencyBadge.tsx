
import { Badge } from "@/components/ui/badge";

interface UrgencyBadgeProps {
  urgency: 'low' | 'medium' | 'high';
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  switch (urgency) {
    case 'high':
      return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">High Priority</Badge>;
    case 'medium':
      return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Medium Priority</Badge>;
    case 'low':
      return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Low Priority</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
