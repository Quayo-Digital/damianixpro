import { MaintenanceUpdate } from '../maintenance-data';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';

interface UpdatesListProps {
  updates?: MaintenanceUpdate[];
}

export function UpdatesList({ updates }: UpdatesListProps) {
  if (!updates || updates.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium">Updates</h4>
      <div className="space-y-2">
        {updates.map((update, i) => (
          <div key={i} className="flex gap-2 border-l-2 border-primary/20 py-1 pl-3 text-sm">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p>{update.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {update.date ? format(new Date(update.date), 'MMM d, yyyy h:mm a') : 'Date unknown'}
                {update.created_by && ` • ${update.created_by}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
