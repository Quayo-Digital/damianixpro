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
import { useAuthSession } from '@/contexts/auth';
import { useOwnerSubscriptionAccess } from '@/hooks/useOwnerSubscriptionAccess';
import { OwnerSubscriptionGateBanner } from '@/components/owner/OwnerSubscriptionGateBanner';
import { toast } from 'sonner';
import { useSearchShortletListings, useOwnerShortletListings } from '@/hooks/useShortletListings';
import { logger } from '@/utils/logger';
import ErrorBoundary from '@/components/ErrorBoundary';
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
  Home,
  AlertCircle,
} from 'lucide-react';
import type { Listing } from '@/services/shortlet/types';
import { ShortletListingForm } from '@/components/shortlet/ShortletListingForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShortletListingsPageProps {
  mode?: 'public' | 'owner';
}

export function ShortletListingsPage({ mode = 'public' }: ShortletListingsPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userRole } = useAuthSession();
  const { hasPaidOwnerAccess, isCheckingAccess } = useOwnerSubscriptionAccess();
  const isOwner = userRole === 'owner';
  const isOwnerMode = mode === 'owner' || (isOwner && searchParams.get('mode') === 'owner');

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Initialize filters state BEFORE using it
  const [filters, setFilters] = useState<SearchFilters>({
    location: searchParams.get('location') || undefined,
    checkin_date: searchParams.get('checkin_date') || undefined,
    checkout_date: searchParams.get('checkout_date') || undefined,
    guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined,
    min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
    sort_by: (searchParams.get('sort_by') || 'popular') as any,
  });

  const openCreateListingDialog = () => {
    if (isCheckingAccess || !hasPaidOwnerAccess) {
      if (!isCheckingAccess) {
        toast.error('Subscribe or start a trial to create short-let listings.');
      }
      return;
    }
    setShowCreateDialog(true);
  };

  // Use React Query hooks
  const ownerListingsQuery = useOwnerShortletListings(isOwnerMode && user?.id ? user.id : null);
  const searchQueryResult = useSearchShortletListings({
    query: searchQuery || undefined,
    ...filters,
    page,
    page_size: pageSize,
  });

  // Determine which query to use
  const isOwnerModeActive = isOwnerMode && user?.id;
  const listingsQuery = isOwnerModeActive ? ownerListingsQuery : searchQueryResult;

  const rawListings =
    listingsQuery.data?.listings || (isOwnerModeActive ? ownerListingsQuery.data || [] : []);
  const listings = rawListings;

  const isLoading = listingsQuery.isLoading;
  const totalCount = isOwnerModeActive
    ? ownerListingsQuery.data?.length || 0
    : (searchQueryResult.data?.total ?? listings.length);
  const hasMore = !isOwnerModeActive && searchQueryResult.data?.listings?.length === pageSize;

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
  }, [filters, searchQuery, isOwnerMode, setSearchParams]);

  // Handle errors
  useEffect(() => {
    if (listingsQuery.error) {
      logger.error('Error loading listings', listingsQuery.error, {
        isOwnerMode,
        userId: user?.id,
      });

      // Show user-friendly error message for network errors
      if (
        listingsQuery.error instanceof Error &&
        (listingsQuery.error.message.includes('fetch') ||
          listingsQuery.error.message.includes('network') ||
          listingsQuery.error.message.includes('Failed to fetch'))
      ) {
        // Error will be handled by the UI (empty state or error boundary)
      }
    }
  }, [listingsQuery.error, isOwnerMode, user?.id]);

  const handleSearch = () => {
    setPage(1);
    // React Query will automatically refetch when searchQuery changes
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
    setPage((prev) => prev + 1);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto space-y-6 py-8">
        {isOwnerMode && <OwnerSubscriptionGateBanner />}
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <Home className="mr-2 h-5 w-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-3xl font-bold">
                {isOwnerMode ? 'My Short-Let Listings' : 'Find Your Perfect Stay'}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {isOwnerMode
                  ? 'Manage your short-let listings and bookings'
                  : 'Discover amazing short-let properties across Nigeria'}
              </p>
            </div>
          </div>
          {isOwnerMode && (
            <Button
              onClick={openCreateListingDialog}
              disabled={isCheckingAccess}
              title={
                !hasPaidOwnerAccess && !isCheckingAccess
                  ? 'Requires an active subscription or trial'
                  : undefined
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Listing
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder={
                    isOwnerMode
                      ? 'Search your listings...'
                      : 'Search by location, property name, or amenities...'
                  }
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
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="mr-2 h-4 w-4" />
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
              {totalCount > 0
                ? `${totalCount} ${totalCount === 1 ? 'listing' : 'listings'} found`
                : 'No listings found'}
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
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listingsQuery.error && isOwnerModeActive ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <h3 className="mb-2 text-lg font-semibold">Unable to load listings</h3>
              <p className="mb-4 text-muted-foreground">
                {listingsQuery.error instanceof Error &&
                (listingsQuery.error.message.includes('fetch') ||
                  listingsQuery.error.message.includes('network') ||
                  listingsQuery.error.message.includes('Failed to fetch'))
                  ? 'Network error: Please check your internet connection and try again.'
                  : 'An error occurred while loading listings. Please try again.'}
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <Loader2 className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : listings.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No listings found</h3>
              <p className="mb-4 text-muted-foreground">
                {isOwnerMode
                  ? "You haven't created any short-let listings yet. Create your first one to get started!"
                  : 'Try adjusting your search criteria or filters'}
              </p>
              {isOwnerMode ? (
                <Button
                  onClick={openCreateListingDialog}
                  disabled={isCheckingAccess}
                  title={
                    !hasPaidOwnerAccess && !isCheckingAccess
                      ? 'Requires an active subscription or trial'
                      : undefined
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Listing
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
              }
            >
              {listings.map((listing) => (
                <ShortletListingCard
                  key={listing.id}
                  listing={listing}
                  onView={handleListingClick}
                  showActions={isOwnerMode}
                  viewMode={viewMode}
                  onEdit={isOwnerMode ? (id) => navigate(`/owner/shortlets/${id}`) : undefined}
                  onDelete={
                    isOwnerMode
                      ? async (id) => {
                          // TODO: Implement delete functionality
                          console.log('Delete listing:', id);
                        }
                      : undefined
                  }
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && !isOwnerMode && (
              <div className="flex justify-center pt-6">
                <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
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
    </ErrorBoundary>
  );
}

export default ShortletListingsPage;
