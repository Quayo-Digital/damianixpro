import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './types';
import { useAuthOperations } from './useAuthOperations';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const {
    userRole,
    setUserRole,
    fetchUserRole,
    signIn,
    signOut,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    resetPassword,
  } = useAuthOperations();

  useEffect(() => {
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (cancelled) return;

      logger.debug('Auth state changed', { event, hasUser: !!currentSession });
      setSession(currentSession);

      if (currentSession) {
        const userData = currentSession.user;
        setUser(userData);

        queueMicrotask(async () => {
          if (cancelled) return;
          try {
            const role = await fetchUserRole(currentSession.user.id);
            logger.debug('Role fetched after auth change', { role });
          } catch (error) {
            if (cancelled) return;
            if (error instanceof Error && error.name === 'AbortError') {
              logger.debug('Role fetch aborted after auth change (transient)');
              return;
            }
            logger.error('Error fetching role after auth change', error);
            toast.error('Failed to fetch user role');
          }
        });
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    void (async () => {
      try {
        const {
          data: { session: existingSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (sessionError) {
          logger.error('Auth getSession error', sessionError);
          setIsLoading(false);
          return;
        }

        if (existingSession) {
          logger.debug('Found existing session');
          setSession(existingSession);
          setUser(existingSession.user);

          try {
            const role = await fetchUserRole(existingSession.user.id);
            logger.debug('Initial role from existing session', { role });
          } catch (error) {
            if (cancelled) return;
            if (error instanceof Error && error.name === 'AbortError') {
              logger.debug('Initial role fetch aborted (transient)');
            } else {
              logger.error('Error fetching initial role', error);
              toast.error('Failed to fetch user role');
            }
          }
        } else {
          logger.debug('No existing session found');
          setIsLoading(false);
        }
      } catch (error) {
        if (cancelled) return;
        logger.error('Auth initialization error', error);
        if (!(error instanceof Error && error.name === 'AbortError')) {
          toast.error('Authentication initialization failed');
        }
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // fetchUserRole identity is stable enough via useMemo in useAuthOperations; avoid re-subscribing every render
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; role fetch uses latest closure from first mount only
  }, []);

  const updateUserMetadata = useCallback(async (metadata: any): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (error) {
        toast.error('Failed to update user metadata');
        throw error;
      }

      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            ...metadata,
          },
        };
      });
    } catch (error) {
      logger.error('Error updating user metadata', error);
      throw error;
    }
  }, []);

  const refreshUserRole = useCallback(async (): Promise<UserRole | null> => {
    if (!user) {
      logger.debug('Cannot refresh role: No user logged in');
      return null;
    }

    try {
      logger.debug('Manually refreshing user role', { userId: user.id });
      const role = await fetchUserRole(user.id);
      logger.debug('Refreshed role', { role });
      return role;
    } catch (error) {
      logger.error('Error refreshing user role', error);
      toast.error('Failed to refresh user role');
      return null;
    }
  }, [user, fetchUserRole]);

  return {
    user,
    userRole,
    isLoading,
    session,
    signIn,
    signOut,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    resetPassword,
    refreshUserRole,
    updateUserMetadata,
  };
};
