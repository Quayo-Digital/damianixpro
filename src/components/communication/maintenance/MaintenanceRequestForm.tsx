import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MaintenanceRequest } from './maintenance-data';
import { FormFields } from './form/FormFields';
import { ImageUploadSection } from './form/ImageUploadSection';
import { Loader2 } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';
import { useTenantDetails } from '@/hooks/useTenantDetails';
import { tryOnlineThenEnqueue } from '@/lib/offlineQueue';
import type { CreateMaintenanceRequestPayload } from '@/lib/offlineQueue/handlers/createMaintenanceRequest';
import { logger } from '@/utils/logger';

const requestSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be detailed (at least 10 characters).' }),
  urgency: z.enum(['low', 'medium', 'high']),
  allowEntry: z.boolean().optional(),
});

export type MaintenanceFormValues = z.infer<typeof requestSchema>;

interface MaintenanceRequestFormProps {
  onClose: () => void;
  onSuccess?: (newRequest: MaintenanceRequest) => void;
}

export function MaintenanceRequestForm({ onClose, onSuccess }: MaintenanceRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    tenantName,
    propertyId,
    propertyName,
    isLoading: isLoadingTenantDetails,
  } = useTenantDetails();

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      urgency: 'medium',
      allowEntry: true,
    },
  });

  async function onSubmit(data: MaintenanceFormValues) {
    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'You must be logged in to create a maintenance request.',
        variant: 'destructive',
      });
      return;
    }

    if (isLoadingTenantDetails) {
      toast({ title: 'Please wait', description: 'Loading your details...' });
      return;
    }

    try {
      setIsSubmitting(true);

      // The same client_request_id is used for both the inline online attempt
      // and any subsequent retries, so a UNIQUE index server-side guarantees
      // no duplicate row even if the network drops mid-response.
      const clientRequestId = crypto.randomUUID();

      const payload: CreateMaintenanceRequestPayload = {
        client_request_id: clientRequestId,
        user_id: user.id,
        title: data.title,
        description: data.description,
        priority: data.urgency,
        status: 'pending',
        image_url: imageUrl,
        property_id: propertyId,
        property_name: propertyName,
        tenant_name: tenantName,
        category: 'maintenance',
      };

      const result = await tryOnlineThenEnqueue('create-maintenance-request', payload);

      // Show an optimistic UI row regardless of whether the request actually
      // hit the server — if it was queued, it'll sync on reconnect.
      const newRequest: MaintenanceRequest = {
        id: clientRequestId,
        title: data.title,
        description: data.description,
        priority: data.urgency,
        status: 'pending',
        created_at: new Date().toISOString(),
        image_url: imageUrl,
        updates: [],
        category: 'maintenance',
        property_id: propertyId,
        property_name: propertyName || undefined,
        tenant_name: tenantName || undefined,
      };

      if (result.mode === 'submitted') {
        toast({
          title: 'Request submitted',
          description: 'Your maintenance request has been sent.',
        });
      } else {
        toast({
          title: 'Saved offline',
          description: "We'll send your request as soon as you're back online.",
        });
      }

      if (onSuccess) {
        onSuccess(newRequest);
      }

      onClose();
      form.reset();
      setImageUrl(null);
    } catch (error) {
      logger.error('MaintenanceRequestForm: submit failed', { error });
      toast({
        title: 'Error',
        description: 'Failed to submit maintenance request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageUploaded = (url: string | null) => {
    setImageUrl(url);
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[60vh] pr-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormFields form={form} />
          <ImageUploadSection imageUrl={imageUrl} onImageUploaded={handleImageUploaded} />
        </form>
      </ScrollArea>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting || isLoadingTenantDetails}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || isLoadingTenantDetails}
        >
          {isSubmitting || isLoadingTenantDetails ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSubmitting ? 'Submitting...' : 'Loading details...'}
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </DialogFooter>
    </Form>
  );
}
