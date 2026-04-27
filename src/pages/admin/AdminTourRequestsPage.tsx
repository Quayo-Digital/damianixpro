import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAdminTourRequests,
  updateTourRequestStatus,
  type AdminTourServiceRequest,
  type TourRequestStatus,
} from '@/services/tourServiceRequests';
import { toast } from 'sonner';

type RequestEditState = {
  status: TourRequestStatus;
  scheduled_at: string;
  tour_url: string;
  admin_notes: string;
};

const statusClassName: Record<TourRequestStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-800',
  scheduled: 'border-violet-200 bg-violet-50 text-violet-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-slate-200 bg-slate-50 text-slate-700',
};

function toDatetimeLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - tzOffset);
  return localDate.toISOString().slice(0, 16);
}

function toIsoFromDatetimeLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function AdminTourRequestsPage() {
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, RequestEditState>>({});

  const {
    data: requests = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-tour-requests'],
    queryFn: getAdminTourRequests,
  });

  const mutation = useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: {
        status: TourRequestStatus;
        admin_notes?: string | null;
        scheduled_at?: string | null;
        tour_url?: string | null;
      };
    }) => updateTourRequestStatus(requestId, payload),
    onSuccess: () => {
      toast.success('Tour request updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-tour-requests'] });
    },
    onError: (err: Error) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });

  const rows = useMemo(() => requests as AdminTourServiceRequest[], [requests]);

  const getEditState = (request: AdminTourServiceRequest): RequestEditState => {
    return (
      edits[request.id] ?? {
        status: request.status,
        scheduled_at: toDatetimeLocalInput(request.scheduled_at),
        tour_url: request.tour_url ?? '',
        admin_notes: request.admin_notes ?? '',
      }
    );
  };

  const updateEdit = (request: AdminTourServiceRequest, patch: Partial<RequestEditState>) => {
    setEdits((prev) => ({
      ...prev,
      [request.id]: {
        ...getEditState(request),
        ...patch,
      },
    }));
  };

  const handleSave = (request: AdminTourServiceRequest) => {
    const state = getEditState(request);
    if (state.status === 'completed' && !state.tour_url.trim()) {
      toast.error('Please provide a tour URL before marking request completed.');
      return;
    }

    mutation.mutate({
      requestId: request.id,
      payload: {
        status: state.status,
        admin_notes: state.admin_notes.trim() || null,
        scheduled_at: toIsoFromDatetimeLocalInput(state.scheduled_at),
        tour_url: state.tour_url.trim() || null,
      },
    });
  };

  return (
    <PageLayout>
      <PageContent
        title="3D Tour Service Queue"
        description="Manage professional 3D tour service requests and track fulfillment status."
      >
        <div className="premium-data-card p-4 md:p-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {isError && (
            <p className="text-destructive">
              Error loading tour requests:{' '}
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
          )}

          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Tour URL</TableHead>
                  <TableHead>Admin Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No 3D tour service requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((request) => {
                    const edit = getEditState(request);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.property_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>{request.requester_name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.requester_email || 'No email'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="mb-2">
                            <Badge
                              variant="outline"
                              className={`rounded-full ${statusClassName[request.status]}`}
                            >
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <Select
                            value={edit.status}
                            onValueChange={(value) =>
                              updateEdit(request, { status: value as TourRequestStatus })
                            }
                          >
                            <SelectTrigger className="w-[150px] rounded-full">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="datetime-local"
                            value={edit.scheduled_at}
                            onChange={(e) => updateEdit(request, { scheduled_at: e.target.value })}
                            className="min-w-[180px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="https://..."
                            value={edit.tour_url}
                            onChange={(e) => updateEdit(request, { tour_url: e.target.value })}
                            className="min-w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Textarea
                            placeholder="Internal notes..."
                            value={edit.admin_notes}
                            onChange={(e) => updateEdit(request, { admin_notes: e.target.value })}
                            className="min-w-[220px]"
                            rows={2}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleSave(request)}
                            disabled={mutation.isPending}
                          >
                            Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
