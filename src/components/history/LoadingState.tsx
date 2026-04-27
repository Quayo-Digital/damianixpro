import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { TableRow, TableCell } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

export const LoadingIndicator = ({ isRefetching = false }: { isRefetching?: boolean }) => (
  <div className="my-8 flex w-full flex-col gap-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
    <Progress
      value={isRefetching ? 70 : 40}
      className="mb-6 h-2 w-full"
      indicatorClassName="animate-pulse"
    />
  </div>
);

export const SkeletonRow = ({ keyValue }: { keyValue: number }) => (
  <TableRow key={`skeleton-${keyValue}`}>
    <TableCell>
      <Skeleton className="h-4 w-[80px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[200px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[140px]" />
    </TableCell>
    <TableCell>
      <div className="space-y-2">
        <Skeleton className="h-3 w-[100px]" />
        <Skeleton className="h-3 w-[120px]" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-8 w-[50px] rounded-md" />
    </TableCell>
  </TableRow>
);

export const CheckingActivities = () => (
  <div className="flex h-full items-center justify-center">
    <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
    <span className="text-muted-foreground">Checking for activities...</span>
  </div>
);
