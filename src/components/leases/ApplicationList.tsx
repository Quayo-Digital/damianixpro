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
import { RentalApplication } from '@/services/applications/types';
import { LeaseStatusBadge } from './LeaseStatusBadge';

interface ApplicationListProps {
  applications: RentalApplication[];
  isLoading: boolean;
  onReviewApplication: (application: RentalApplication) => void;
}

export const ApplicationList = ({
  applications,
  isLoading,
  onReviewApplication,
}: ApplicationListProps) => {
  return (
    <Table>
      <TableCaption>A list of tenant applications.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Applicant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              Loading applications...
            </TableCell>
          </TableRow>
        ) : applications.length > 0 ? (
          applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">
                {application.property_name || application.property_id}
              </TableCell>
              <TableCell>{`${application.first_name} ${application.last_name}`}</TableCell>
              <TableCell>{new Date(application.created_at || '').toLocaleDateString()}</TableCell>
              <TableCell>
                <LeaseStatusBadge status={application.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReviewApplication(application)}
                >
                  {application.status === 'approved' ? 'View' : 'Review'}
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No applications found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
