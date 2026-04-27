import { UseFormReturn } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface ChecklistSectionProps {
  form: UseFormReturn<any>;
  sectionId: string;
  title: string;
  items: string[];
}

export const ChecklistSection = ({ form, sectionId, title, items }: ChecklistSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="shadow-sm">
      <CardHeader className="cursor-pointer py-4" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{title}</span>
          <span className="text-sm text-muted-foreground">
            {expanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="border-t pt-4">
          <div className="space-y-4">
            {items.map((item) => {
              const fieldName = `${sectionId}-${item.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')}`;

              return (
                <div key={fieldName} className="border-b pb-4 last:border-0">
                  <div className="mb-2 font-medium">{item}</div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`${fieldName}.condition`}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Condition</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="good" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">Good</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="fair" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">Fair</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="poor" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">Poor</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="n/a" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">N/A</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`${fieldName}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Add notes about condition" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
