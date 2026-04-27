import { useState, useEffect } from 'react';
import { useAuthSession } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  isMissingSupabaseRelationError,
  isPropertyTenantsRelationMissing,
  markPropertyTenantsRelationMissing,
} from '@/utils/supabaseErrors';

export const useTenantDetails = () => {
  const { user } = useAuthSession();
  const [tenantDetails, setTenantDetails] = useState<{
    tenantId: string | null;
    tenantName: string | null;
    propertyId: string | null;
    propertyName: string | null;
  }>({
    tenantId: null,
    tenantName: null,
    propertyId: null,
    propertyName: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch tenant from user_id
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (tenantError || !tenant) {
          throw new Error('Tenant profile not found.');
        }

        const tenantName = `${tenant.first_name} ${tenant.last_name}`;

        if (isPropertyTenantsRelationMissing()) {
          setTenantDetails({
            tenantId: tenant.id,
            tenantName,
            propertyId: null,
            propertyName: null,
          });
          return;
        }

        // 2. Fetch property_tenant link
        const { data: propertyTenant, error: ptError } = await supabase
          .from('property_tenants')
          .select('property_id')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        if (ptError) {
          if (isMissingSupabaseRelationError(ptError)) {
            markPropertyTenantsRelationMissing();
            setTenantDetails({
              tenantId: tenant.id,
              tenantName,
              propertyId: null,
              propertyName: null,
            });
            return;
          }
          throw ptError;
        }

        let propertyId: string | null = null;
        let propertyName: string | null = null;

        if (propertyTenant && propertyTenant.property_id) {
          propertyId = propertyTenant.property_id;
          // 3. Fetch property details
          const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('name')
            .eq('id', propertyId)
            .limit(1)
            .maybeSingle();

          if (propertyError) throw propertyError;
          propertyName = property?.name || null;
        }

        setTenantDetails({
          tenantId: tenant.id,
          tenantName,
          propertyId,
          propertyName,
        });
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching tenant details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [user]);

  return { ...tenantDetails, isLoading, error };
};
