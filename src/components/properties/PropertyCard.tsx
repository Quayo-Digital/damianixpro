import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, MapPin, Home, Calendar } from 'lucide-react';
import { Property } from '@/services/property/types';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteProperty } from '@/services/property';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';
import { PropertyLeaseSummaryBadges } from '@/components/properties/PropertyLeaseSummaryBadges';

interface PropertyCardProps {
  property: Property;
  matchScore?: number;
  onEdit?: (property: Property) => void;
  onCreateShortlet?: (propertyId: string) => void;
  onRefresh?: () => void;
}

export function PropertyCard({
  property,
  matchScore,
  onEdit,
  onCreateShortlet,
  onRefresh,
}: PropertyCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isOwner, user, userRole } = useAuthSession();

  // Check if current user owns this property
  const canManageProperty = isOwner() && property.owner_id === user?.id;

  // Determine if user is a tenant (should use public routes)
  const isTenant = userRole === 'tenant';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProperty(property.id);
      toast({
        title: 'Property deleted',
        description: `${property.name} has been deleted successfully.`,
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleViewDetails = () => {
    // Tenants should use public property routes, owners/agents use management routes
    if (isTenant) {
      navigate(`/public/properties/${property.id}`);
    } else {
      navigate(`/properties/${property.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Rented':
        return 'bg-blue-100 text-blue-800';
      case 'Sold':
        return 'bg-gray-100 text-gray-800';
      case 'Under Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="group overflow-hidden rounded-2xl border-border bg-card/95 shadow-[0_18px_40px_rgba(16,24,40,0.1)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(16,24,40,0.14)] dark:bg-card dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        <div className="relative h-52 w-full overflow-hidden">
          {property.imageUrl ? (
            <img
              src={property.imageUrl}
              alt={property.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-green-100/60 to-lime-100/70">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          <div className="absolute right-3 top-3">
            <Badge className={`border border-border/60 ${getStatusColor(property.status)}`}>
              {property.status}
            </Badge>
          </div>
          {typeof matchScore === 'number' && (
            <div className="absolute left-3 top-3">
              <Badge className="border border-border bg-card/95 text-emerald-900 backdrop-blur-md dark:text-emerald-200">
                Match {Math.max(0, Math.min(100, Math.round(matchScore)))}%
              </Badge>
            </div>
          )}

          <PropertyLeaseSummaryBadges
            property={property}
            className="absolute bottom-14 left-3 z-10 max-w-[min(100%,14rem)]"
          />

          <div className="absolute bottom-3 left-3 right-3">
            <p className="truncate text-lg font-semibold text-white drop-shadow-sm">
              {property.name}
            </p>
          </div>
        </div>

        <CardContent className="space-y-3 p-4">
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" />
            <span className="truncate text-sm">{property.location}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-semibold text-primary">{property.price}</span>
            {property.type && (
              <Badge variant="outline" className="border-primary/30 bg-primary/5 capitalize">
                {property.type}
              </Badge>
            )}
          </div>

          {property.bedrooms || property.bathrooms ? (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {property.bedrooms && (
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {property.bedrooms} Bed{Number(property.bedrooms) !== 1 ? 's' : ''}
                </span>
              )}
              {property.bathrooms && (
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {property.bathrooms} Bath{Number(property.bathrooms) !== 1 ? 's' : ''}
                </span>
              )}
              {property.squareFeet && (
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {property.squareFeet} sqft
                </span>
              )}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex justify-between gap-2 p-4 pt-0">
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleViewDetails}>
            <FileText className="mr-2 h-4 w-4" />
            Details
          </Button>

          {canManageProperty && (
            <div className="flex gap-2">
              {onCreateShortlet && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onCreateShortlet(property.id)}
                  title="Create Short-Let Listing"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onEdit(property)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property "
              {property.name}" and all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
