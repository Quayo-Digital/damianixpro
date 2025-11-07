
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
  const { data: users, isLoading, isError, error } = useAdminUsers();

  return (
    <PageLayout>
      <PageContent title="User Management" description="Review new user registrations and manage existing users.">
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
          {users && <UsersTable users={users} />}
        </div>
      </PageContent>
    </PageLayout>
  );
}
