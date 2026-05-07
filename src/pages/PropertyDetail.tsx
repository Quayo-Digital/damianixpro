import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PropertyVirtualTourViewer } from '@/components/properties/PropertyVirtualTourViewer';
import { PropertyInformation } from '@/components/properties/PropertyInformation';
import { PropertyDetailsCard } from '@/components/properties/PropertyDetailsCard';
import { PropertyTabs } from '@/components/properties/PropertyTabs';
import { EditPropertyDialog } from '@/components/properties/EditPropertyDialog';
import { getPropertyById } from '@/services/property';
import { Property } from '@/services/property/types';
import { useAuthSession } from '@/contexts/auth';
import { PageLoader } from '@/components/ui/PageLoader';
import { PropertyAnnouncementsManager } from '@/components/resident/PropertyAnnouncementsManager';
import { fetchUnitsForProperty } from '@/services/property/unitsApi';
import { listPropertyMedia } from '@/services/property/mediaService';
import { SectionTitle } from '@/components/ui/typography';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole, isLoading: authLoading, hasPermission } = useAuthSession();
  const canWriteProperties = hasPermission('properties.write');
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [videoUrls, setVideoUrls] = useState<Array<{ url: string; posterUrl?: string | null }>>([]);

  // Redirect tenants away from property management pages
  useEffect(() => {
    if (!authLoading && userRole === 'tenant') {
      // Tenants should use public property pages, not management pages
      if (id) {
        navigate(`/public/properties/${id}`, { replace: true });
      } else {
        navigate('/tenant/dashboard', { replace: true });
      }
    }
  }, [userRole, authLoading, navigate, id]);

  const {
    data: property,
    isLoading,
    isError,
    error,
  } = useQuery<Property, Error>({
    queryKey: ['property', id],
    queryFn: () => {
      if (!id) throw new Error('Property ID is not available');
      return getPropertyById(id);
    },
    enabled: !!id && !authLoading && userRole !== 'tenant',
    retry: false,
  });

  const { data: unitRows = [] } = useQuery({
    queryKey: ['property-units', id],
    queryFn: () => fetchUnitsForProperty(id!),
    enabled: !!id && !authLoading && userRole !== 'tenant',
  });

  const unitsCount = unitRows.length;
  const occupiedCount = unitRows.filter((u) => u.status === 'occupied').length;
  const occupancyRate = unitsCount > 0 ? Math.round((occupiedCount / unitsCount) * 100) : 0;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const loadMedia = async () => {
      try {
        const items = await listPropertyMedia(id, true);
        if (cancelled) return;
        setVideoUrls(
          items
            .filter((item) => item.mediaType === 'video' && Boolean(item.deliveryUrl))
            .map((item) => ({ url: item.deliveryUrl as string, posterUrl: item.posterUrl }))
        );
      } catch {
        if (!cancelled) setVideoUrls([]);
      }
    };
    void loadMedia();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Show loader while checking auth
  if (authLoading) {
    return <PageLoader />;
  }

  // Don't render if tenant (will be redirected)
  if (userRole === 'tenant') {
    return <PageLoader />;
  }

  // Show loader while loading property
  if (isLoading) {
    return <PageLoader />;
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
      <PageContent title={property.name} description={property.location}>
        <div className="mb-5 sm:mb-6">
          <Button asChild variant="outline">
            <Link to="/properties">
              <ArrowLeft className="mr-2" />
              Back to Properties
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5 sm:mb-6">
              <SectionTitle className="mb-3 sm:mb-4">Property View</SectionTitle>
              <PropertyVirtualTourViewer
                images={property.images || (property.imageUrl ? [property.imageUrl] : [])}
                videos={videoUrls}
                tourUrl={property.tourUrl}
                propertyName={property.name}
              />
            </div>
            <PropertyInformation
              description={property.description || ''}
              features={property.features || []}
            />
            {property.transaction_type === 'LEASE' && (
              <PropertyUnitsManager
                propertyId={property.id}
                propertyName={property.name}
                readOnly={!canWriteProperties}
              />
            )}
          </div>

          <div>
            <PropertyDetailsCard
              status={property.status || 'Unknown'}
              rent={property.price || ''}
              size={property.squareFeet || ''}
              bedrooms={property.bedrooms ? Number(property.bedrooms) : 0}
              bathrooms={property.bathrooms ? Number(property.bathrooms) : 0}
              units={unitsCount}
              occupancyRate={occupancyRate}
              propertyId={property.id}
              propertyOwnerId={property.owner_id}
              onManageProperty={() => setIsEditDialogOpen(true)}
            />
            <PropertyAnnouncementsManager propertyId={property.id} readOnly={!canWriteProperties} />
            <PropertyTabs />
          </div>
        </div>

        {property && canWriteProperties && (
          <EditPropertyDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            property={property}
            onPropertyUpdated={() => {
              if (id) {
                queryClient.invalidateQueries({ queryKey: ['property', id] });
                queryClient.invalidateQueries({ queryKey: ['property-units', id] });
              }
            }}
          />
        )}
      </PageContent>
    </PageLayout>
  );
};

export default PropertyDetail;
