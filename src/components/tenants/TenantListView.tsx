import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import { fetchTenants, Tenant } from '@/services/tenants/tenantApi';
import { TenantListSkeleton } from './TenantListSkeleton';
import { TenantRow } from './TenantRow';

export function TenantListView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    data: tenants = [],
    isLoading,
    error,
  } = useQuery<Tenant[]>({
    queryKey: ['tenantList'],
    queryFn: fetchTenants,
  });

  const getFilteredTenants = () => {
    return tenants.filter((tenant) => {
      const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        fullName.includes(searchQuery.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.properties.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const handleViewTenant = (id: string) => {
    // In a real app, navigate to tenant details page
    console.log('View tenant:', id);
  };

  if (isLoading) {
    return <TenantListSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">Error fetching tenants: {(error as Error).message}</div>
    );
  }

  const filteredTenants = getFilteredTenants();

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tenants..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.length > 0 ? (
              filteredTenants.map((tenant) => (
                <TenantRow key={tenant.id} tenant={tenant} onViewTenant={handleViewTenant} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-muted-foreground">No tenants found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
