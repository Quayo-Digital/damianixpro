import React from 'react';
import { Link } from 'react-router-dom';
import { UseFormReturn } from 'react-hook-form';
import { AdminOnboardingFormValues } from './adminOnboardingSchema';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';

interface AdminOnboardingFormBodyProps {
  form: UseFormReturn<AdminOnboardingFormValues>;
  onSubmit: (values: AdminOnboardingFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function AdminOnboardingFormBody({
  form,
  onSubmit,
  isSubmitting,
}: AdminOnboardingFormBodyProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Organization Profile</CardTitle>
            <CardDescription className="space-y-2">
              <span className="block">
                Set up your organization’s admin profile and default settings.
              </span>
              <span className="block text-xs leading-relaxed">
                Migrating spreadsheets or onboarding a large landlord team? Continue here after
                signup:{' '}
                <Link
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  to="/organization/setup"
                >
                  Company setup &amp; Excel import wizard
                </Link>
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+234..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="janedoe@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Company Rd." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultTimeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Time Zone</FormLabel>
                  <FormControl>
                    <Input placeholder="Africa/Lagos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Admin Setup
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
