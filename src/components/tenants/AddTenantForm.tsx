
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { tenantFormSchema, TenantFormValues } from "./form/tenantFormSchema";
import { TenantInfoFields } from "./form/TenantInfoFields";
import { LeaseInfoFields } from "./form/LeaseInfoFields";
import { ScreeningField } from "./form/ScreeningField";
import { initiateTenantScreening } from "@/services/tenants/screening";

export function AddTenantForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      propertyId: "",
      rentAmount: "",
      rentDueDate: "",
      depositAmount: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      requestScreening: true,
    },
  });

  const onSubmit = async (data: TenantFormValues) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          status: "active",
        })
        .select("id")
        .single();

      if (tenantError) throw tenantError;
      
      // Step 2: Create property_tenant record
      const { error: propertyTenantError } = await supabase
        .from("property_tenants")
        .insert({
          property_id: data.propertyId,
          tenant_id: tenant.id,
          rent_amount: parseFloat(data.rentAmount),
          deposit_amount: data.depositAmount ? parseFloat(data.depositAmount) : null,
          start_date: data.startDate,
          end_date: data.endDate || null,
        });

      if (propertyTenantError) throw propertyTenantError;
      
      // Step 3: Initiate tenant screening if requested
      if (data.requestScreening) {
        await initiateTenantScreening(tenant.id);
      }
      
      toast({
        title: "Success!",
        description: "Tenant has been added successfully.",
      });
      
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error adding tenant:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <TenantInfoFields form={form} />
            <LeaseInfoFields form={form} />
            <ScreeningField form={form} />
          </div>
        </ScrollArea>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Tenant"}
        </Button>
      </form>
    </Form>
  );
}
