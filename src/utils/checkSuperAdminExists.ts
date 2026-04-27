import { supabase } from '@/integrations/supabase/client';

// Checks if any user has the "super_admin" role in user_roles
export async function checkSuperAdminExists(): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('role', 'super_admin')
    .maybeSingle();
  return !!(data && data.role === 'super_admin');
}
