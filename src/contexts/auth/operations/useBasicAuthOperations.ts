
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBasicAuthOperations = () => {
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error);
        toast.error(error.message || "Failed to sign in");
        throw error;
      }
      
      if (data && data.user) {
        console.log("Sign in successful, user ID:", data.user.id);
        toast.success("Signed in successfully");
      }
      
      return data;
    } catch (error) {
      console.error("Sign in exception:", error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log("Signing out user");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error(error.message || "Failed to sign out");
        throw error;
      }
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out exception:", error);
      toast.error("An error occurred while signing out");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata: any = {}) => {
    console.log("Registering with email and role:", email, metadata.role);
    
    try {
      // Get the current origin for redirect URL
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });
      
      if (error) {
        console.error("Sign up error:", error);
        toast.error(error.message || "Failed to sign up");
        throw error;
      }
      
      if (data.user) {
        console.log("Signup successful, user ID:", data.user.id);
        
        // Check if email confirmation is required
        if (!data.session && data.user && !data.user.email_confirmed_at) {
          toast.success("Please check your email to confirm your account");
        } else {
          toast.success("Account created successfully");
        }
        
        return data;
      }
    } catch (error) {
      console.error("Sign up exception:", error);
      
      // Handle specific network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error("Network error: Please check your internet connection");
      } else {
        toast.error("An error occurred during signup");
      }
      throw error;
    }
  };

  return {
    signIn,
    signOut,
    signUp
  };
};
