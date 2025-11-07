
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { adminOnboardingSchema, AdminOnboardingFormValues } from "./adminOnboardingSchema";
import { AdminOnboardingFormBody } from "./AdminOnboardingFormBody";

export function AdminOnboardingForm() {
  const { user, refreshUserRole } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminOnboardingFormValues>({
    resolver: zodResolver(adminOnboardingSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || "",
      companyName: user?.user_metadata?.company || "",
      phone: user?.user_metadata?.phone || "",
      email: user?.email || "",
      address: "",
      defaultTimeZone: "Africa/Lagos"
    }
  });

  const onSubmit = async (data: AdminOnboardingFormValues) => {
    setIsSubmitting(true);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      console.log("[AdminOnboarding] userData:", userData, "error:", userErr);
      if (!userData?.user) {
        toast.error('User authentication error');
        console.error('No user found in Supabase auth');
        return;
      }

      // Update profile in the database with admin settings
      const { error: profileError, data: profileUpdate } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          admin_settings: {
            company: data.companyName,
            phone: data.phone,
            email: data.email,
            address: data.address,
            default_timezone: data.defaultTimeZone
          }
        })
        .eq('id', userData.user.id)
        .select();

      console.log("[AdminOnboarding] profileUpdate:", profileUpdate, "error:", profileError);

      if (profileError) throw profileError;

      // Update user metadata
      const { data: updateUserData, error: updateUserError } = await supabase.auth.updateUser({
        data: { 
          onboarded: true,
          company: data.companyName,
          full_name: data.fullName,
          phone: data.phone,
          default_timezone: data.defaultTimeZone
        }
      });
      console.log("[AdminOnboarding] updateUserData:", updateUserData, "error:", updateUserError);

      if (updateUserError) throw updateUserError;

      toast.success('Setup completed successfully!');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1200);

      await refreshUserRole();

    } catch (err: any) {
      console.error('Setup error:', err);
      toast.error(err.message || "Failed to complete admin setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminOnboardingFormBody
      form={form}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
