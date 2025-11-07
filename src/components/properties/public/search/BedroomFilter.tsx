
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BedroomFilterProps {
  bedroomsFilter: string;
  setBedroomsFilter: (bedrooms: string) => void;
  bedroomOptions: string[];
}

export function BedroomFilter({
  bedroomsFilter,
  setBedroomsFilter,
  bedroomOptions
}: BedroomFilterProps) {
  return (
    <div>
      <h4 className="font-medium mb-2">Bedrooms</h4>
      <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Any number of bedrooms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any number of bedrooms</SelectItem>
          {bedroomOptions.map((bedCount) => (
            <SelectItem key={bedCount} value={bedCount}>{bedCount} bedrooms</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
