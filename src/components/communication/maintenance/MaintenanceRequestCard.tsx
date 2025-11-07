
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from './card/StatusBadge';
import { UrgencyBadge } from './card/UrgencyBadge';
import { StatusIcon } from './card/StatusIcon';
import { RequestImage } from './card/RequestImage';
import { UpdatesList } from './card/UpdatesList';
import { ActionButtons } from './card/ActionButtons';
import { ImageDialog } from './card/ImageDialog';
import { CommentDialog } from './card/CommentDialog';
import { MaintenanceRequest, MaintenanceUpdate } from './maintenance-data';

interface MaintenanceRequestCardProps {
  request: MaintenanceRequest;
  onStatusUpdate?: (id: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
}

export function MaintenanceRequestCard({ request, onStatusUpdate }: MaintenanceRequestCardProps) {
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  const handleViewImage = () => {
    if (request.image_url) {
      setImageDialogOpen(true);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <StatusIcon status={request.status} />
            <CardTitle>{request.title}</CardTitle>
          </div>
          <CardDescription>Submitted on {new Date(request.created_at || '').toLocaleDateString()}</CardDescription>
        </div>
        <div className="flex gap-2">
          <UrgencyBadge urgency={request.priority as 'low' | 'medium' | 'high'} />
          <StatusBadge status={request.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm mb-4">{request.description}</p>
        
        <RequestImage imageUrl={request.image_url} onClick={handleViewImage} />
        <UpdatesList updates={request.updates || []} />
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <ActionButtons 
          requestId={request.id}
          status={request.status}
          onStatusUpdate={onStatusUpdate}
          onAddComment={() => setCommentDialogOpen(true)}
        />
      </CardFooter>

      {/* Dialogs */}
      <CommentDialog 
        open={commentDialogOpen} 
        onOpenChange={setCommentDialogOpen} 
        requestId={request.id}
        onCommentAdded={() => {
          // Placeholder for comment functionality
          setCommentDialogOpen(false);
        }}
      />

      <ImageDialog 
        open={imageDialogOpen} 
        onOpenChange={setImageDialogOpen}
        imageUrl={request.image_url} 
      />
    </Card>
  );
}
