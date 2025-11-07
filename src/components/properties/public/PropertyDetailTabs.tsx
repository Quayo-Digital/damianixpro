
import { Property } from '@/services/property';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        {property.tourUrl && <TabsTrigger value="tour">3D Tour</TabsTrigger>}
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          {property.bedrooms && (
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <Bed className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-semibold">{property.bedrooms}</span>
              <span className="text-sm text-muted-foreground">Bedrooms</span>
            </div>
          )}
          
          {property.bathrooms && (
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <Bath className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-semibold">{property.bathrooms}</span>
              <span className="text-sm text-muted-foreground">Bathrooms</span>
            </div>
          )}
          
          {property.squareFeet && (
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <Home className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-semibold">{property.squareFeet}</span>
              <span className="text-sm text-muted-foreground">Square Feet</span>
            </div>
          )}
          
          {property.availability_date && (
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <Calendar className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-semibold">Available</span>
              <span className="text-sm text-muted-foreground">{property.availability_date}</span>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">Description</h3>
          <p className="text-muted-foreground">{property.description || 'No description provided.'}</p>
        </div>
        
        {property.lease_terms && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Lease Terms</h3>
            <p className="text-muted-foreground">{property.lease_terms}</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="features">
        {property.features && property.features.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 py-4">
            {property.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-muted-foreground">No features listed for this property.</p>
        )}
        
        {property.amenities && property.amenities.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-2">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
              {property.amenities.map((amenity: string, index: number) => (
                <div key={index} className="flex items-center">
                  <BadgeCheck className="h-4 w-4 text-primary mr-2" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </TabsContent>
      
      <TabsContent value="location">
        <div className="py-4">
          <h3 className="text-xl font-semibold mb-2">Location</h3>
          <p className="text-muted-foreground mb-4">{property.location}</p>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Map view would be displayed here.</p>
          </div>
        </div>
      </TabsContent>

      {property.tourUrl && (
        <TabsContent value="tour">
          <div className="py-4">
            <h3 className="text-xl font-semibold mb-2">Virtual Tour</h3>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <iframe
                src={property.tourUrl}
                title="3D Virtual Tour"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};
