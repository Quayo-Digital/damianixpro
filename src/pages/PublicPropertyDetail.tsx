import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { withSearchParam } from '@/utils/authRedirect';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { RentalApplicationDialog } from '@/components/applications/RentalApplicationDialog';
import { useAuthSession } from '@/contexts/auth';
import { Property, getPropertyById } from '@/services/property';
import { PropertyDetailLoading } from '@/components/properties/public/PropertyDetailLoading';
import { PropertyNotFound } from '@/components/properties/public/PropertyNotFound';
import { PropertyHeader } from '@/components/properties/public/PropertyHeader';
import { PropertyImage } from '@/components/properties/public/PropertyImage';
import { PropertyDetailTabs } from '@/components/properties/public/PropertyDetailTabs';
import { PropertyActionCard } from '@/components/properties/public/PropertyActionCard';
import { useMessages } from '@/hooks/useMessages';
import { sendViewingRequestNotification } from '@/services/notifications/property';
import { listPropertyMedia } from '@/services/property/mediaService';

const PublicPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuthSession();

  const goToAuth = useCallback(
    (withApplyIntent: boolean) => {
      const from = withApplyIntent ? withSearchParam(location, 'apply', '1') : location;
      navigate('/auth', { state: { from } });
    },
    [location, navigate]
  );
  const { getMessage } = useMessages();
  const [videoUrls, setVideoUrls] = useState<Array<{ url: string; posterUrl?: string | null }>>([]);

  // Use React Query for better state management and caching
  const {
    data: property,
    isLoading,
    isError,
    error,
  } = useQuery<Property | null, Error>({
    queryKey: ['public-property', id],
    queryFn: async () => {
      if (!id) {
        const message = getMessage('property_id_missing_error', 'Property ID is missing');
        toast.error(message.title);
        navigate('/public/properties');
        return null;
      }

      try {
        const propertyData = await getPropertyById(id);

        if (!propertyData) {
          const message = getMessage('property_not_found_error', 'Property not found');
          toast.error(message.title);
          navigate('/public/properties');
          return null;
        }

        return propertyData;
      } catch (error) {
        console.error('Failed to fetch property details:', error);
        const message = getMessage('property_fetch_error', 'Could not load property details.');
        toast.error(message.title);
        navigate('/public/properties');
        throw error;
      }
    },
    enabled: !!id,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // After sign-in, URL may include ?apply=1 — open the application form and clean the query
  useEffect(() => {
    if (!property || !user) return;
    const params = new URLSearchParams(location.search.replace(/^\?/, ''));
    if (params.get('apply') !== '1') return;
    setIsApplicationDialogOpen(true);
    params.delete('apply');
    const qs = params.toString();
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true });
  }, [property?.id, user?.id, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!property?.id) return;
    let cancelled = false;
    const loadMedia = async () => {
      try {
        const items = await listPropertyMedia(property.id, true);
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
  }, [property?.id]);

  const handleApplyClick = () => {
    if (!isAuthenticated()) {
      toast.info('Sign in to apply', {
        description: 'You’ll return to this property to complete your application.',
      });
      goToAuth(true);
      return;
    }

    setIsApplicationDialogOpen(true);
  };

  const handleRequestViewingClick = async () => {
    if (!isAuthenticated() || !user) {
      const message = getMessage(
        'request_viewing_unauthenticated_error',
        'Please sign in to request a viewing'
      );
      toast.error(message.title, {
        action: {
          label: 'Sign In',
          onClick: () => goToAuth(false),
        },
      });
      return;
    }

    if (!property?.agent_id) {
      toast.error(
        "This property doesn't have an agent assigned and a viewing cannot be requested."
      );
      return;
    }

    const { success } = await sendViewingRequestNotification(property.agent_id, property, user);

    if (!success) {
      toast.error('There was an issue sending the viewing request. Please try again.');
      return;
    }

    const message = getMessage(
      'request_viewing_success',
      'Viewing request sent!',
      'An agent will contact you shortly to schedule a viewing.'
    );
    toast.success(message.title, {
      description: message.description,
    });
  };

  const handleContactAgentClick = () => {
    if (!isAuthenticated()) {
      const message = getMessage(
        'contact_agent_unauthenticated_error',
        'Please sign in to contact an agent'
      );
      toast.error(message.title, {
        action: {
          label: 'Sign In',
          onClick: () => goToAuth(false),
        },
      });
      return;
    }

    const message = getMessage(
      'contact_agent_success',
      'An agent will be in touch with you shortly.',
      'You can also reach us at support@example.com for any queries.'
    );
    toast.info(message.title, {
      description: message.description,
    });
  };

  // Show loading state
  if (isLoading) {
    return <PropertyDetailLoading />;
  }

  // Show error state
  if (isError || !property) {
    return <PropertyNotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-8 transition-opacity duration-300">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/public/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <PropertyHeader property={property} />
            <PropertyImage property={property} />
            <PropertyDetailTabs property={property} videoUrls={videoUrls} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <PropertyActionCard
            property={property}
            onApplyClick={handleApplyClick}
            onRequestViewingClick={handleRequestViewingClick}
            onContactAgentClick={handleContactAgentClick}
          />

          {/* More properties suggestion would go here */}
        </div>
      </div>

      <RentalApplicationDialog
        propertyId={property.id}
        propertyName={property.name}
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
      />
    </div>
  );
};

export default PublicPropertyDetail;
