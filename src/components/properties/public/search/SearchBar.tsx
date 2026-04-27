import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  propertyType: string;
  setPropertyType: (type: string) => void;
  location: string;
  setLocation: (location: string) => void;
  locations: string[];
}

export function SearchBar({
  searchQuery,
  setSearchQuery,
  propertyType,
  setPropertyType,
  location,
  setLocation,
  locations,
}: SearchBarProps) {
  return (
    <div className="mx-auto mb-4 flex max-w-4xl flex-col gap-3 sm:flex-row">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by property name or location"
          className="rounded-xl border-border bg-background pl-9 dark:bg-card/80"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Select value={propertyType} onValueChange={setPropertyType}>
        <SelectTrigger className="w-full rounded-xl border-border bg-background dark:bg-card/80 sm:w-[180px]">
          <SelectValue placeholder="Property Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="residential">Residential</SelectItem>
          <SelectItem value="commercial">Commercial</SelectItem>
          <SelectItem value="industrial">Industrial</SelectItem>
        </SelectContent>
      </Select>
      <Select value={location} onValueChange={setLocation}>
        <SelectTrigger className="w-full rounded-xl border-border bg-background dark:bg-card/80 sm:w-[180px]">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
