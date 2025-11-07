
import { Property } from '@/services/property';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface PropertyHeaderProps {
  property: Property;
}

export const PropertyHeader = ({ property }: PropertyHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{property.name}</h1>
        <div className="flex items-center mt-2 text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{property.location}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={property.status === 'Available' ? 'default' : 'secondary'}>
          {property.status}
        </Badge>
        <Badge variant="outline" className="border-primary text-primary">
          {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || 'Property'}
        </Badge>
      </div>
    </div>
  );
};
