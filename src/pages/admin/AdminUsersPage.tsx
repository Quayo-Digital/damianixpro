import { useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@/contexts/auth';
import { getRoleDisplay } from '@/contexts/auth/authUtils';

const ROLE_FILTER_OPTIONS: readonly UserRole[] = [
  'super_admin',
  'admin',
  'owner',
  'agent',
  'manager',
  'accountant',
  'facility_manager',
  'tenant',
  'vendor',
  'user',
] as const;

const ALL_ROLES_VALUE = '__all__';

export default function AdminUsersPage() {
  const { data: users, isLoading, isFetching, isError, error, refetch } = useAdminUsers();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES_VALUE);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const needle = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== ALL_ROLES_VALUE) {
        const hasRole = user.user_roles?.some((entry) => entry.role === roleFilter);
        if (!hasRole) return false;
      }
      if (!needle) return true;
      const haystack = `${user.full_name ?? ''} ${user.email ?? ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [users, search, roleFilter]);

  const totalCount = users?.length ?? 0;
  const visibleCount = filteredUsers.length;
  const hasActiveFilters = search.trim().length > 0 || roleFilter !== ALL_ROLES_VALUE;

  return (
    <PageLayout>
      <PageContent
        title="User Management"
        description={
          totalCount === 0
            ? 'Review new user registrations and manage existing users.'
            : `Manage roles across ${totalCount} ${totalCount === 1 ? 'user' : 'users'}.`
        }
      >
        <div className="space-y-4 rounded-lg border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="pl-9"
                aria-label="Search users"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[200px]" aria-label="Filter by role">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ROLES_VALUE}>All roles</SelectItem>
                  {ROLE_FILTER_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleDisplay(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  void refetch();
                }}
                disabled={isFetching}
                aria-label="Refresh users"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <p className="text-destructive" role="alert">
              Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          ) : (
            <>
              <UsersTable
                users={filteredUsers}
                filteredEmptyMessage={
                  hasActiveFilters ? 'No users match the current filters.' : 'No users found.'
                }
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {visibleCount} of {totalCount}
                </span>
                {hasActiveFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter(ALL_ROLES_VALUE);
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
