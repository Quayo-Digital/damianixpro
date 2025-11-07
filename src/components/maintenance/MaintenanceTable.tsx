
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { getStatusBadge, getPriorityBadge } from '@/utils/badgeUtils';

interface MaintenanceTableProps {
  requests: MaintenanceRequest[];
  isOwnerOrAgent: boolean;
  onStatusUpdate: (id: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  showPriority?: boolean;
}

export const MaintenanceTable = ({ requests, isOwnerOrAgent, onStatusUpdate, showPriority = false }: MaintenanceTableProps) => {
  if (requests.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No maintenance requests found for this category.</p>;
  }

  return (
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
            {isOwnerOrAgent && (
              <TableCell>{request.tenant_name || 'Unknown'}</TableCell>
            )}
            <TableCell>{request.property_name || 'Unknown'}</TableCell>
            <TableCell>{new Date(request.created_at || '').toLocaleDateString()}</TableCell>
            <TableCell>
              {showPriority ? getPriorityBadge(request.priority) : getStatusBadge(request.status)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {isOwnerOrAgent && request.status !== 'completed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onStatusUpdate(
                      request.id as string,
                      request.status === 'pending' ? 'in_progress' : 'completed'
                    )}
                  >
                    {request.status === 'pending' ? (showPriority ? 'Start Work' : 'Mark In Progress') : 'Mark Completed'}
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
