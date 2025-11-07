/**
 * Search Results Component
 * Displays search results with pagination and sorting
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShortletListingCard } from './ShortletListingCard';
import { SearchFiltersComponent, SearchFilters } from './SearchFilters';
import { searchListings } from '@/services/shortlet/api/listings';
import { Loader2, Search, Grid3x3, List, Map } from 'lucide-react';
import type { Listing } from '@/services/shortlet/types';
import { useNavigate } from 'react-router-dom';

interface SearchResultsProps {
  initialFilters?: SearchFilters;
  onListingClick?: (listingId: string) => void;
}

export function SearchResults({ initialFilters, onListingClick }: SearchResultsProps) {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 12;

  useEffect(() => {
    performSearch();
  }, [filters, page]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const result = await searchListings({
        query: searchQuery || undefined,
        location: filters.location,
        checkin_date: filters.checkin_date,
        checkout_date: filters.checkout_date,
        guests: filters.guests,
        min_price: filters.min_price,
        max_price: filters.max_price,
        amenities: filters.amenities,
        instant_book: filters.instant_book,
        sort_by: filters.sort_by || 'popular',
        page,
        page_size: pageSize
      });

      if (page === 1) {
        setListings(result.listings);
      } else {
        setListings(prev => [...prev, ...result.listings]);
      }

      setTotalCount(result.total);
      setHasMore(result.listings.length === pageSize);
    } catch (error) {
      console.error('Error searching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    performSearch();
  };

  const handleListingClick = (listingId: string) => {
    if (onListingClick) {
      onListingClick(listingId);
    } else {
      navigate(`/shortlets/${listingId}`);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location, property name, or amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <SearchFiltersComponent
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
        onReset={() => {
          setSearchQuery('');
          setPage(1);
        }}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {totalCount > 0 ? `${totalCount} listings found` : 'No listings found'}
          </h2>
          {filters.location && (
            <p className="text-muted-foreground">in {filters.location}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading && listings.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No listings match your search criteria</p>
            <Button variant="outline" onClick={() => {
              setFilters({});
              setSearchQuery('');
              setPage(1);
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {listings.map(listing => (
              <ShortletListingCard
                key={listing.id}
                listing={listing}
                onView={handleListingClick}
                showActions={false}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

