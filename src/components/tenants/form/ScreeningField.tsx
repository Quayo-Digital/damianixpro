import { UseFormReturn } from 'react-hook-form';
import { TenantFormValues } from './tenantFormSchema';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

interface ScreeningFieldProps {
  form: UseFormReturn<TenantFormValues>;
}

export function ScreeningField({ form }: ScreeningFieldProps) {
  return (
    <FormField
      control={form.control}
      name="requestScreening"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>Initiate tenant screening process</FormLabel>
            <p className="text-sm text-muted-foreground">
              Automatically start background checks, credit verification, and reference checks
            </p>
          </div>
        </FormItem>
      )}
    />
  );
}
