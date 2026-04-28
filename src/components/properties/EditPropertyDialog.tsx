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
import { Property, PropertyFormValues } from '@/services/property/types';
import { updateProperty } from '@/services/property';
import { useAuthSession } from '@/contexts/auth';
import { createTourServiceRequest } from '@/services/tourServiceRequests';
import {
  completePropertyMediaUpload,
  initPropertyMediaUpload,
} from '@/services/property/mediaService';

interface EditPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onPropertyUpdated?: () => void; // Make this prop optional
}

export function EditPropertyDialog({
  open,
  onOpenChange,
  property,
  onPropertyUpdated,
}: EditPropertyDialogProps) {
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
      // Preserve the owner_id from the existing property
      const updatedPropertyData = {
        ...data,
        owner_id: property.owner_id,
        imageUrl: imageUrl || data.imageUrl,
      };

      const previousAgentId = property.agent_id;
      const newAgentId = data.agent_id === 'none' ? null : data.agent_id;
      const agentChanged = previousAgentId !== newAgentId;

      const updatedProperty = await updateProperty(property.id, updatedPropertyData, documents);

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

      if (requestTourAfterSubmit && user) {
        await createTourServiceRequest(property.id, user.id);
      }

      // If agent was changed/assigned, send notification
      if (agentChanged && newAgentId && user) {
        try {
          // Get owner details
          const { supabase } = await import('@/integrations/supabase/client');
          const { profileFullName } = await import('@/lib/profileDisplayName');
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('id', user.id)
            .single();

          const ownerName =
            (ownerProfile && profileFullName(ownerProfile)) || user.email || 'Property Owner';
          const ownerEmail = ownerProfile?.email || user.email || '';
          const ownerPhone = ownerProfile?.phone || undefined;

          const { sendAgentAssignmentNotification } =
            await import('@/services/notifications/agent');
          await sendAgentAssignmentNotification({
            agentId: newAgentId,
            propertyId: property.id,
            propertyName: data.name || property.name || 'Property',
            ownerId: user.id,
            ownerName: ownerName,
            ownerEmail: ownerEmail,
            ownerPhone: ownerPhone,
            commissionRate:
              data.agent_commission_rate || property.agent_commission_rate?.toString() || '0.03',
          });
        } catch (notificationError) {
          // Log error but don't fail the property update
          console.error('Error sending agent assignment notification:', notificationError);
        }
      }

      toast({
        title: 'Success!',
        description:
          agentChanged && newAgentId
            ? requestTourAfterSubmit
              ? 'Property updated, agent notified, and 3D tour request submitted.'
              : 'Property has been updated successfully and the agent has been notified.'
            : requestTourAfterSubmit
              ? 'Property updated and 3D tour request submitted.'
              : pendingVideos.length > 0
                ? `Property updated successfully with ${pendingVideos.length} new video(s).`
                : 'Property has been updated successfully.',
      });

      // Call the callback if provided
      if (onPropertyUpdated) {
        onPropertyUpdated();
      }

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property. Please try again.',
        variant: 'destructive',
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>Update the details of your property.</DialogDescription>
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
