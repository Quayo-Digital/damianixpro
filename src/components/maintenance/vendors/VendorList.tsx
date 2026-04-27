import { useState, useEffect } from 'react';
import { Vendor } from './vendor-data';
import { VendorCard } from './VendorCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VendorListProps {
  categoryFilter?: string;
  vendors: Vendor[];
}

export function VendorList({ categoryFilter = 'all', vendors }: VendorListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');

  // Get all specialties for the filter dropdown
  const allSpecialties = vendors.flatMap((vendor) => vendor.specialties);
  const uniqueSpecialties = Array.from(new Set(allSpecialties));

  // Filter vendors based on search, category, and subcategory
  const filteredVendors = vendors.filter((vendor) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Main category filter (from tabs)
    const matchesCategory = categoryFilter === 'all' || vendor.category === categoryFilter;

    // Subcategory filter (from dropdown)
    const matchesSubCategory =
      subCategoryFilter === 'all' ||
      vendor.specialties.some((s) => s.toLowerCase() === subCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search vendors..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
          <SelectTrigger className="w-full max-w-[200px]">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {uniqueSpecialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty.toLowerCase()}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="rounded-md bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">No vendors match your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}
