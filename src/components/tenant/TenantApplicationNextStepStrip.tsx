import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserApplications } from '@/services/applications/applicationApi';
import type { RentalApplication } from '@/services/applications/types';

const OPEN_STATUSES: RentalApplication['status'][] = ['pending', 'more_info'];

function nextCopy(app: RentalApplication): { line: string; cta: string } {
  const name = app.property_name?.trim() || 'This listing';
  if (app.status === 'more_info') {
    return {
      line: `${name} — the landlord needs more information to continue your application.`,
      cta: 'View listing',
    };
  }
  return {
    line: `${name} — your application is being reviewed.`,
    cta: 'View listing',
  };
}

/**
 * Single “next step” strip for open rental applications (pending / more_info).
 */
export function TenantApplicationNextStepStrip() {
  const {
    data: apps = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tenant-applications', 'mine'],
    queryFn: getUserApplications,
    staleTime: 60 * 1000,
  });

  if (isLoading || isError) return null;

  const open = apps.filter((a) => OPEN_STATUSES.includes(a.status));
  if (open.length === 0) return null;

  const primary = open[0];
  const { line, cta } = nextCopy(primary);

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 dark:bg-primary/10 sm:flex-row sm:items-center sm:justify-between"
      role="region"
      aria-label="Application next step"
    >
      <div className="flex min-w-0 items-start gap-3">
        <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Next step · Rental application</p>
          <p className="text-sm text-muted-foreground">{line}</p>
          {open.length > 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              +{open.length - 1} other open application{open.length - 1 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
      <Button asChild size="sm" className="w-full shrink-0 sm:w-auto">
        <Link to={`/public/properties/${primary.property_id}`}>
          {cta}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
