
import { useState, useMemo } from 'react';
import { LeaseFilters } from '@/components/leases/LeaseFilters';
import { LeaseList } from '@/components/leases/LeaseList';

interface LeasesTabProps {
  leases: any[];
  isLoading: boolean;
}

export function LeasesTab({ leases, isLoading }: LeasesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLeases = useMemo(() => {
    return leases
      .filter(lease => statusFilter === 'all' || lease.status === statusFilter)
      .filter(lease =>
        searchQuery === '' ||
        (lease.tenant_name && lease.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lease.property_name && lease.property_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [leases, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      <LeaseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <LeaseList leases={filteredLeases} isLoading={isLoading} />
    </div>
  );
}
