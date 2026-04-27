import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InspectionForm } from './InspectionForm';
import { Clipboard } from 'lucide-react';

interface InspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  inspectionType: 'move-in' | 'move-out';
  onSuccess?: () => void;
}

export const InspectionDialog = ({
  open,
  onOpenChange,
  propertyId,
  inspectionType,
  onSuccess,
}: InspectionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = () => {
    setIsSubmitting(false);
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            {inspectionType === 'move-in' ? 'Move-In Inspection' : 'Move-Out Inspection'}
          </DialogTitle>
          <DialogDescription>
            Complete the inspection checklist for the property.
            {inspectionType === 'move-in'
              ? ' Document the condition before the tenant moves in.'
              : ' Document the condition after the tenant moves out.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <InspectionForm
            propertyId={propertyId}
            inspectionType={inspectionType}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
