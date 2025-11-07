
import { UseFormReturn } from "react-hook-form";
import { TenantFormValues } from "./tenantFormSchema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PropertySelector } from "@/components/maintenance/vendors/PropertySelector";

interface LeaseInfoFieldsProps {
  form: UseFormReturn<TenantFormValues>;
}

export function LeaseInfoFields({ form }: LeaseInfoFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="propertyId"
        render={({ field }) => (
          <PropertySelector
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="rentAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rent Amount</FormLabel>
              <FormControl>
                <Input placeholder="₦0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="depositAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Security Deposit (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="₦0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lease Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lease End Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="rentDueDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rent Due Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
