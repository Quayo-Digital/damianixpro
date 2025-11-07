
import { supabase } from "@/integrations/supabase/client";

export interface Property {
  id: string;
  name: string;
}

export interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  properties: Property[];
  rent_amount?: number;
}

export async function fetchTenants(): Promise<Tenant[]> {
  const { data: tenantsData, error: tenantsError } = await supabase
    .from('tenants')
    .select('*');

  if (tenantsError) throw tenantsError;

  const enhancedTenants = await Promise.all(
    tenantsData.map(async (tenant) => {
      const { data: propertyTenants, error: propertyTenantError } = await supabase
        .from('property_tenants')
        .select('property_id, rent_amount, property:properties(id, name)')
        .eq('tenant_id', tenant.id);

      if (propertyTenantError) throw propertyTenantError;

      const properties = propertyTenants.map((pt: any) => pt.property).filter(Boolean);
      const rent_amount = propertyTenants.length > 0 ? propertyTenants[0].rent_amount : undefined;

      return {
        ...tenant,
        properties,
        rent_amount,
      };
    })
  );

  return enhancedTenants;
}
