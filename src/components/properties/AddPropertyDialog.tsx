import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PropertyForm } from './PropertyForm';
import { PropertyFormValues } from '@/services/property/types';
import { createProperty } from '@/services/property';
import { useAuthSession } from '@/contexts/auth';
import { createTourServiceRequest } from '@/services/tourServiceRequests';
import {
  completePropertyMediaUpload,
  initPropertyMediaUpload,
} from '@/services/property/mediaService';

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyAdded?: () => void;
}

export function AddPropertyDialog({ open, onOpenChange, onPropertyAdded }: AddPropertyDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthSession();

  const handleSubmit = async (
    data: PropertyFormValues,
    imageUrl: string | null,
    documents: File[],
    requestTourAfterSubmit: boolean,
    pendingVideos: File[]
  ) => {
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error('You must be logged in to add a property');
      }

      // Add owner_id from the current user and handle imageUrl
      const propertyData = {
        ...data,
        owner_id: user.id,
        imageUrl: imageUrl || undefined,
      };

      const property = await createProperty(propertyData, documents);

      if (pendingVideos.length > 0) {
        for (const file of pendingVideos) {
          const init = await initPropertyMediaUpload({
            propertyId: property.id,
            mediaType: 'video',
            filename: file.name,
            mimeType: file.type || 'video/mp4',
            fileSize: file.size,
          });

          const uploadResp = await fetch(init.upload.signedUploadUrl, {
            method: 'PUT',
            headers: { 'content-type': file.type || 'application/octet-stream' },
            body: file,
          });
          if (!uploadResp.ok) {
            throw new Error(`Failed to upload video ${file.name}`);
          }

          await completePropertyMediaUpload({ mediaId: init.media.id });
        }
      }

      if (requestTourAfterSubmit) {
        await createTourServiceRequest(property.id, user.id);
      }

      // If an agent is assigned, send notification
      if (data.agent_id && data.agent_id !== 'none') {
        try {
          // Get owner details
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('id', user.id)
            .single();

          const ownerName =
            [ownerProfile?.first_name, ownerProfile?.last_name].filter(Boolean).join(' ').trim() ||
            user.email ||
            'Property Owner';
          const ownerEmail = ownerProfile?.email || user.email || '';
          const ownerPhone = ownerProfile?.phone || undefined;

          const { sendAgentAssignmentNotification } =
            await import('@/services/notifications/agent');
          await sendAgentAssignmentNotification({
            agentId: data.agent_id,
            propertyId: property.id,
            propertyName: data.name || 'New Property',
            ownerId: user.id,
            ownerName: ownerName,
            ownerEmail: ownerEmail,
            ownerPhone: ownerPhone,
            commissionRate: data.agent_commission_rate || '0.03',
          });
        } catch (notificationError) {
          // Log error but don't fail the property creation
          console.error('Error sending agent assignment notification:', notificationError);
        }
      }

      toast({
        title: 'Success!',
        description:
          data.agent_id && data.agent_id !== 'none'
            ? requestTourAfterSubmit
              ? 'Property added, agent notified, and 3D tour request submitted.'
              : 'Property has been added successfully and the agent has been notified.'
            : requestTourAfterSubmit
              ? 'Property added and 3D tour request submitted.'
              : pendingVideos.length > 0
                ? `Property added successfully with ${pendingVideos.length} video(s).`
                : 'Property has been added successfully.',
      });

      // Call the callback if provided
      if (onPropertyAdded) {
        onPropertyAdded();
      }

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add property. Please try again.',
        variant: 'destructive',
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Enter the details of the new property you want to add to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <PropertyForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
