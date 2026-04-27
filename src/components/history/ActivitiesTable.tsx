import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ActivityItem } from '@/services/activity';
import { SkeletonRow, CheckingActivities } from './LoadingState';
import { EmptyState } from './EmptyState';
import { Loader2 } from 'lucide-react';

interface ActivitiesTableProps {
  isLoading: boolean;
  isFetching: boolean;
  filteredActivities: ActivityItem[];
  searchQuery: string;
  checkingActivities: boolean;
  hasActivities: boolean | null;
  isAuthenticated: boolean;
}

export const ActivitiesTable = ({
  isLoading,
  isFetching,
  filteredActivities,
  searchQuery,
  checkingActivities,
  hasActivities,
  isAuthenticated,
}: ActivitiesTableProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-1 backdrop-blur-sm dark:bg-card/95">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Skeleton Loading State */}
          {isLoading ? (
            // Display multiple skeleton rows while loading
            Array(5)
              .fill(0)
              .map((_, i) => <SkeletonRow keyValue={i} key={i} />)
          ) : filteredActivities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {searchQuery ? (
                  'No matching activities found. Try a different search term.'
                ) : checkingActivities ? (
                  <CheckingActivities />
                ) : hasActivities === false ? (
                  <EmptyState isAuthenticated={isAuthenticated} />
                ) : (
                  'No activities found for the current page.'
                )}
              </TableCell>
            </TableRow>
          ) : (
            filteredActivities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.type || 'Unknown'}</TableCell>
                <TableCell>{activity.description || 'No description'}</TableCell>
                <TableCell>{activity.date || 'No date'}</TableCell>
                <TableCell>
                  {activity.amount && <div className="text-sm">Amount: {activity.amount}</div>}
                  {activity.property && (
                    <div className="text-sm">Property: {activity.property}</div>
                  )}
                  {activity.location && (
                    <div className="text-sm">Location: {activity.location}</div>
                  )}
                  {!activity.amount && !activity.property && !activity.location && (
                    <div className="text-sm text-muted-foreground">No additional details</div>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" disabled={isFetching}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}

          {/* Refetching Indicator Row - Shows when data is refreshing but we already have data */}
          {!isLoading && isFetching && (
            <TableRow className="animate-pulse bg-muted/20">
              <TableCell colSpan={5} className="h-1 p-0">
                <Progress value={60} className="h-1 w-full" />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
