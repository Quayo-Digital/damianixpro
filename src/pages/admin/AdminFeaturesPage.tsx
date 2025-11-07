
import { useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAdminSupportTickets } from '@/hooks/useAdminSupportTickets';
import { SupportTicketsTable } from '@/components/admin/support/SupportTicketsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureRequestDialog } from '@/components/admin/features/FeatureRequestDialog';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminFeaturesPage() {
  const { data: tickets, isLoading, error } = useAdminSupportTickets({ category: 'feature_request' });
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('feature-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
          filter: `category=eq.feature_request`,
        },
        (_payload) => {
          queryClient.invalidateQueries({ queryKey: ['admin-support-tickets', 'feature_request'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-support-tickets', 'feature_request'] });
  };

  return (
    <PageLayout>
      <PageContent 
        title="Feature Requests" 
        description="View and manage feature request tickets."
        actions={<FeatureRequestDialog onSuccess={handleSuccess} />}
      >
        <div className="bg-background p-6 rounded-lg shadow-sm border">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : error ? (
            <p className="text-destructive text-center py-8">{error.message}</p>
          ) : (
            <SupportTicketsTable tickets={tickets || []} />
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}

