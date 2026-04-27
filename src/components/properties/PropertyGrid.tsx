import { Property } from '@/services/property';
import { PropertyCard } from './PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPreferences } from '@/types/preferences';
import { getPreferenceMatchScore } from '@/utils/preferenceFilters';

interface PropertyGridProps {
  properties: Property[];
  preferences?: UserPreferences | null;
  showMatchScore?: boolean;
  isLoading?: boolean;
  onEdit?: (property: Property) => void;
  onCreateShortlet?: (propertyId: string) => void;
  onRefresh?: () => void;
}

export function PropertyGrid({
  properties,
  preferences,
  showMatchScore = false,
  isLoading = false,
  onEdit,
  onCreateShortlet,
  onRefresh,
}: PropertyGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg">
            <Skeleton className="h-48 w-full" />
            <div className="space-y-2 p-4">
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
      <div className="rounded-lg border p-10 text-center">
        <h3 className="mb-2 text-lg font-medium">No properties found</h3>
        <p className="mb-4 text-muted-foreground">
          There are no properties matching your filters. Try adjusting your search or add a new
          property.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          matchScore={
            showMatchScore && preferences
              ? getPreferenceMatchScore(property, preferences) * 100
              : undefined
          }
          onEdit={onEdit}
          onCreateShortlet={onCreateShortlet}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
