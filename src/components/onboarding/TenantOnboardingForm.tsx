
import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  emergencyContact: z.string().optional(),
  occupation: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function TenantOnboardingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshUserRole } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      phone: user?.user_metadata?.phone || '',
      emergencyContact: '',
      occupation: ''
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Get current user
      if (!user) {
        toast.error('User authentication error');
        return;
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: { 
          full_name: data.fullName,
          phone: data.phone,
          onboarded: true
        }
      });
      
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Check if tenant record exists
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      // Create or update tenant record
      if (existingTenant) {
        await supabase
          .from('tenants')
          .update({
            first_name: data.fullName.split(' ')[0],
            last_name: data.fullName.split(' ').slice(1).join(' '),
            phone: data.phone
          })
          .eq('id', existingTenant.id);
      } else {
        await supabase
          .from('tenants')
          .insert({
            user_id: user.id,
            first_name: data.fullName.split(' ')[0],
            last_name: data.fullName.split(' ').slice(1).join(' '),
            email: user.email,
            phone: data.phone,
            status: 'active'
          });
      }

      toast.success('Profile setup completed');
      
      // Refresh user role to ensure latest data
      await refreshUserRole();
      
      // Redirect to tenant dashboard
      setTimeout(() => {
        navigate('/tenant/dashboard');
      }, 1500);
      
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Failed to complete profile setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Tenant Profile</CardTitle>
            <CardDescription>
              Please provide your details to complete your tenant profile
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
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name and number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your occupation" {...field} />
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
                  Saving Profile...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Profile Setup
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
