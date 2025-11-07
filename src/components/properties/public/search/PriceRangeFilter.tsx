
import { Slider } from '@/components/ui/slider';

interface PriceRangeFilterProps {
  localPriceRange: [number, number];
  setLocalPriceRange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
}

export function PriceRangeFilter({
  localPriceRange,
  setLocalPriceRange,
  minPrice,
  maxPrice
}: PriceRangeFilterProps) {
  // Format price for display
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };
  
  return (
    <div>
      <h4 className="font-medium mb-2">Price Range</h4>
      <div className="pt-5 px-2">
        <Slider
          defaultValue={localPriceRange}
          value={localPriceRange} 
          min={minPrice}
          max={maxPrice}
          step={10000}
          onValueChange={(value) => setLocalPriceRange(value as [number, number])}
          className="mb-6"
        />
        <div className="flex justify-between text-sm">
          <div>{formatPrice(localPriceRange[0])}</div>
          <div>{formatPrice(localPriceRange[1])}</div>
        </div>
      </div>
    </div>
  );
}
