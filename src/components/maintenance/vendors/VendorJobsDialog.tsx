import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorJob {
  id: string;
  title: string;
  description: string | null;
  property: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  completed_date: string | null;
  cost: number | null;
  rating: number | null;
  feedback: string | null;
}

interface VendorJobsDialogProps {
  vendorId: string;
  vendorName: string;
  open: boolean;
  onClose: () => void;
}

export function VendorJobsDialog({ vendorId, vendorName, open, onClose }: VendorJobsDialogProps) {
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVendorJobs = async () => {
      if (!open) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('vendor_jobs')
          .select('*')
          .eq('vendor_id', vendorId);

        if (error) {
          throw error;
        }

        setJobs(data as VendorJob[]);
      } catch (error) {
        console.error('Error fetching vendor jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vendor jobs',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorJobs();
  }, [vendorId, open, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const getStatusBadge = (status: VendorJob['status']) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            Scheduled
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Jobs for {vendorName}</DialogTitle>
          <DialogDescription>
            View and manage maintenance jobs assigned to this vendor.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No jobs found for this vendor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{job.description}</div>
                    </TableCell>
                    <TableCell>{job.property}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" /> {formatDate(job.scheduled_date)}
                      </div>
                      {job.completed_date && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> Completed: {formatDate(job.completed_date)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
