
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TableRow, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export const LoadingIndicator = ({ isRefetching = false }: { isRefetching?: boolean }) => (
  <div className="flex flex-col gap-4 w-full my-8">
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
    <Progress 
      value={isRefetching ? 70 : 40} 
      className="w-full h-2 mb-6" 
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
  <div className="flex justify-center items-center h-full">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
    <span className="text-muted-foreground">Checking for activities...</span>
  </div>
);
