
import { Clock, WrenchIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatusIconProps {
  status: string;
}

export function StatusIcon({ status }: StatusIconProps) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'in_progress':
      return <WrenchIcon className="h-4 w-4 text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}
