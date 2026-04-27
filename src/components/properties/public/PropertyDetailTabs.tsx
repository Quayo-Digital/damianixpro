import { Property } from '@/services/property';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyVirtualTourViewer } from '@/components/properties/PropertyVirtualTourViewer';
import { PropertyDetailMap } from '@/components/properties/public/PropertyDetailMap';
import { Bed, Bath, Calendar, Home, Check, BadgeCheck } from 'lucide-react';

interface PropertyDetailTabsProps {
  property: Property;
}

export const PropertyDetailTabs = ({ property }: PropertyDetailTabsProps) => {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        {((property.images && property.images.length > 0) || property.tourUrl) && (
          <TabsTrigger value="tour">Virtual Tour</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4 py-4 md:grid-cols-4">
          {property.bedrooms && (
            <div className="flex flex-col items-center rounded-lg border p-3">
              <Bed className="mb-1 h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{property.bedrooms}</span>
              <span className="text-sm text-muted-foreground">Bedrooms</span>
            </div>
          )}

          {property.bathrooms && (
            <div className="flex flex-col items-center rounded-lg border p-3">
              <Bath className="mb-1 h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{property.bathrooms}</span>
              <span className="text-sm text-muted-foreground">Bathrooms</span>
            </div>
          )}

          {property.squareFeet && (
            <div className="flex flex-col items-center rounded-lg border p-3">
              <Home className="mb-1 h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{property.squareFeet}</span>
              <span className="text-sm text-muted-foreground">Square Feet</span>
            </div>
          )}

          {property.availability_date && (
            <div className="flex flex-col items-center rounded-lg border p-3">
              <Calendar className="mb-1 h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Available</span>
              <span className="text-sm text-muted-foreground">{property.availability_date}</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xl font-semibold">Description</h3>
          <p className="text-muted-foreground">
            {property.description || 'No description provided.'}
          </p>
        </div>

        {property.lease_terms && (
          <div>
            <h3 className="mb-2 text-xl font-semibold">Lease Terms</h3>
            <p className="text-muted-foreground">{property.lease_terms}</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="features">
        {property.features && property.features.length > 0 ? (
          <div className="grid grid-cols-2 gap-y-2 py-4 md:grid-cols-3">
            {property.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-muted-foreground">No features listed for this property.</p>
        )}

        {property.amenities && property.amenities.length > 0 && (
          <>
            <h3 className="mb-2 text-xl font-semibold">Amenities</h3>
            <div className="grid grid-cols-2 gap-y-2 md:grid-cols-3">
              {property.amenities.map((amenity: string, index: number) => (
                <div key={index} className="flex items-center">
                  <BadgeCheck className="mr-2 h-4 w-4 text-primary" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="location">
        <div className="py-4">
          <h3 className="mb-2 text-xl font-semibold">Location</h3>
          <p className="mb-4 text-muted-foreground">{property.location}</p>
          <PropertyDetailMap property={property} />
        </div>
      </TabsContent>

      {((property.images && property.images.length > 0) || property.tourUrl) && (
        <TabsContent value="tour">
          <div className="py-4">
            <PropertyVirtualTourViewer
              images={property.images || (property.imageUrl ? [property.imageUrl] : [])}
              tourUrl={property.tourUrl}
              propertyName={property.name}
            />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};
