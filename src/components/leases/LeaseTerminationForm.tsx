
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { initiateLeaseAction } from '@/services/leases/leaseTerminationService';

const formSchema = z.object({
  moveOutDate: z.date({
    required_error: "Move out date is required.",
  }),
  reason: z.string().min(10, {
    message: "Reason must be at least 10 characters.",
  }),
});

type LeaseTerminationFormValues = z.infer<typeof formSchema>;

export function LeaseTerminationForm({ 
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
  
  // Use the current end date as the default move out date
  const defaultMoveOutDate = new Date(currentEndDate);
  
  const form = useForm<LeaseTerminationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moveOutDate: defaultMoveOutDate,
      reason: '',
    },
  });

  async function onSubmit(values: LeaseTerminationFormValues) {
    setIsSubmitting(true);
    
    try {
      const effectiveDate = format(values.moveOutDate, 'yyyy-MM-dd');
      
      const result = await initiateLeaseAction(
        leaseId,
        tenantId,
        propertyId,
        'terminate',
        values.reason,
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
          name="moveOutDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Move-out Date</FormLabel>
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
                The date you plan to move out of the property.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Termination</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please explain why you're ending your lease..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This information helps us improve our services.
              </FormDescription>
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
            Submit Termination Request
          </Button>
        </div>
      </form>
    </Form>
  );
}
