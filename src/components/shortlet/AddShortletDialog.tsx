import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ShortletListingForm } from './ShortletListingForm';

interface AddShortletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string; // Optional: pre-select a property
  onShortletAdded?: () => void;
}

export function AddShortletDialog({
  open,
  onOpenChange,
  propertyId,
  onShortletAdded,
}: AddShortletDialogProps) {
  const { toast } = useToast();

  const handleSuccess = async (listingId: string) => {
    toast({
      title: 'Success!',
      description: 'Short-let listing has been created successfully.',
    });

    // Call the callback if provided
    if (onShortletAdded) {
      onShortletAdded();
    }

    // Close dialog
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add New Short-Let Listing</DialogTitle>
          <DialogDescription>
            Create a new short-let listing from one of your properties to start accepting bookings.
          </DialogDescription>
        </DialogHeader>

        <ShortletListingForm
          propertyId={propertyId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
