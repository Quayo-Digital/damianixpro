
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { initiateLeaseAction } from '@/services/leases/leaseTerminationService';

const formSchema = z.object({
  renewalPeriod: z.enum(['6', '12', '24'], {
    required_error: "Please select a renewal period.",
  }),
  effectiveDate: z.date({
    required_error: "Renewal start date is required.",
  }),
  additionalNotes: z.string().optional(),
});

type LeaseRenewalFormValues = z.infer<typeof formSchema>;

export function LeaseRenewalForm({ 
  leaseId, 
  tenantId, 
  propertyId,
  currentEndDate,
  onSuccess,
  onCancel
}: { 
  leaseId: string, 
  tenantId: string, 
  propertyId: string,
  currentEndDate: string,
  onSuccess: () => void,
  onCancel: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the currentEndDate as the default effective date
  const defaultEffectiveDate = new Date(currentEndDate);
  
  const form = useForm<LeaseRenewalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      renewalPeriod: '12',
      effectiveDate: defaultEffectiveDate,
      additionalNotes: '',
    },
  });

  async function onSubmit(values: LeaseRenewalFormValues) {
    setIsSubmitting(true);
    
    try {
      const effectiveDate = format(values.effectiveDate, 'yyyy-MM-dd');
      const reason = `Renewal request for ${values.renewalPeriod} months. Notes: ${values.additionalNotes}`;
      
      const result = await initiateLeaseAction(
        leaseId,
        tenantId,
        propertyId,
        'renew',
        reason,
        'tenant',
        effectiveDate
      );
      
      if (result.success) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="renewalPeriod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Renewal Period</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="6" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      6 months
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="12" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      12 months
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="24" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      24 months
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="effectiveDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Renewal Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Typically, this would be the day after your current lease expires.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requests or questions about the renewal..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Renewal Request
          </Button>
        </div>
      </form>
    </Form>
  );
}
