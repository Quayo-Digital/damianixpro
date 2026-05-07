import { Badge } from '@/components/ui/badge';

interface UrgencyBadgeProps {
  urgency: 'low' | 'medium' | 'high';
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  switch (urgency) {
    case 'high':
      return (
        <Badge
          variant="outline"
          className="border-destructive/40 bg-destructive/10 text-destructive"
        >
          High Priority
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="outline" className="border-border bg-accent/40 text-foreground">
          Medium Priority
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="outline" className="border-border bg-primary/15 text-primary">
          Low Priority
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
