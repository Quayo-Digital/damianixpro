import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Property } from '@/services/property/types';

type Props = {
  property: Property;
  /** Where the badges sit (e.g. on image overlay). */
  className?: string;
};

/**
 * Estate / multi-unit occupancy and single-property "Leased" ribbon for listing cards.
 */
export function PropertyLeaseSummaryBadges({ property, className }: Props) {
  const s = property.leaseSummary;
  if (!s) return null;

  if (s.totalUnits <= 1) {
    if (!s.fullyLeased) return null;
    return (
      <Badge
        className={cn(
          'pointer-events-none border border-amber-300/80 bg-amber-500/95 text-white shadow-sm',
          className
        )}
      >
        Leased
      </Badge>
    );
  }

  return (
    <div
      className={cn('pointer-events-none flex max-w-[min(100%,18rem)] flex-col gap-1', className)}
    >
      <Badge
        variant="secondary"
        className="border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm dark:bg-card"
      >
        {s.leasedUnits}/{s.totalUnits} units taken
      </Badge>
      {s.fullyLeased ? (
        <Badge className="border border-amber-300/80 bg-amber-500/95 text-white shadow-sm">
          Fully leased
        </Badge>
      ) : null}
    </div>
  );
}
