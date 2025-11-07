
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormFields } from './FormFields';
import { ImageUploadSection } from './ImageUploadSection';
import { FormActions } from './FormActions';
import { useMaintenanceForm } from './useMaintenanceForm';
import { MaintenanceRequest } from '@/utils/AccountingTypes';

interface MaintenanceRequestFormProps {
  onClose: () => void;
  onSuccess?: (newRequest: MaintenanceRequest) => void;
}

export function MaintenanceRequestForm({ onClose, onSuccess }: MaintenanceRequestFormProps) {
  const {
    form,
    imageUrl,
    isSubmitting,
    properties,
    isLoadingProperties,
    handleImageUploaded,
    onSubmit
  } = useMaintenanceForm({ onClose, onSuccess });

  return (
    <Form {...form}>
      <ScrollArea className="h-[60vh] pr-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFields 
            form={form} 
            isLoadingProperties={isLoadingProperties}
            properties={properties}
          />
          
          <ImageUploadSection
            imageUrl={imageUrl}
            onImageUploaded={handleImageUploaded}
          />
        </form>
      </ScrollArea>
      
      <FormActions 
        onClose={onClose} 
        isSubmitting={isSubmitting}
        isLoadingProperties={isLoadingProperties}
        form={form}
        onSubmit={onSubmit}
      />
    </Form>
  );
}
