
import { useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserRoleFromDb, storeUserRole, isValidUserRole } from '../authUtils';
import { toast } from 'sonner';

export const useRoleOperations = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId);
      // Try to get role from database
      const dbRole = await fetchUserRoleFromDb(userId);
      
      if (dbRole) {
        console.log("Found role in DB:", dbRole);
        setUserRole(dbRole);
        return dbRole;
      }
      
      // If not found in database, try to get from user metadata
      const { data: userData, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error getting user data:", error.message);
        throw new Error(`Failed to get user data: ${error.message}`);
      }
      
      const metadataRole = userData?.user?.user_metadata?.role as UserRole | undefined;
      
      console.log("Role from metadata:", metadataRole);
      if (metadataRole && isValidUserRole(metadataRole)) {
        setUserRole(metadataRole);
        
        // Store role in database for future use
        try {
          await storeUserRole(userId, metadataRole);
          console.log("Stored user role in DB:", metadataRole);
        } catch (error) {
          console.error('Error storing user role:', error);
          // Don't throw error, just log it - this should not block the application
        }
        return metadataRole;
      } else {
        // Default to 'user' if no role is found
        console.log("No role found, defaulting to 'user'");
        setUserRole('user');
        try {
          await storeUserRole(userId, 'user');
          console.log("Stored default user role in DB: user");
        } catch (error) {
          console.error('Error storing default user role:', error);
          // Don't throw error, just log it
        }
        return 'user';
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user'); // Default to user on error
      return 'user';
    }
  };

  const refreshUserRole = async (userId: string) => {
    try {
      console.log("Manually refreshing user role for:", userId);
      const role = await fetchUserRole(userId);
      console.log("Refreshed role:", role);
      return role;
    } catch (error) {
      console.error('Error refreshing user role:', error);
      toast.error("Failed to refresh user role");
      return null;
    }
  };

  return {
    userRole,
    setUserRole,
    fetchUserRole,
    refreshUserRole
  };
};
