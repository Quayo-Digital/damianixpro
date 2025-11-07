
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './types';
import { useAuthOperations } from './useAuthOperations';
import { toast } from 'sonner';

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
    resetPassword
  } = useAuthOperations();

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        // First set up the auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log("Auth state changed:", event, currentSession ? "User present" : "No user");
            setSession(currentSession);
            
            if (currentSession) {
              const userData = currentSession.user;
              setUser(userData);
              
              // Use setTimeout to avoid potential auth deadlock with Supabase
              setTimeout(async () => {
                try {
                  const role = await fetchUserRole(currentSession.user.id);
                  console.log("Role fetched after auth change:", role);
                } catch (error) {
                  console.error("Error fetching role after auth change:", error);
                  toast.error("Failed to fetch user role");
                }
              }, 0);
            } else {
              setUser(null);
              setUserRole(null);
            }
            setIsLoading(false);
          }
        );

        // Then check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log("Found existing session");
          setSession(existingSession);
          setUser(existingSession.user);
          
          try {
            const role = await fetchUserRole(existingSession.user.id);
            console.log("Initial role from existing session:", role);
          } catch (error) {
            console.error("Error fetching initial role:", error);
            toast.error("Failed to fetch user role");
          }
        } else {
          console.log("No existing session found");
          setIsLoading(false);
        }

        // Cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth initialization error:", error);
        toast.error("Authentication initialization failed");
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Add method to update user metadata
  const updateUserMetadata = async (metadata: any): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });
      
      if (error) {
        toast.error("Failed to update user metadata");
        throw error;
      }
      
      // Update local user state
      if (user) {
        setUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            ...metadata
          }
        });
      }
    } catch (error) {
      console.error('Error updating user metadata:', error);
      throw error;
    }
  };

  const refreshUserRole = async (): Promise<UserRole | null> => {
    if (!user) {
      console.log("Cannot refresh role: No user logged in");
      return null;
    }
    
    try {
      console.log("Manually refreshing user role for:", user.id);
      const role = await fetchUserRole(user.id);
      console.log("Refreshed role:", role);
      return role;
    } catch (error) {
      console.error('Error refreshing user role:', error);
      toast.error("Failed to refresh user role");
      return null;
    }
  };

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
    updateUserMetadata
  };
};
