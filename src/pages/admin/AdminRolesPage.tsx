
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Skeleton } from '@/components/ui/skeleton';
import { RolesTable } from '@/components/admin/roles/RolesTable';

export default function AdminRolesPage() {
  const { data: users, isLoading, isError, error } = useAdminUsers();

  return (
    <PageLayout>
      <PageContent title="Role Management" description="Manage role assignments and permissions.">
        <div className="bg-background p-6 rounded-lg shadow-sm border">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {isError && <p className="text-destructive">Error loading users: {error.message}</p>}
          {users && <RolesTable users={users} />}
        </div>
      </PageContent>
    </PageLayout>
  );
}
