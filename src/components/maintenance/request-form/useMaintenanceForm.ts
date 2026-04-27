import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { formSchema, MaintenanceFormValues } from './FormFields';
import {
  MaintenanceRequest,
  parseUpdatesFromJson,
} from '@/components/communication/maintenance/maintenance-data';
import { useAuthSession } from '@/contexts/auth';
import { useProperties } from '@/hooks/useProperties';
import { fetchLeaseRows, isLikelyActiveLeaseStatus } from '@/services/leases/enrichLeaseAgreements';

interface UseMaintenanceFormProps {
  onClose: () => void;
  onSuccess?: (newRequest: MaintenanceRequest) => void;
}

export function useMaintenanceForm({ onClose, onSuccess }: UseMaintenanceFormProps) {
  const { toast } = useToast();
  const { user, userRole } = useAuthSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

  // Use the useProperties hook for role-based property fetching
  const { properties: allProperties, isLoading: isLoadingFromHook } = useProperties();

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      property: '',
      tenant: '',
      description: '',
      priority: 'medium' as const,
    },
  });

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user || !userRole) {
        console.log('⏸️ [MaintenanceForm] No user or role, skipping');
        setIsLoadingProperties(false);
        return;
      }

      try {
        setIsLoadingProperties(true);
        console.log('🔍 [MaintenanceForm] Starting fetch - Role:', userRole, 'User:', user.id);

        // Strategy: Always use direct query for reliability
        // The useProperties hook might have RLS issues or timing problems
        let query = supabase.from('properties').select('id, name').order('name');

        // Apply role-based filtering
        if (userRole === 'owner' && user?.id) {
          query = query.eq('owner_id', user.id);
          console.log('🔍 [MaintenanceForm] Filtering for owner:', user.id);
        } else if (userRole === 'agent' && user?.id) {
          query = query.eq('agent_id', user.id);
          console.log('🔍 [MaintenanceForm] Filtering for agent:', user.id);
        } else if (userRole === 'tenant' && user?.id) {
          // For tenants, try to get properties from leases first
          console.log('🔍 [MaintenanceForm] Tenant - fetching via leases');
          const { data: tenantRecord } = await supabase
            .from('tenants')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (tenantRecord?.id) {
            const today = new Date().toISOString().split('T')[0];
            try {
              const { rows } = await fetchLeaseRows({ tenantId: tenantRecord.id });
              const open = rows.filter((r) => {
                const end = r.end_date ? new Date(String(r.end_date)) : null;
                const endOk = !end || !Number.isFinite(end.getTime()) || end >= new Date(today);
                return isLikelyActiveLeaseStatus(r.status) && endOk;
              });
              const propertyIds = [
                ...new Set(open.map((l) => l.property_id).filter(Boolean)),
              ] as string[];

              if (propertyIds.length > 0) {
                const { data: propsRows } = await supabase
                  .from('properties')
                  .select('id, name')
                  .in('id', propertyIds);

                const tenantProperties = (propsRows ?? []).map((p) => ({
                  id: p.id,
                  name: p.name || 'Unknown Property',
                }));

                console.log(
                  '✅ [MaintenanceForm] Tenant properties from leases:',
                  tenantProperties.length
                );
                setProperties(tenantProperties);
                setIsLoadingProperties(false);
                return;
              }
            } catch (leaseErr) {
              console.warn('[MaintenanceForm] Could not load tenant leases:', leaseErr);
            }
          }
          // Fallback: show available properties for tenants
          query = query.in('status', ['Available', 'Under Maintenance']);
        } else if (userRole === 'admin' || userRole === 'super_admin') {
          // Admins see all - no filter
          console.log('🔍 [MaintenanceForm] Admin - no filter');
        } else {
          // Default: show available properties
          query = query.in('status', ['Available', 'Under Maintenance']);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ [MaintenanceForm] Query error:', error);
          throw error;
        }

        console.log('✅ [MaintenanceForm] Query successful:', data?.length || 0, 'properties');
        if (data && data.length > 0) {
          console.log(
            '📋 [MaintenanceForm] Properties:',
            data.map((p) => ({ id: p.id, name: p.name }))
          );
        }
        setProperties(data || []);
      } catch (error) {
        console.error('❌ [MaintenanceForm] Fetch error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load properties. Please try again.',
          variant: 'destructive',
        });
        setProperties([]);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [user, userRole, toast]);

  const handleImageUploaded = (url: string | null) => {
    setImageUrl(url);
  };

  const onSubmit = async (data: MaintenanceFormValues) => {
    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'You must be logged in to create a maintenance request.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Find the selected property to get its name
      const selectedProperty = properties.find((p) => p.id === data.property);
      if (!selectedProperty) {
        throw new Error('Selected property not found');
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
        updates: [], // Initialize with empty updates array
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
        title: 'Request Created',
        description: 'Your maintenance request has been submitted.',
      });

      if (onSuccess && insertedData) {
        const typedRequest: MaintenanceRequest = {
          ...insertedData,
          status: insertedData.status as 'pending' | 'in_progress' | 'completed',
          priority: insertedData.priority as 'low' | 'medium' | 'high',
          updates: parseUpdatesFromJson(insertedData.updates),
        };
        onSuccess(typedRequest);
      }

      onClose();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create maintenance request. Please try again.',
        variant: 'destructive',
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
    onSubmit,
  };
}
