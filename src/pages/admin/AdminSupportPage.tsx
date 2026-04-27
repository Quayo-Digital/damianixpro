import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAdminSupportTickets } from '@/hooks/useAdminSupportTickets';
import { Skeleton } from '@/components/ui/skeleton';
import { SupportTicketsTable } from '@/components/admin/support/SupportTicketsTable';

export default function AdminSupportPage() {
  const {
    data: tickets,
    isLoading,
    isError,
    error,
  } = useAdminSupportTickets({ category: 'maintenance' });

  return (
    <PageLayout>
      <PageContent
        title="Technical Support Tickets"
        description="View and manage all maintenance and technical support tickets."
      >
        <div className="rounded-lg border bg-background p-6 shadow-sm">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {isError && (
            <p className="text-destructive">
              Error loading tickets:{' '}
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
          )}
          {tickets && <SupportTicketsTable tickets={tickets} />}
        </div>
      </PageContent>
    </PageLayout>
  );
}
