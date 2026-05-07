import { Clock, WrenchIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatusIconProps {
  status: string;
}

export function StatusIcon({ status }: StatusIconProps) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case 'in_progress':
      return <WrenchIcon className="h-4 w-4 text-primary" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
}
