
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PropertyForm } from './PropertyForm';
import { Property, PropertyFormValues } from '@/services/property/types';
import { updateProperty } from '@/services/property';

interface EditPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onPropertyUpdated?: () => void; // Make this prop optional
}

export function EditPropertyDialog({ open, onOpenChange, property, onPropertyUpdated }: EditPropertyDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PropertyFormValues, imageUrl: string | null, documents: File[]) => {
    setIsSubmitting(true);
    try {
      // Preserve the owner_id from the existing property
      const updatedPropertyData = {
        ...data,
        owner_id: property.owner_id,
        imageUrl: imageUrl || data.imageUrl
      };
      
      const updatedProperty = await updateProperty(property.id, updatedPropertyData, documents);
      
      toast({
        title: "Success!",
        description: "Property has been updated successfully.",
      });
      
      // Call the callback if provided
      if (onPropertyUpdated) {
        onPropertyUpdated();
      }
      
      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update property. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Update the details of your property.
          </DialogDescription>
        </DialogHeader>
        
        <PropertyForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={property}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
