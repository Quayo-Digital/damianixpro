
import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PriceRangeFilter } from './PriceRangeFilter';
import { BedroomFilter } from './BedroomFilter';
import { FeatureFilter } from './FeatureFilter';

interface AdvancedFiltersProps {
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
  activeFilterCount: number;
}

export function AdvancedFilters({
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
  activeFilterCount
}: AdvancedFiltersProps) {
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  
  // Handle feature selection
  const toggleFeature = (feature: string) => {
    setSelectedFeatures(
      selectedFeatures.includes(feature)
        ? selectedFeatures.filter(f => f !== feature)
        : [...selectedFeatures, feature]
    );
  };
  
  // Update main price range when popover closes
  const handlePopoverClose = () => {
    setPriceRange(localPriceRange);
    setIsAdvancedFilterOpen(false);
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      <Popover open={isAdvancedFilterOpen} onOpenChange={setIsAdvancedFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 md:w-96">
          <div className="space-y-4">
            <PriceRangeFilter 
              localPriceRange={localPriceRange}
              setLocalPriceRange={setLocalPriceRange}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />
            
            <BedroomFilter 
              bedroomsFilter={bedroomsFilter}
              setBedroomsFilter={setBedroomsFilter}
              bedroomOptions={bedroomOptions}
            />
            
            <FeatureFilter 
              selectedFeatures={selectedFeatures}
              toggleFeature={toggleFeature}
              availableFeatures={availableFeatures}
            />
            
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Reset Filters
              </Button>
              <Button size="sm" onClick={handlePopoverClose}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" /> Clear All
        </Button>
      )}
    </div>
  );
}
