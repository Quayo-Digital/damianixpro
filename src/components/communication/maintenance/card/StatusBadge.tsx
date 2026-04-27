import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
          Pending
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
          In Progress
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
