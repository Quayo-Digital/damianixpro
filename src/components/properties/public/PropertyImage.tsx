import { Property } from '@/services/property';

interface PropertyImageProps {
  property: Property;
}

export const PropertyImage = ({ property }: PropertyImageProps) => {
  return (
    <div className="aspect-video overflow-hidden rounded-lg bg-muted">
      <img
        src={property.imageUrl || '/placeholder.svg'}
        alt={property.name}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
};
