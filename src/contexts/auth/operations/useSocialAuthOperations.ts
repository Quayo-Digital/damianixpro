
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from '../authUtils';
import { toast } from 'sonner';

export const useSocialAuthOperations = () => {
  const signInWithGoogle = async () => {
    console.log("Initiating Google sign-in");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        toast.error(error.message || "Failed to sign in with Google");
        throw error;
      }
    } catch (error) {
      console.error("Google sign-in exception:", error);
      toast.error("An error occurred during Google sign-in");
      throw error;
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log("Initiating phone sign-in for:", formattedPhone);
      
      const { error, data } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      });
      
      if (error) {
        console.error("Phone sign-in error:", error);
        toast.error(error.message || "Failed to send OTP");
        throw error;
      }
      
      toast.success("OTP sent to your phone");
      return data;
    } catch (error) {
      console.error("Phone sign-in exception:", error);
      toast.error("An error occurred during phone sign-in");
      throw error;
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log("Verifying OTP for:", formattedPhone);
      
      const { error, data } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });
      
      if (error) {
        console.error("OTP verification error:", error);
        toast.error(error.message || "Invalid OTP");
        throw error;
      }
      
      toast.success("Phone number verified successfully");
      return data;
    } catch (error) {
      console.error("OTP verification exception:", error);
      toast.error("An error occurred during OTP verification");
      throw error;
    }
  };

  return {
    signInWithGoogle,
    signInWithPhone,
    verifyOtp
  };
};
