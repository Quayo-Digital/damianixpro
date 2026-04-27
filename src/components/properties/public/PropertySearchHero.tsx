import { useState } from 'react';
import { SearchBar } from './search/SearchBar';
import { AdvancedFilters } from './search/AdvancedFilters';
import { FilterBadges } from './search/FilterBadges';

interface PropertySearchHeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  propertyType: string;
  setPropertyType: (type: string) => void;
  location: string;
  setLocation: (location: string) => void;
  locations: string[];
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  bedroomsFilter: string;
  setBedroomsFilter: (bedrooms: string) => void;
  bedroomOptions: string[];
  selectedFeatures: string[];
  setSelectedFeatures: (features: string[]) => void;
  availableFeatures: string[];
  clearFilters: () => void;
}

export function PropertySearchHero({
  searchQuery,
  setSearchQuery,
  propertyType,
  setPropertyType,
  location,
  setLocation,
  locations,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  bedroomsFilter,
  setBedroomsFilter,
  bedroomOptions,
  selectedFeatures,
  setSelectedFeatures,
  availableFeatures,
  clearFilters,
}: PropertySearchHeroProps) {
  // Toggle feature helper function to pass down to components
  const toggleFeature = (feature: string) => {
    setSelectedFeatures(
      selectedFeatures.includes(feature)
        ? selectedFeatures.filter((f) => f !== feature)
        : [...selectedFeatures, feature]
    );
  };

  // Count active filters
  const activeFilterCount =
    (propertyType !== 'all' ? 1 : 0) +
    (location !== 'all' ? 1 : 0) +
    (priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 1 : 0) +
    (bedroomsFilter !== 'any' ? 1 : 0) +
    selectedFeatures.length;

  return (
    <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-4 pb-10 pt-12 md:pt-16">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="premium-title mb-3 text-3xl text-foreground sm:text-4xl lg:text-5xl">
          Find your next place
        </h1>
        <p className="mx-auto mb-2 max-w-3xl text-base text-muted-foreground sm:text-lg">
          Search and filter when you need to — start with location and keywords.
        </p>
        <p className="mx-auto mb-8 max-w-2xl text-sm text-muted-foreground/90">
          Use <span className="font-medium text-foreground/80">More filters</span> only when you
          want to narrow price, bedrooms, or features.
        </p>

        <div className="glass-panel space-y-4 rounded-2xl p-4 md:p-5">
          {/* Basic search bar */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            propertyType={propertyType}
            setPropertyType={setPropertyType}
            location={location}
            setLocation={setLocation}
            locations={locations}
          />

          {/* Advanced filters */}
          <AdvancedFilters
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            minPrice={minPrice}
            maxPrice={maxPrice}
            bedroomsFilter={bedroomsFilter}
            setBedroomsFilter={setBedroomsFilter}
            bedroomOptions={bedroomOptions}
            selectedFeatures={selectedFeatures}
            setSelectedFeatures={setSelectedFeatures}
            availableFeatures={availableFeatures}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
          />

          {/* Active filter badges */}
          <FilterBadges
            propertyType={propertyType}
            setPropertyType={setPropertyType}
            location={location}
            setLocation={setLocation}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            minPrice={minPrice}
            maxPrice={maxPrice}
            bedroomsFilter={bedroomsFilter}
            setBedroomsFilter={setBedroomsFilter}
            selectedFeatures={selectedFeatures}
            toggleFeature={toggleFeature}
            activeFilterCount={activeFilterCount}
          />
        </div>
      </div>
    </div>
  );
}
