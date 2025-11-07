
import { Property } from '@/services/property';
import { PropertyCard } from './PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyGridProps {
  properties: Property[];
  isLoading?: boolean;
  onEdit?: (property: Property) => void;
  onRefresh?: () => void;
}

export function PropertyGrid({ properties, isLoading = false, onEdit, onRefresh }: PropertyGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (properties.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg">
        <h3 className="font-medium text-lg mb-2">No properties found</h3>
        <p className="text-muted-foreground mb-4">
          There are no properties matching your filters. Try adjusting your search or add a new property.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard 
          key={property.id} 
          property={property} 
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
