/**
 * Search Filters Component
 * Advanced filtering for short-let listings
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  DollarSign,
  MapPin,
  Users,
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Wind
} from 'lucide-react';

export interface SearchFilters {
  location?: string;
  checkin_date?: string;
  checkout_date?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
  instant_book?: boolean;
  sort_by?: 'price_low' | 'price_high' | 'newest' | 'popular';
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset?: () => void;
}

export function SearchFiltersComponent({ 
  filters, 
  onFiltersChange,
  onReset 
}: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [checkinDate, setCheckinDate] = useState<Date | undefined>(
    filters.checkin_date ? new Date(filters.checkin_date) : undefined
  );
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>(
    filters.checkout_date ? new Date(filters.checkout_date) : undefined
  );

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    updateFilter('amenities', updated);
  };

  const handleReset = () => {
    onFiltersChange({});
    setCheckinDate(undefined);
    setCheckoutDate(undefined);
    if (onReset) onReset();
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof SearchFilters] !== undefined && 
           filters[key as keyof SearchFilters] !== null &&
           (Array.isArray(filters[key as keyof SearchFilters]) 
             ? (filters[key as keyof SearchFilters] as any[]).length > 0
             : true)
  ).length;

  return (
    <div className="space-y-4">
      {/* Quick Filters Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Dates
              {checkinDate && checkoutDate && (
                <Badge variant="secondary" className="ml-2">
                  {format(checkinDate, 'MMM dd')} - {format(checkoutDate, 'MMM dd')}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div>
                <Label>Check-in</Label>
                <Calendar
                  mode="single"
                  selected={checkinDate}
                  onSelect={(date) => {
                    setCheckinDate(date);
                    if (date) {
                      updateFilter('checkin_date', format(date, 'yyyy-MM-dd'));
                    }
                  }}
                  disabled={(date) => date < new Date()}
                />
              </div>
              <Separator />
              <div>
                <Label>Check-out</Label>
                <Calendar
                  mode="single"
                  selected={checkoutDate}
                  onSelect={(date) => {
                    setCheckoutDate(date);
                    if (date) {
                      updateFilter('checkout_date', format(date, 'yyyy-MM-dd'));
                    }
                  }}
                  disabled={(date) => 
                    date < new Date() || 
                    (checkinDate && date <= checkinDate)
                  }
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Guests
              {filters.guests && (
                <Badge variant="secondary" className="ml-2">
                  {filters.guests}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <Label>Number of Guests</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={filters.guests || ''}
                onChange={(e) => updateFilter('guests', parseInt(e.target.value) || undefined)}
                placeholder="Enter number of guests"
              />
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Price
              {(filters.min_price || filters.max_price) && (
                <Badge variant="secondary" className="ml-2">
                  ₦{filters.min_price?.toLocaleString() || '0'} - ₦{filters.max_price?.toLocaleString() || '∞'}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <Label>Price Range (₦ per night)</Label>
              <div className="px-2">
                <Slider
                  min={0}
                  max={500000}
                  step={1000}
                  value={[filters.min_price || 0, filters.max_price || 500000]}
                  onValueChange={([min, max]) => {
                    updateFilter('min_price', min);
                    updateFilter('max_price', max);
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price || ''}
                  onChange={(e) => updateFilter('min_price', parseInt(e.target.value) || undefined)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price || ''}
                  onChange={(e) => updateFilter('max_price', parseInt(e.target.value) || undefined)}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          More Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
            <CardDescription>Refine your search with additional options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="City, area, or address"
                value={filters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value || undefined)}
              />
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'wifi', label: 'WiFi', icon: Wifi },
                  { key: 'parking', label: 'Parking', icon: Car },
                  { key: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
                  { key: 'pool', label: 'Pool', icon: Waves },
                  { key: 'air_conditioning', label: 'AC', icon: Wind },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={filters.amenities?.includes(key) || false}
                      onCheckedChange={() => toggleAmenity(key)}
                    />
                    <Label
                      htmlFor={key}
                      className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Instant Book */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="instant_book"
                checked={filters.instant_book || false}
                onCheckedChange={(checked) => updateFilter('instant_book', checked || undefined)}
              />
              <Label htmlFor="instant_book" className="cursor-pointer">
                Instant Book only
              </Label>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sort_by || 'popular'}
                onValueChange={(value) => updateFilter('sort_by', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

