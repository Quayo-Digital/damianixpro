
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceFormValues } from './FormFields';

interface FormActionsProps {
  onClose: () => void;
  isSubmitting: boolean;
  isLoadingProperties: boolean;
  form: UseFormReturn<MaintenanceFormValues>;
  onSubmit: (data: MaintenanceFormValues) => void;
}

export function FormActions({ 
  onClose, 
  isSubmitting, 
  isLoadingProperties,
  form,
  onSubmit
}: FormActionsProps) {
  return (
    <DialogFooter className="mt-6">
      <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button 
        type="submit" 
        onClick={form.handleSubmit(onSubmit)} 
        disabled={isSubmitting || isLoadingProperties}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Request"
        )}
      </Button>
    </DialogFooter>
  );
}
