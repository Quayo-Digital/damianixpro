
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { RentalApplicationDialog } from '@/components/applications/RentalApplicationDialog';
import { useAuth } from '@/contexts/auth';
import { Property, getPropertyById } from '@/services/property';
import { PropertyDetailLoading } from '@/components/properties/public/PropertyDetailLoading';
import { PropertyNotFound } from '@/components/properties/public/PropertyNotFound';
import { PropertyHeader } from '@/components/properties/public/PropertyHeader';
import { PropertyImage } from '@/components/properties/public/PropertyImage';
import { PropertyDetailTabs } from '@/components/properties/public/PropertyDetailTabs';
import { PropertyActionCard } from '@/components/properties/public/PropertyActionCard';
import { useMessages } from '@/hooks/useMessages';
import { sendViewingRequestNotification } from '@/services/notifications/property';

const PublicPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { getMessage } = useMessages();
  
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      
      if (!id) {
        const message = getMessage('property_id_missing_error', 'Property ID is missing');
        toast.error(message.title);
        navigate('/public/properties');
        setLoading(false);
        return;
      }

      try {
        const propertyData = await getPropertyById(id);
        
        if (propertyData) {
          setProperty(propertyData);
        } else {
          const message = getMessage('property_not_found_error', 'Property not found');
          toast.error(message.title);
          navigate('/public/properties');
        }
      } catch (error) {
        console.error('Failed to fetch property details:', error);
        const message = getMessage('property_fetch_error', 'Could not load property details.');
        toast.error(message.title);
        navigate('/public/properties');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id, navigate, getMessage]);

  const handleApplyClick = () => {
    if (!isAuthenticated()) {
      const message = getMessage('apply_unauthenticated_error', 'Please sign in to apply for this property');
      toast.error(message.title, {
        action: {
          label: "Sign In",
          onClick: () => navigate('/auth')
        }
      });
      return;
    }
    
    setIsApplicationDialogOpen(true);
  };

  const handleRequestViewingClick = async () => {
    if (!isAuthenticated() || !user) {
      const message = getMessage('request_viewing_unauthenticated_error', 'Please sign in to request a viewing');
      toast.error(message.title, {
        action: {
          label: "Sign In",
          onClick: () => navigate('/auth')
        }
      });
      return;
    }

    if (!property?.agent_id) {
      toast.error("This property doesn't have an agent assigned and a viewing cannot be requested.");
      return;
    }

    const { success } = await sendViewingRequestNotification(
      property.agent_id,
      property,
      user
    );

    if (!success) {
      toast.error("There was an issue sending the viewing request. Please try again.");
      return;
    }

    const message = getMessage('request_viewing_success', 'Viewing request sent!', 'An agent will contact you shortly to schedule a viewing.');
    toast.success(message.title, {
      description: message.description,
    });
  };

  const handleContactAgentClick = () => {
    if (!isAuthenticated()) {
      const message = getMessage('contact_agent_unauthenticated_error', 'Please sign in to contact an agent');
      toast.error(message.title, {
        action: {
          label: "Sign In",
          onClick: () => navigate('/auth')
        }
      });
      return;
    }

    const message = getMessage('contact_agent_success', 'An agent will be in touch with you shortly.', 'You can also reach us at support@example.com for any queries.');
    toast.info(message.title, {
      description: message.description,
    });
  };
  
  if (loading) {
    return <PropertyDetailLoading />;
  }

  if (!property) {
    return <PropertyNotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/public/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <PropertyHeader property={property} />
            <PropertyImage property={property} />
            <PropertyDetailTabs property={property} />
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
