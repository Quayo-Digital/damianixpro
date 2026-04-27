import React from 'react';
import { Control } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ApplicationFormValues } from './schema';

interface TermsSectionProps {
  control: Control<ApplicationFormValues>;
}

const TermsSection = ({ control }: TermsSectionProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="consentToBackground"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>I consent to background and credit checks to be performed</FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="agreeToTerms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                I agree to the{' '}
                <Link to="/terms" className="text-primary underline">
                  terms and conditions
                </Link>{' '}
                and confirm that all information provided is accurate
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default TermsSection;
