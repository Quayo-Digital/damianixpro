
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { PropertyInformation } from '@/components/properties/PropertyInformation';
import { PropertyDetailsCard } from '@/components/properties/PropertyDetailsCard';
import { PropertyTabs } from '@/components/properties/PropertyTabs';
import { getPropertyById } from '@/services/property';
import { Property } from '@/services/property/types';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: property, isLoading, isError, error } = useQuery<Property, Error>({
    queryKey: ['property', id],
    queryFn: () => {
      if (!id) throw new Error("Property ID is not available");
      return getPropertyById(id);
    },
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <PageContent title="Loading...">
          <p>Loading property details...</p>
        </PageContent>
      </PageLayout>
    );
  }
  
  if (isError) {
    return (
      <PageLayout>
        <PageContent title="Error">
          <p>Could not load property details. {error?.message}</p>
          <Button asChild className="mt-4">
            <Link to="/properties">
              <ArrowLeft className="mr-2" />
              Back to Properties
            </Link>
          </Button>
        </PageContent>
      </PageLayout>
    );
  }

  if (!property) {
    return (
      <PageLayout>
        <PageContent title="Property Not Found">
          <p>The property you are looking for does not exist.</p>
          <Button asChild className="mt-4">
            <Link to="/properties">
              <ArrowLeft className="mr-2" />
              Back to Properties
            </Link>
          </Button>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent 
        title={property.name}
        description={property.location}
      >
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link to="/properties">
              <ArrowLeft className="mr-2" />
              Back to Properties
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PropertyGallery images={property.images || (property.imageUrl ? [property.imageUrl] : [])} />
            {property.tourUrl && (
              <div className="mt-6">
                <h3 className="text-2xl font-semibold mb-4">3D Virtual Tour</h3>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={property.tourUrl}
                    title="3D Virtual Tour"
                    allowFullScreen
                    className="w-full h-full border-0"
                  ></iframe>
                </div>
              </div>
            )}
            <PropertyInformation 
              description={property.description || ''}
              features={property.features || []} 
            />
          </div>

          <div>
            <PropertyDetailsCard 
              status={property.status || 'Unknown'}
              rent={property.price || ''}
              size={property.squareFeet || ''}
              bedrooms={property.bedrooms ? Number(property.bedrooms) : 0}
              bathrooms={property.bathrooms ? Number(property.bathrooms) : 0}
              units={0} // Default value, update if you have this data
              occupancyRate={0} // Default value, update if you have this data
            />
            <PropertyTabs />
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default PropertyDetail;
