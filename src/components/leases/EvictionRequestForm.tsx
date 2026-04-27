import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { initiateLeaseAction } from '@/services/leases/leaseTerminationService';

const formSchema = z.object({
  reason: z.string().min(15, {
    message: 'Eviction reason must be at least 15 characters.',
  }),
  evictionType: z.enum(['non_payment', 'violation', 'illegal_activity', 'other'], {
    required_error: 'Please select an eviction type.',
  }),
  effectiveDate: z.date({
    required_error: 'Eviction date is required.',
  }),
  additionalDetails: z.string().optional(),
});

type EvictionFormValues = z.infer<typeof formSchema>;

export function EvictionRequestForm({
  leaseId,
  tenantId,
  propertyId,
  onSuccess,
  onCancel,
}: {
  leaseId: string;
  tenantId: string;
  propertyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with default date (today + 30 days)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);

  const form = useForm<EvictionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: '',
      evictionType: 'non_payment',
      effectiveDate: defaultDate,
      additionalDetails: '',
    },
  });

  async function onSubmit(values: EvictionFormValues) {
    setIsSubmitting(true);

    try {
      const effectiveDate = format(values.effectiveDate, 'yyyy-MM-dd');
      const fullReason = `${values.evictionType}: ${values.reason} ${values.additionalDetails ? `Additional details: ${values.additionalDetails}` : ''}`;

      const result = await initiateLeaseAction(
        leaseId,
        tenantId,
        propertyId,
        'evict',
        fullReason,
        'owner',
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
          name="evictionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eviction Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason for eviction" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="non_payment">Non-Payment of Rent</SelectItem>
                  <SelectItem value="violation">Lease Agreement Violation</SelectItem>
                  <SelectItem value="illegal_activity">Illegal Activity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The primary reason for initiating eviction.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="effectiveDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Eviction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
              <FormDescription>The date on which the eviction will take effect.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eviction Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide specific details for the eviction request..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include specific incidents, dates, and any previous warnings given.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Details (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information or context..."
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
          <Button type="submit" variant="destructive" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Eviction Request
          </Button>
        </div>
      </form>
    </Form>
  );
}
