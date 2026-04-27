import { useState, useCallback, useMemo } from 'react';
import { UserRole } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserRoleFromDb, storeUserRole, isValidUserRole } from '../authUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

const SUPABASE_DOWN_PATTERNS = [
  '503',
  'Service Unavailable',
  'fetch',
  'network',
  'Failed to fetch',
  'internet',
];

function isSupabaseDown(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return SUPABASE_DOWN_PATTERNS.some((p) => msg.toLowerCase().includes(p.toLowerCase()));
}

export const useRoleOperations = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      logger.debug('Fetching role for user', { userId });
      const dbRole = await fetchUserRoleFromDb(userId);

      if (dbRole) {
        setUserRole(dbRole);
        return dbRole;
      }

      const { data: userData, error } = await supabase.auth.getUser();

      if (error) {
        if (isSupabaseDown(error)) {
          logger.debug('Supabase unavailable, defaulting to user role', { message: error.message });
          setUserRole('user');
          return 'user';
        }
        logger.warn('Error getting user data', { message: error.message });
        setUserRole('user');
        return 'user';
      }

      const metadataRole = userData?.user?.user_metadata?.role as UserRole | undefined;

      if (metadataRole && isValidUserRole(metadataRole)) {
        setUserRole(metadataRole);
        await storeUserRole(userId, metadataRole);
        return metadataRole;
      }

      setUserRole('user');
      await storeUserRole(userId, 'user');
      return 'user';
    } catch (error) {
      if (isSupabaseDown(error)) {
        logger.debug('Supabase unavailable during role fetch', {
          message: error instanceof Error ? error.message : '',
        });
      } else {
        logger.warn('Error fetching user role', error);
      }
      setUserRole('user');
      return 'user';
    }
  }, []);

  const refreshUserRole = useCallback(
    async (userId: string) => {
      try {
        const role = await fetchUserRole(userId);
        return role;
      } catch (error) {
        if (!isSupabaseDown(error)) {
          logger.warn('Error refreshing user role', {
            message: error instanceof Error ? error.message : '',
          });
          toast.error('Failed to refresh user role');
        }
        return 'user';
      }
    },
    [fetchUserRole]
  );

  return useMemo(
    () => ({
      userRole,
      setUserRole,
      fetchUserRole,
      refreshUserRole,
    }),
    [userRole, fetchUserRole, refreshUserRole]
  );
};
