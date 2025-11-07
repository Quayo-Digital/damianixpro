
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ApplicationList } from '@/components/leases/ApplicationList';
import { RentalApplication } from '@/services/applications/types';

interface ApplicationsTabProps {
  applications: RentalApplication[];
  isLoading: boolean;
  onReviewApplication: (application: RentalApplication) => void;
}

export function ApplicationsTab({ applications, isLoading, onReviewApplication }: ApplicationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApplications = useMemo(() => {
    return applications.filter(app =>
      searchQuery === '' ||
      `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.property_name && app.property_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [applications, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by applicant name or property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <ApplicationList
        applications={filteredApplications}
        isLoading={isLoading}
        onReviewApplication={onReviewApplication}
      />
    </div>
  );
}
