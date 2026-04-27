import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChecklistSection } from './ChecklistSection';
import { useToast } from '@/hooks/use-toast';

interface InspectionFormProps {
  propertyId?: string;
  inspectionType: 'move-in' | 'move-out';
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
}

const roomSections = [
  {
    id: 'living-room',
    title: 'Living Room',
    items: [
      'Walls',
      'Ceiling',
      'Floor/Carpet',
      'Windows',
      'Curtains/Blinds',
      'Light Fixtures',
      'Electrical Outlets',
    ],
  },
  {
    id: 'kitchen',
    title: 'Kitchen',
    items: [
      'Countertops',
      'Cabinets',
      'Sink',
      'Faucet',
      'Stove/Oven',
      'Refrigerator',
      'Dishwasher',
      'Floor',
      'Walls',
    ],
  },
  {
    id: 'bathroom',
    title: 'Bathroom',
    items: [
      'Sink',
      'Toilet',
      'Bathtub/Shower',
      'Tiles',
      'Floor',
      'Mirror',
      'Towel Rails',
      'Exhaust Fan',
    ],
  },
  {
    id: 'bedroom',
    title: 'Bedroom',
    items: [
      'Walls',
      'Ceiling',
      'Floor/Carpet',
      'Windows',
      'Curtains/Blinds',
      'Closet',
      'Light Fixtures',
    ],
  },
  {
    id: 'exterior',
    title: 'Exterior & Misc',
    items: [
      'Front Door',
      'Back Door',
      'Patio/Balcony',
      'Mailbox',
      'Smoke Detectors',
      'Carbon Monoxide Detectors',
    ],
  },
];

const formSchema = z.object({
  generalNotes: z.string().optional(),
  recommendation: z.enum(['pass', 'fail', 'conditional']),
  ...Object.fromEntries(
    roomSections.flatMap((section) =>
      section.items.map((item) => [
        `${section.id}-${item.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')}`,
        z.object({
          condition: z.enum(['good', 'fair', 'poor', 'n/a']),
          notes: z.string().optional(),
        }),
      ])
    )
  ),
});

type FormValues = z.infer<typeof formSchema>;

export const InspectionForm = ({
  propertyId,
  inspectionType,
  isSubmitting,
  setIsSubmitting,
  onSuccess,
}: InspectionFormProps) => {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generalNotes: '',
      recommendation: 'pass',
      ...Object.fromEntries(
        roomSections.flatMap((section) =>
          section.items.map((item) => [
            `${section.id}-${item.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')}`,
            { condition: 'good', notes: '' },
          ])
        )
      ),
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Here you'd typically save the data to your backend
      console.log('Inspection data:', { propertyId, inspectionType, ...data });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Inspection saved',
        description: `${inspectionType === 'move-in' ? 'Move-in' : 'Move-out'} inspection has been recorded.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast({
        title: 'Error saving inspection',
        description: 'There was a problem saving the inspection. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {roomSections.map((section) => (
          <ChecklistSection
            key={section.id}
            form={form}
            sectionId={section.id}
            title={section.title}
            items={section.items}
          />
        ))}

        <FormField
          control={form.control}
          name="generalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes or observations about the property"
                  className="h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recommendation"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Final Recommendation</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="pass" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Pass - Property meets all standards
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="conditional" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Conditional - Minor issues to be addressed
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="fail" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Fail - Major issues require attention
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Inspection'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
