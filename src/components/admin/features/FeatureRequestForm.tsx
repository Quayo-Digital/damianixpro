import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploadSection } from '@/components/communication/maintenance/form/ImageUploadSection';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';

const featureRequestSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be detailed (at least 10 characters).' }),
  priority: z.enum(['low', 'medium', 'high']),
});

export type FeatureRequestFormValues = z.infer<typeof featureRequestSchema>;

interface FeatureRequestFormProps {
  onClose: () => void;
  onSuccess?: (newRequest: MaintenanceRequest) => void;
}

export function FeatureRequestForm({ onClose, onSuccess }: FeatureRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeatureRequestFormValues>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  async function onSubmit(data: FeatureRequestFormValues) {
    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'You must be logged in to suggest a feature.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: requestData, error } = await supabase
        .from('maintenance_requests')
        .insert([
          {
            user_id: user.id,
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: 'pending',
            image_url: imageUrl,
            property_name: 'Platform',
            tenant_name: user.user_metadata.full_name || 'Admin',
            updates: [],
            category: 'feature_request',
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (onSuccess && requestData) {
        onSuccess(requestData as any);
      }

      toast({
        title: 'Feature Request Submitted',
        description: 'Thank you for your suggestion!',
      });

      onClose();
      form.reset();
      setImageUrl(null);
    } catch (error) {
      console.error('Error submitting feature request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feature request. Please try again.',
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
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Dark mode for dashboard" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the feature in detail..."
                    className="resize-y"
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <ImageUploadSection imageUrl={imageUrl} onImageUploaded={handleImageUploaded} />
        </form>
      </ScrollArea>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </DialogFooter>
    </Form>
  );
}
