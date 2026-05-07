import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="border-border bg-accent/40 text-foreground">
          Pending
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
          In Progress
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="border-border bg-primary/15 text-primary">
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
