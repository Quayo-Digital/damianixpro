import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { getStatusBadge, getPriorityBadge } from '@/utils/badgeUtils';

interface MaintenanceTableProps {
  requests: MaintenanceRequest[];
  isOwnerOrAgent: boolean;
  onStatusUpdate: (id: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  showPriority?: boolean;
}

// Safe date formatter with fallback
const formatDate = (dateString: string | null | undefined, fallback?: string): string => {
  if (!dateString) {
    return fallback || 'Not available';
  }

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return fallback || 'Invalid date';
  }

  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const MaintenanceTable = ({
  requests,
  isOwnerOrAgent,
  onStatusUpdate,
  showPriority = false,
}: MaintenanceTableProps) => {
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  if (requests.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No maintenance requests found for this category.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableCaption>A list of maintenance requests.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Issue</TableHead>
            {isOwnerOrAgent && <TableHead>Tenant</TableHead>}
            <TableHead>Property</TableHead>
            <TableHead>Date</TableHead>
            {showPriority ? <TableHead>Priority</TableHead> : <TableHead>Status</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.title}</TableCell>
              {isOwnerOrAgent && <TableCell>{request.tenant_name || 'Unknown'}</TableCell>}
              <TableCell>{request.property_name || 'Unknown'}</TableCell>
              <TableCell>{new Date(request.created_at || '').toLocaleDateString()}</TableCell>
              <TableCell>
                {showPriority ? getPriorityBadge(request.priority) : getStatusBadge(request.status)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('View Details clicked for request:', request);
                      setSelectedRequest(request);
                    }}
                    type="button"
                  >
                    View Details
                  </Button>
                  {isOwnerOrAgent && request.status !== 'completed' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        onStatusUpdate(
                          request.id as string,
                          request.status === 'pending' ? 'in_progress' : 'completed'
                        )
                      }
                    >
                      {request.status === 'pending'
                        ? showPriority
                          ? 'Start Work'
                          : 'Mark In Progress'
                        : 'Mark Completed'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Request Detail Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open, 'selectedRequest:', selectedRequest);
          if (!open) {
            setSelectedRequest(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {selectedRequest ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRequest.title}</DialogTitle>
                <DialogDescription>Request ID: {selectedRequest.id}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center space-x-4">
                  {getStatusBadge(selectedRequest.status)}
                  {getPriorityBadge(selectedRequest.priority)}
                  <Badge variant="outline" className="capitalize">
                    {selectedRequest.category || 'Other'}
                  </Badge>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <p className="mt-1 text-sm">{selectedRequest.description}</p>
                </div>

                {/* Property and Tenant Info */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.property_name && (
                    <div>
                      <Label className="text-sm text-gray-600">Property</Label>
                      <p className="font-medium">{selectedRequest.property_name}</p>
                    </div>
                  )}
                  {selectedRequest.tenant_name && (
                    <div>
                      <Label className="text-sm text-gray-600">Tenant</Label>
                      <p className="font-medium">{selectedRequest.tenant_name}</p>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <Label className="text-sm text-gray-600">Submitted</Label>
                  <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                </div>

                {/* Image */}
                {selectedRequest.image_url && (
                  <div>
                    <Label className="text-sm text-gray-600">Image</Label>
                    <div className="mt-2">
                      <img
                        src={selectedRequest.image_url}
                        alt={selectedRequest.title}
                        className="max-h-64 rounded-lg object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Updates */}
                {selectedRequest.updates && selectedRequest.updates.length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-600">Updates</Label>
                    <div className="mt-2 space-y-2">
                      {selectedRequest.updates.map((update, index) => (
                        <div key={index} className="rounded-lg bg-gray-50 p-3">
                          <p className="text-sm">{update.message}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(update.date)}
                            {update.created_by && ` • ${update.created_by}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">No request selected</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
