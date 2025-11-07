
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VendorJob } from './vendor-job-data';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";

interface VendorJobListProps {
  jobs: VendorJob[];
}

export function VendorJobList({ jobs }: VendorJobListProps) {

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  if (jobs.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No jobs assigned yet.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead className="hidden sm:table-cell">Property</TableHead>
            <TableHead className="hidden md:table-cell">Scheduled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.title}</TableCell>
              <TableCell className="hidden sm:table-cell">{job.property}</TableCell>
              <TableCell className="hidden md:table-cell">{format(new Date(job.scheduled_date), 'PPP')}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">View Details</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
