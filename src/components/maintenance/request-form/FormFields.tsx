
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

// Define the schema for easy reuse
export const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters' }),
  property: z.string().min(1, { message: 'Property is required' }),
  tenant: z.string().min(2, { message: 'Tenant is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  priority: z.enum(['low', 'medium', 'high']),
});

export type MaintenanceFormValues = z.infer<typeof formSchema>;

interface FormFieldsProps {
  form: UseFormReturn<MaintenanceFormValues>;
  isLoadingProperties: boolean;
  properties: Array<{ id: string, name: string }>;
}

export function FormFields({ form, isLoadingProperties, properties }: FormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Issue Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Plumbing Issue" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="property"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Property</FormLabel>
            <PropertySelector 
              field={field}
              properties={properties}
              isLoadingProperties={isLoadingProperties}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="tenant"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tenant</FormLabel>
            <FormControl>
              <Input placeholder="Enter tenant name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Priority</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe the issue in detail" 
                {...field} 
                className="min-h-[120px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

// Property selector sub-component
interface PropertySelectorProps {
  field: any;
  properties: Array<{ id: string, name: string }>;
  isLoadingProperties: boolean;
}

function PropertySelector({ field, properties, isLoadingProperties }: PropertySelectorProps) {
  if (isLoadingProperties) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading properties...</span>
      </div>
    );
  }
  
  return (
    <FormControl>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Select property" />
        </SelectTrigger>
        <SelectContent>
          {properties.map(property => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );
}
