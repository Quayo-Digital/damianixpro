import { Skeleton } from '@/components/ui/skeleton';

export function KpiGridSkeleton(props: { cards?: number }) {
  const cards = props.cards ?? 4;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}
