
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';

interface ActionButtonsProps {
  requestId: string | number;
  status: string;
  onStatusUpdate?: (id: string | number, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  onAddComment: () => void;
}

export function ActionButtons({ requestId, status, onStatusUpdate, onAddComment }: ActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2">
      {status !== 'completed' && onStatusUpdate && (
        <div className="flex gap-2">
          {status === 'pending' && (
            <Button variant="outline" size="sm" onClick={() => onStatusUpdate(requestId, 'in_progress')}>
              Mark In Progress
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onStatusUpdate(requestId, 'completed')}>
            Mark Complete
          </Button>
        </div>
      )}
      {status !== 'completed' && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onAddComment}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Add Comment
        </Button>
      )}
    </div>
  );
}
