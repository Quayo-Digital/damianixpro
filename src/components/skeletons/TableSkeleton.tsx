import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton(props: { rows?: number; cols?: number }) {
  const rows = props.rows ?? 6;
  const cols = props.cols ?? 4;
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-32" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
