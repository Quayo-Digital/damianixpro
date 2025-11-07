
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface FilterBadgesProps {
  propertyType: string;
  setPropertyType: (type: string) => void;
  location: string;
  setLocation: (location: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  bedroomsFilter: string;
  setBedroomsFilter: (bedrooms: string) => void;
  selectedFeatures: string[];
  toggleFeature: (feature: string) => void;
  activeFilterCount: number;
}

export function FilterBadges({
  propertyType,
  setPropertyType,
  location,
  setLocation,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  bedroomsFilter,
  setBedroomsFilter,
  selectedFeatures,
  toggleFeature,
  activeFilterCount
}: FilterBadgesProps) {
  // Format price for display
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };
  
  if (activeFilterCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
      {propertyType !== 'all' && (
        <Badge variant="secondary" className="flex gap-1 items-center">
          {propertyType}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setPropertyType('all')} />
        </Badge>
      )}
      {location !== 'all' && (
        <Badge variant="secondary" className="flex gap-1 items-center">
          {location}
          <X className="h-3 w-3 cursor-pointer" onClick={() => setLocation('all')} />
        </Badge>
      )}
      {(priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
        <Badge variant="secondary" className="flex gap-1 items-center">
          {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => setPriceRange([minPrice, maxPrice])} 
          />
        </Badge>
      )}
      {bedroomsFilter !== 'any' && (
        <Badge variant="secondary" className="flex gap-1 items-center">
          {bedroomsFilter} bedrooms
          <X className="h-3 w-3 cursor-pointer" onClick={() => setBedroomsFilter('any')} />
        </Badge>
      )}
      {selectedFeatures.map(feature => (
        <Badge key={feature} variant="secondary" className="flex gap-1 items-center">
          {feature}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => toggleFeature(feature)} 
          />
        </Badge>
      ))}
    </div>
  );
}
