
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePasswordOperations = () => {
  const resetPassword = async (email: string) => {
    try {
      console.log("Initiating password reset for:", email);
      
      const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      
      if (error) {
        console.error("Password reset error:", error);
        toast.error(error.message || "Failed to send password reset email");
        throw error;
      }
      
      toast.success("Password reset email sent");
      return data;
    } catch (error) {
      console.error("Password reset exception:", error);
      toast.error("An error occurred during password reset");
      throw error;
    }
  };

  return {
    resetPassword
  };
};
