import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import React from 'react';

interface ChartStatusIndicatorProps {
  isLoading: boolean;
  error: any;
  data: any[] | undefined;
  chartHeight?: string;
  emptyMessage?: string;
  children: React.ReactNode;
}

export function ChartStatusIndicator({
  isLoading,
  error,
  data,
  chartHeight = '400px',
  emptyMessage = 'No data available for the selected period.',
  children,
}: ChartStatusIndicatorProps) {
  if (isLoading) {
    return <Skeleton className="w-full rounded-xl" style={{ height: chartHeight }} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: chartHeight }}>
        <Alert variant="destructive" className="w-auto rounded-xl border-border bg-card">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>There was a problem fetching data. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/90 text-center text-muted-foreground dark:bg-card"
        style={{ height: chartHeight }}
      >
        <AlertCircle className="mb-2 h-8 w-8" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
