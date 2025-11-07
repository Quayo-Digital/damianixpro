
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, MapPin, Home } from 'lucide-react';
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

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onRefresh?: () => void;
}

export function PropertyCard({ property, onEdit, onRefresh }: PropertyCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProperty(property.id);
      toast({
        title: "Property deleted",
        description: `${property.name} has been deleted successfully.`,
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleViewDetails = () => {
    navigate(`/properties/${property.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Rented': return 'bg-blue-100 text-blue-800';
      case 'Sold': return 'bg-gray-100 text-gray-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-48 w-full overflow-hidden">
          {property.imageUrl ? (
            <img 
              src={property.imageUrl} 
              alt={property.name} 
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge className={`${getStatusColor(property.status)}`}>
              {property.status}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate">{property.name}</h3>
          
          <div className="flex items-center text-muted-foreground mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm truncate">{property.location}</span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-base">{property.price}</span>
            {property.type && (
              <Badge variant="outline">{property.type}</Badge>
            )}
          </div>
          
          {property.bedrooms || property.bathrooms ? (
            <div className="flex gap-3 text-sm text-muted-foreground">
              {property.bedrooms && (
                <span>{property.bedrooms} Bed{Number(property.bedrooms) !== 1 ? 's' : ''}</span>
              )}
              {property.bathrooms && (
                <span>{property.bathrooms} Bath{Number(property.bathrooms) !== 1 ? 's' : ''}</span>
              )}
              {property.squareFeet && (
                <span>{property.squareFeet} sqft</span>
              )}
            </div>
          ) : null}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button variant="outline" size="sm" onClick={handleViewDetails}>
            <FileText className="h-4 w-4 mr-2" />
            Details
          </Button>
          
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(property)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property 
              "{property.name}" and all associated documents.
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
