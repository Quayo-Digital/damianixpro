/**
 * Short-Let Listings Page
 * Comprehensive listings list with search, filters, and management
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShortletListingCard } from '@/components/shortlet/ShortletListingCard';
import { SearchFiltersComponent, SearchFilters } from '@/components/shortlet/SearchFilters';
import { searchListings, getOwnerListings } from '@/services/shortlet/api/listings';
import { useAuth } from '@/contexts/auth';
import { 
  Search, 
  Grid3x3, 
  List, 
  Plus, 
  Filter,
  Loader2,
  Calendar,
  MapPin,
  TrendingUp,
  Sparkles,
  Home
} from 'lucide-react';
import type { Listing } from '@/services/shortlet/types';
import { ShortletListingForm } from '@/components/shortlet/ShortletListingForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShortletListingsPageProps {
  mode?: 'public' | 'owner';
}

export function ShortletListingsPage({ mode = 'public' }: ShortletListingsPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userRole } = useAuth();
  const isOwner = userRole === 'owner';
  const isOwnerMode = mode === 'owner' || (isOwner && searchParams.get('mode') === 'owner');

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 12;

  const [filters, setFilters] = useState<SearchFilters>({
    location: searchParams.get('location') || undefined,
    checkin_date: searchParams.get('checkin_date') || undefined,
    checkout_date: searchParams.get('checkout_date') || undefined,
    guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined,
    min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
    sort_by: (searchParams.get('sort_by') || 'popular') as any,
  });

  // Load listings
  useEffect(() => {
    loadListings();
  }, [filters, page, isOwnerMode, user?.id]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.location) params.set('location', filters.location);
    if (filters.checkin_date) params.set('checkin_date', filters.checkin_date);
    if (filters.checkout_date) params.set('checkout_date', filters.checkout_date);
    if (filters.guests) params.set('guests', filters.guests.toString());
    if (filters.min_price) params.set('min_price', filters.min_price.toString());
    if (filters.max_price) params.set('max_price', filters.max_price.toString());
    if (filters.sort_by) params.set('sort_by', filters.sort_by);
    if (isOwnerMode) params.set('mode', 'owner');
    
    setSearchParams(params, { replace: true });
  }, [filters, searchQuery, isOwnerMode]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      if (isOwnerMode && user?.id) {
        // Load owner's listings
        const ownerListings = await getOwnerListings(user.id);
        setListings(ownerListings);
        setTotalCount(ownerListings.length);
        setHasMore(false);
      } else {
        // Search all listings
        const result = await searchListings({
          query: searchQuery || undefined,
          ...filters,
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
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadListings();
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleListingClick = (listingId: string) => {
    if (isOwnerMode) {
      navigate(`/owner/shortlets/${listingId}`);
    } else {
      navigate(`/shortlets/${listingId}`);
    }
  };

  const handleCreateSuccess = (listingId: string) => {
    setShowCreateDialog(false);
    navigate(`/owner/shortlets/${listingId}`);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold">
              {isOwnerMode ? 'My Short-Let Listings' : 'Find Your Perfect Stay'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isOwnerMode 
                ? 'Manage your short-let listings and bookings'
                : 'Discover amazing short-let properties across Nigeria'}
            </p>
          </div>
        </div>
        {isOwnerMode && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Listing
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isOwnerMode 
                  ? "Search your listings..." 
                  : "Search by location, property name, or amenities..."}
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
            {!isOwnerMode && (
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {!isOwnerMode && showFilters && (
        <SearchFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={() => {
            setFilters({});
            setSearchQuery('');
            setPage(1);
          }}
        />
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'listing' : 'listings'} found` : 'No listings found'}
          </h2>
          {filters.location && (
            <p className="text-sm text-muted-foreground">in {filters.location}</p>
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

      {/* Listings */}
      {isLoading && listings.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-4">
              {isOwnerMode 
                ? "You haven't created any short-let listings yet. Create your first one to get started!"
                : "Try adjusting your search criteria or filters"}
            </p>
            {isOwnerMode ? (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            ) : (
              <Button variant="outline" onClick={() => {
                setFilters({});
                setSearchQuery('');
                setPage(1);
              }}>
                Clear Filters
              </Button>
            )}
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
                showActions={isOwnerMode}
                viewMode={viewMode}
                onEdit={isOwnerMode ? (id) => navigate(`/owner/shortlets/${id}`) : undefined}
                onDelete={isOwnerMode ? async (id) => {
                  // TODO: Implement delete functionality
                  console.log('Delete listing:', id);
                } : undefined}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && !isOwnerMode && (
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

      {/* Create Listing Dialog */}
      {isOwnerMode && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Short-Let Listing</DialogTitle>
              <DialogDescription>
                Add a new short-let listing to start accepting bookings
              </DialogDescription>
            </DialogHeader>
            <ShortletListingForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ShortletListingsPage;

