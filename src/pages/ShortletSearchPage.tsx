/**
 * Short-Let Search Page
 * Main search and discovery page for short-lets
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchResults } from '@/components/shortlet/SearchResults';
import { DiscoverySection } from '@/components/shortlet/DiscoverySection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth';
import { Search, Sparkles } from 'lucide-react';

export function ShortletSearchPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [showDiscovery, setShowDiscovery] = useState(true);

  // Get initial filters from URL params
  const initialFilters = {
    location: searchParams.get('location') || undefined,
    checkin_date: searchParams.get('checkin_date') || undefined,
    checkout_date: searchParams.get('checkout_date') || undefined,
    guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined,
    min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
    sort_by: (searchParams.get('sort_by') || 'popular') as any,
  };

  // Check if there are any active search filters
  useEffect(() => {
    const hasFilters = Object.values(initialFilters).some(v => v !== undefined);
    setShowDiscovery(!hasFilters);
  }, [searchParams]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Find Your Perfect Stay</h1>
          <p className="text-muted-foreground mt-2">
            Discover amazing short-let properties across Nigeria
          </p>
        </div>
      </div>

      <Tabs defaultValue={showDiscovery ? 'discover' : 'search'} className="w-full">
        <TabsList>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Sparkles className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <SearchResults initialFilters={initialFilters} />
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <DiscoverySection 
            userId={user?.id}
            location={initialFilters.location}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

