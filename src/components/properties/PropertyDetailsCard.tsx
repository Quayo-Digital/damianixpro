import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/contexts/auth';
import { toast } from 'sonner';

interface PropertyDetailsCardProps {
  status: string;
  rent: string;
  size: string;
  bedrooms: number;
  bathrooms: number;
  units: number;
  occupancyRate: number;
  propertyId?: string;
  propertyOwnerId?: string;
  onManageProperty?: () => void;
}

export function PropertyDetailsCard({
  status,
  rent,
  size,
  bedrooms,
  bathrooms,
  units,
  occupancyRate,
  propertyId,
  propertyOwnerId,
  onManageProperty,
}: PropertyDetailsCardProps) {
  const navigate = useNavigate();
  const { isOwner, user, isAuthenticated } = useAuthSession();

  // Check if current user owns this property
  const canManageProperty = isOwner() && propertyOwnerId === user?.id;

  const handleManageProperty = () => {
    if (!canManageProperty) {
      toast.error('You do not have permission to manage this property');
      return;
    }

    // Call the callback if provided (to open edit dialog)
    if (onManageProperty) {
      onManageProperty();
    } else {
      // Fallback: navigate to properties page
      navigate('/properties');
      toast.info('Navigate to Properties page to edit this property');
    }
  };

  const handleContact = () => {
    if (!isAuthenticated()) {
      toast.error('Please sign in to contact the property owner');
      navigate('/auth');
      return;
    }

    // Navigate to contact page or messages
    navigate('/contact');
    toast.info('You can contact the property owner through the contact page');
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Details</h3>
          <Badge className="bg-brand-light text-brand-primary">{status}</Badge>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Rent</span>
            <span className="font-medium">{rent}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Size</span>
            <span className="font-medium">{size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bedrooms</span>
            <span className="font-medium">{bedrooms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bathrooms</span>
            <span className="font-medium">{bathrooms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Units</span>
            <span className="font-medium">{units}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Occupancy</span>
            <span className="font-medium">{occupancyRate}%</span>
          </div>
        </div>

        <div className="mt-6">
          {canManageProperty && (
            <Button className="mb-2 w-full" onClick={handleManageProperty}>
              Manage Property
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={handleContact}>
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
