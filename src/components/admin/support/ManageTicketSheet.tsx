import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminMaintenanceRequest } from '@/hooks/useAdminSupportTickets';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ManageTicketSheetProps {
  ticket: AdminMaintenanceRequest;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';

async function updateMaintenanceRequest({
  ticketId,
  status,
  adminNotes,
}: {
  ticketId: string;
  status: MaintenanceStatus;
  adminNotes: string | null;
}) {
  const { error } = await supabase
    .from('maintenance_requests')
    .update({ status, admin_notes: adminNotes })
    .eq('id', ticketId);

  if (error) {
    throw new Error(error.message);
  }
  return null;
}

export function ManageTicketSheet({ ticket, isOpen, onOpenChange }: ManageTicketSheetProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<MaintenanceStatus>(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.admin_notes || '');

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setAdminNotes(ticket.admin_notes || '');
    }
  }, [ticket]);

  const mutation = useMutation({
    mutationFn: updateMaintenanceRequest,
    onSuccess: () => {
      toast.success('Ticket updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Error updating ticket: ${error.message}`);
    },
  });

  const handleSaveChanges = () => {
    mutation.mutate({
      ticketId: ticket.id,
      status,
      adminNotes,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Manage Ticket: {ticket.title}</SheetTitle>
          <SheetDescription>
            Update status and add internal notes for this maintenance request.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow space-y-6 overflow-y-auto py-4">
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-semibold">{ticket.title}</h4>
            <p className="text-sm text-muted-foreground">
              From: {ticket.tenant_name || 'N/A'} at {ticket.property_name || 'N/A'}
            </p>
            <p className="rounded-md bg-secondary p-3 text-sm">{ticket.description}</p>
            {ticket.image_url && (
              <a
                href={ticket.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-2 text-sm text-blue-500 hover:underline"
              >
                View attached image
              </a>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as MaintenanceStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes</Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes for your team..."
              rows={5}
            />
          </div>
        </div>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
