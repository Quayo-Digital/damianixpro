import { Badge } from '@/components/ui/badge';
import type {
  MaintenanceTicketPriority,
  MaintenanceTicketStatus,
} from '@/types/maintenanceTickets';

export function TicketStatusBadge({
  status,
  isOverdue,
}: {
  status: MaintenanceTicketStatus;
  isOverdue?: boolean;
}) {
  if (isOverdue && status !== 'resolved' && status !== 'cancelled') {
    return <Badge variant="destructive">Overdue</Badge>;
  }
  const map: Record<MaintenanceTicketStatus, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
    in_progress: {
      label: 'In progress',
      className: 'bg-secondary text-secondary-foreground hover:bg-secondary',
    },
    resolved: {
      label: 'Resolved',
      className: 'bg-primary text-primary-foreground hover:bg-primary',
    },
    cancelled: { label: 'Cancelled', className: 'bg-secondary text-secondary-foreground' },
  };
  const m = map[status] || map.pending;
  return <Badge className={m.className}>{m.label}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: MaintenanceTicketPriority }) {
  const map: Record<MaintenanceTicketPriority, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
    medium: { label: 'Medium', className: 'bg-accent text-accent-foreground' },
    high: { label: 'High', className: 'bg-secondary text-secondary-foreground hover:bg-secondary' },
    urgent: {
      label: 'Urgent',
      className: 'bg-destructive text-destructive-foreground hover:bg-destructive',
    },
  };
  const m = map[priority] || map.medium;
  return <Badge className={m.className}>{m.label}</Badge>;
}
