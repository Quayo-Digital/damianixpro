
import React, { useState } from 'react';
import { usePublicProperties } from '@/hooks/usePublicProperties';
import { PropertySearchHero } from '@/components/properties/public/PropertySearchHero';
import { PropertyListings } from '@/components/properties/public/PropertyListings';
import { PropertyCTA } from '@/components/properties/public/PropertyCTA';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { Building2, Home, LogIn, User, List, Map as MapIcon, Filter } from 'lucide-react';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const PublicProperties = () => {
  const { user } = useAuth();
  const propertySearchProps = usePublicProperties();
  const [view, setView] = useState<'list' | 'map'>('list');
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Public Navigation Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-green-600 to-green-400 text-white font-bold w-8 h-8 flex items-center justify-center rounded">D</div>
              <span className="font-semibold text-lg">DamianixPro</span>
            </Link>
            
            <Link to="/public/properties" className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" />
              <span>Properties</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/properties" className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" asChild>
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-center sm:text-left">
              {propertySearchProps.filteredProperties.length} Properties Available
            </h2>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Filtered Results</span>
              </div>
              <ToggleGroup 
                type="single" 
                value={view} 
                onValueChange={(value) => { if (value) setView(value as 'list' | 'map') }} 
                defaultValue="list" 
                className="border rounded-md p-1"
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

          {view === 'list' ? (
            <PropertyListings
              loading={propertySearchProps.loading}
              filteredProperties={propertySearchProps.filteredProperties}
              currentProperties={propertySearchProps.currentProperties}
              currentPage={propertySearchProps.currentPage}
              totalPages={propertySearchProps.totalPages}
              onPageChange={propertySearchProps.paginate}
              onNextPage={propertySearchProps.nextPage}
              onPrevPage={propertySearchProps.prevPage}
              onClearFilters={propertySearchProps.clearFilters}
            />
          ) : (
            <PropertyMap properties={propertySearchProps.filteredProperties} />
          )}
        </div>
      </main>
      
      {/* CTA Section */}
      <PropertyCTA />

      {/* Footer */}
      <GlobalFooter />
    </div>
  );
};

export default PublicProperties;

