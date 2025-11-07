
import { Property } from '@/services/property';

interface PropertyImageProps {
  property: Property;
}

export const PropertyImage = ({ property }: PropertyImageProps) => {
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
      <img
        src={property.imageUrl || '/placeholder.svg'}
        alt={property.name}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
