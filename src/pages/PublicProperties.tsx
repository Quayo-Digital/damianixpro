import React, { useCallback, useEffect, useState } from 'react';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { PropertySearchHero } from '@/components/properties/public/PropertySearchHero';
import { PropertyListings } from '@/components/properties/public/PropertyListings';
import { PropertyCTA } from '@/components/properties/public/PropertyCTA';
import { Link, useLocation } from 'react-router-dom';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/contexts/auth';
import { Badge } from '@/components/ui/badge';
import { Home, LogIn, User, List, Map as MapIcon, Filter } from 'lucide-react';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const PublicProperties = () => {
  const locationState = useLocation();
  const { user, userRole } = useAuthSession();
  const propertySearchProps = usePublicProperties();
  const [view, setView] = useState<'list' | 'map'>('list');
  const preferredAreas = propertySearchProps.preferences?.preferred_areas ?? [];
  const selectedCities = Array.from(
    new Set(
      preferredAreas
        .map((area) =>
          area
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
            .pop()
        )
        .filter((city): city is string => Boolean(city))
    )
  );
  const aiFilterActive = !!user && preferredAreas.length > 0;
  const salesModeActive = propertySearchProps.transactionType === 'SALE';
  const isDev = import.meta.env.DEV;
  const cityLabel =
    selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} locations`;

  /** Apply URL query to filter state (also used when CTA links target the same URL — RR may not re-navigate). */
  const applyFiltersFromSearch = useCallback(
    (search: string) => {
      const raw = search.startsWith('?') ? search.slice(1) : search;
      const params = new URLSearchParams(raw);
      const typeParam = params.get('type');
      const transactionParam = params.get('transaction');
      const locationParam = params.get('location');
      const viewParam = params.get('view');

      if (typeParam) {
        propertySearchProps.setPropertyType(typeParam);
      }

      if (locationParam) {
        propertySearchProps.setLocation(locationParam);
      }

      if (transactionParam) {
        const normalizedTransaction = transactionParam.toUpperCase();
        if (normalizedTransaction === 'SALE' || normalizedTransaction === 'LEASE') {
          propertySearchProps.setTransactionType(normalizedTransaction);
        }
      }

      if (viewParam === 'list' || viewParam === 'map') {
        setView(viewParam);
      }

      propertySearchProps.paginate(1);
    },
    [
      propertySearchProps.setPropertyType,
      propertySearchProps.setLocation,
      propertySearchProps.setTransactionType,
      propertySearchProps.paginate,
    ]
  );

  useEffect(() => {
    applyFiltersFromSearch(locationState.search);
  }, [locationState.search, applyFiltersFromSearch]);

  const handleSwitchCity = (city: string) => {
    propertySearchProps.setLocation(city);
    propertySearchProps.paginate(1);
  };

  return (
    <div className="mesh-surface flex min-h-screen flex-col bg-background">
      {/* Public Navigation Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 text-foreground shadow-sm backdrop-blur-xl dark:bg-background/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-r from-green-600 to-green-400 font-bold text-white">
                D
              </div>
              <span className="premium-title text-lg text-foreground">DamianixPro</span>
            </Link>

            <Link
              to="/public/properties"
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              <span>Properties</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/30 bg-background dark:bg-muted/30"
                asChild
              >
                <Link
                  to={getDefaultDashboardPathForRole(userRole as UserRole)}
                  className="flex items-center gap-1"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" className="rounded-full" asChild>
                <Link to="/auth" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  <span>Login / Register</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <PropertySearchHero
        searchQuery={propertySearchProps.searchQuery}
        setSearchQuery={propertySearchProps.setSearchQuery}
        propertyType={propertySearchProps.propertyType}
        setPropertyType={propertySearchProps.setPropertyType}
        location={propertySearchProps.location}
        setLocation={propertySearchProps.setLocation}
        locations={propertySearchProps.locations}
        priceRange={propertySearchProps.priceRange}
        setPriceRange={propertySearchProps.setPriceRange}
        minPrice={propertySearchProps.minPrice}
        maxPrice={propertySearchProps.maxPrice}
        bedroomsFilter={propertySearchProps.bedroomsFilter}
        setBedroomsFilter={propertySearchProps.setBedroomsFilter}
        bedroomOptions={propertySearchProps.bedroomOptions}
        selectedFeatures={propertySearchProps.selectedFeatures}
        setSelectedFeatures={propertySearchProps.setSelectedFeatures}
        availableFeatures={propertySearchProps.availableFeatures}
        clearFilters={propertySearchProps.clearFilters}
      />

      <main className="flex-grow">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {isDev && (
            <div className="mb-4 flex justify-end">
              <Badge variant="outline" className="rounded-full border-dashed">
                source: {propertySearchProps.publicDataSource.toUpperCase()} | supabase:{' '}
                {propertySearchProps.supabaseRowCount} | shown:{' '}
                {propertySearchProps.basePropertyCount}
              </Badge>
            </div>
          )}
          <div className="glass-panel mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl p-4 sm:flex-row">
            <h2 className="premium-title text-center text-2xl sm:text-left">
              {propertySearchProps.filteredProperties.length} Properties Available
            </h2>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 md:flex">
                <Filter className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Filtered Results</span>
              </div>
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => {
                  if (value) setView(value as 'list' | 'map');
                }}
                defaultValue="list"
                className="rounded-xl border border-border bg-muted/40 p-1 dark:bg-muted/25"
              >
                <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="map" aria-label="Map view" className="px-3">
                  <MapIcon className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {(aiFilterActive || salesModeActive) && (
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {aiFilterActive && (
                <Badge
                  variant="secondary"
                  className="rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-emerald-800"
                >
                  AI filter active: {cityLabel} ({preferredAreas.length} locations selected)
                </Badge>
              )}
              {salesModeActive && (
                <Badge
                  variant="secondary"
                  className="rounded-full border border-green-200 bg-green-50/90 px-3 py-1 text-green-800"
                >
                  Sales Mode: For Sale Only
                </Badge>
              )}
            </div>
          )}

          {view === 'list' ? (
            <PropertyListings
              loading={propertySearchProps.loading}
              preferences={propertySearchProps.preferences}
              preferencesLoading={propertySearchProps.preferencesLoading}
              salesModeActive={salesModeActive}
              filteredProperties={propertySearchProps.filteredProperties}
              currentProperties={propertySearchProps.currentProperties}
              currentPage={propertySearchProps.currentPage}
              totalPages={propertySearchProps.totalPages}
              onPageChange={propertySearchProps.paginate}
              onNextPage={propertySearchProps.nextPage}
              onPrevPage={propertySearchProps.prevPage}
              onSwitchCity={handleSwitchCity}
              onClearFilters={propertySearchProps.clearFilters}
            />
          ) : (
            <PropertyMap properties={propertySearchProps.filteredProperties} />
          )}
        </div>
      </main>

      {/* CTA Section */}
      <PropertyCTA applyFiltersFromSearch={applyFiltersFromSearch} />

      {/* Footer */}
      <GlobalFooter />
    </div>
  );
};

export default PublicProperties;
