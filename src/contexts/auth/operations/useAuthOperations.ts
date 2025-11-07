
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBasicAuthOperations } from './useBasicAuthOperations';
import { useRoleOperations } from './useRoleOperations';
import { useSocialAuthOperations } from './useSocialAuthOperations';
import { usePasswordOperations } from './usePasswordOperations';

export function useAuthOperations() {
  const basicAuth = useBasicAuthOperations();
  const roleOperations = useRoleOperations();
  const socialAuth = useSocialAuthOperations();
  const passwordOps = usePasswordOperations();

  const operations = useMemo(() => {
    return {
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return true;
      },
      
      // Re-export operations from other hooks
      ...basicAuth,
      ...roleOperations,
      ...socialAuth,
      ...passwordOps,
    };
  }, [basicAuth, roleOperations, socialAuth, passwordOps]);

  return operations;
}
