import React from 'react';
import { Button } from '@/components/ui/button';

interface PropertyFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export function PropertyFilters({ activeFilter, setActiveFilter }: PropertyFiltersProps) {
  return (
    <div className="space-x-2">
      <Button
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('all')}
      >
        All
      </Button>
      <Button
        variant={activeFilter === 'residential' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('residential')}
      >
        Residential
      </Button>
      <Button
        variant={activeFilter === 'commercial' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('commercial')}
      >
        Commercial
      </Button>
      <Button
        variant={activeFilter === 'industrial' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('industrial')}
      >
        Industrial
      </Button>
    </div>
  );
}
