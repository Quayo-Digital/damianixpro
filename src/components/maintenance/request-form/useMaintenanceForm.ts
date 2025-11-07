
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { formSchema, MaintenanceFormValues } from './FormFields';
import { MaintenanceRequest, parseUpdatesFromJson } from '@/components/communication/maintenance/maintenance-data';
import { useAuth } from '@/contexts/auth';

interface UseMaintenanceFormProps {
  onClose: () => void;
  onSuccess?: (newRequest: MaintenanceRequest) => void;
}

export function useMaintenanceForm({ onClose, onSuccess }: UseMaintenanceFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      property: '',
      tenant: '',
      description: '',
      priority: 'medium',
    }
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoadingProperties(true);
        const { data, error } = await supabase
          .from('properties')
          .select('id, name')
          .eq('status', 'active')
          .order('name');

        if (error) {
          throw error;
        }

        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive"
        });
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [toast]);

  const handleImageUploaded = (url: string | null) => {
    setImageUrl(url);
  };

  const onSubmit = async (data: MaintenanceFormValues) => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to create a maintenance request.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Find the selected property to get its name
      const selectedProperty = properties.find(p => p.id === data.property);
      if (!selectedProperty) {
        throw new Error("Selected property not found");
      }

      const newRequestData = {
        user_id: user.id,
        title: data.title,
        description: data.description,
        property_id: data.property,
        property_name: selectedProperty.name,
        tenant_name: data.tenant,
        priority: data.priority,
        status: 'pending' as const, // Explicitly type as a literal
        image_url: imageUrl,
        updates: [] // Initialize with empty updates array
      };

      // Insert the maintenance request into Supabase
      const { data: insertedData, error } = await supabase
        .from('maintenance_requests')
        .insert(newRequestData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Request Created",
        description: "Your maintenance request has been submitted.",
      });
      
      if (onSuccess && insertedData) {
        const typedRequest: MaintenanceRequest = {
          ...insertedData,
          status: insertedData.status as 'pending' | 'in_progress' | 'completed',
          priority: insertedData.priority as 'low' | 'medium' | 'high',
          updates: parseUpdatesFromJson(insertedData.updates)
        };
        onSuccess(typedRequest);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      toast({
        title: "Error",
        description: "Failed to create maintenance request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    imageUrl,
    isSubmitting,
    properties,
    isLoadingProperties,
    handleImageUploaded,
    onSubmit
  };
}
