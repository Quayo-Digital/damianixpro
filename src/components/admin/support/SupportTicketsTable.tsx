import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { AdminMaintenanceRequest } from '@/hooks/useAdminSupportTickets';
import { ManageTicketSheet } from './ManageTicketSheet';
import { getPriorityBadge, getStatusBadge } from '@/utils/badgeUtils';

interface SupportTicketsTableProps {
  tickets: AdminMaintenanceRequest[];
}

export function SupportTicketsTable({ tickets }: SupportTicketsTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<AdminMaintenanceRequest | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <div className="font-medium">{ticket.title}</div>
                  <div className="text-sm text-muted-foreground">{ticket.property_name}</div>
                </TableCell>
                <TableCell>{ticket.tenant_name || 'N/A'}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/25 bg-background dark:bg-muted/30"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No support tickets found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {selectedTicket && (
        <ManageTicketSheet
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedTicket(null);
            }
          }}
        />
      )}
    </>
  );
}
