import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PropertySelector({ value, onChange }: PropertySelectorProps) {
  const [properties, setProperties] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('properties')
          .select('id, title')
          .order('title');

        if (error) {
          throw error;
        }

        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Property</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="property">Property</Label>
      <Select value={value} onValueChange={onChange} required>
        <SelectTrigger id="property">
          <SelectValue placeholder="Select a property" />
        </SelectTrigger>
        <SelectContent>
          {properties.length > 0 ? (
            properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.title}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-properties" disabled>
              No properties available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
