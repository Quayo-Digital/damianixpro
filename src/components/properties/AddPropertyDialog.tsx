
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PropertyForm } from './PropertyForm';
import { PropertyFormValues } from '@/services/property/types';
import { createProperty } from '@/services/property';
import { useAuth } from '@/contexts/auth';

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyAdded?: () => void;
}

export function AddPropertyDialog({ open, onOpenChange, onPropertyAdded }: AddPropertyDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: PropertyFormValues, imageUrl: string | null, documents: File[]) => {
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error("You must be logged in to add a property");
      }
      
      // Add owner_id from the current user and handle imageUrl
      const propertyData = {
        ...data,
        owner_id: user.id,
        imageUrl: imageUrl || undefined
      };
      
      await createProperty(propertyData, documents);
      
      toast({
        title: "Success!",
        description: "Property has been added successfully.",
      });
      
      // Call the callback if provided
      if (onPropertyAdded) {
        onPropertyAdded();
      }
      
      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add property. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding property:', error);
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
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Enter the details of the new property you want to add to your portfolio.
          </DialogDescription>
        </DialogHeader>
        
        <PropertyForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
