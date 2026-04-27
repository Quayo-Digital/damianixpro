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
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, Users, Shield, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthSession, useAuthActions } from '@/contexts/auth';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  licenseNumber: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  workingAreas: z.array(z.string()).optional(),
  bio: z.string().optional(),
  availabilityHours: z.string().optional(),
  preferredContactMethod: z.enum(['phone', 'email', 'whatsapp']).optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const propertySpecializations = [
  'Residential Sales',
  'Residential Rentals',
  'Commercial Properties',
  'Luxury Properties',
  'Student Housing',
  'Short-term Rentals',
  'Property Management',
  'Investment Properties',
];

const nigerianCities = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Benin City',
  'Kaduna',
  'Jos',
  'Warri',
  'Calabar',
];

export function AgentOnboardingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthSession();
  const { refreshUserRole } = useAuthActions();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      phone: user?.user_metadata?.phone || '',
      licenseNumber: '',
      yearsOfExperience: '',
      specializations: [],
      workingAreas: [],
      bio: '',
      availabilityHours: 'business_hours',
      preferredContactMethod: 'phone',
      agreeToTerms: false,
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

      // Update user metadata with agent-specific information
      await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone: data.phone,
          license_number: data.licenseNumber,
          years_of_experience: data.yearsOfExperience,
          specializations: data.specializations,
          working_areas: data.workingAreas,
          bio: data.bio,
          availability_hours: data.availabilityHours,
          preferred_contact_method: data.preferredContactMethod,
          onboarded: true,
        },
      });

      // Upsert profiles table with agent information (insert if doesn't exist, update if it does)
      // Note: role is stored in user_roles table, not profiles table
      const profileData: any = {
        id: user.id,
        full_name: data.fullName,
        email: user.email || '',
        phone: data.phone,
        license_number: data.licenseNumber,
        years_of_experience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : null,
        specializations: data.specializations,
        working_areas: data.workingAreas,
        bio: data.bio,
        availability_hours: data.availabilityHours,
        preferred_contact_method: data.preferredContactMethod,
        updated_at: new Date().toISOString(),
      };

      // Only add role if the column exists (some schemas have it, others don't)
      // The role is primarily stored in user_roles table anyway

      // Use upsert to handle both insert and update cases
      const { error: profileError } = await supabase.from('profiles').upsert(profileData, {
        onConflict: 'id',
      });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        toast.error(
          `Failed to save profile information: ${profileError.message || 'Unknown error'}`
        );
        return;
      }

      // Create agent-specific record if needed (for additional agent data)
      const { error: agentError } = await supabase.from('agents').upsert(
        {
          user_id: user.id,
          license_number: data.licenseNumber,
          years_of_experience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : null,
          specializations: data.specializations,
          working_areas: data.workingAreas,
          availability_hours: data.availabilityHours,
          preferred_contact_method: data.preferredContactMethod,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

      if (agentError) {
        console.warn('Agent record creation warning:', agentError);
        // Don't fail the onboarding if agents table doesn't exist yet
      }

      // Ensure user_roles table has agent role entry
      // Try update first, then insert if not found (handles UNIQUE constraint properly)
      try {
        // First, try to update existing role
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.warn('Error checking user_roles:', checkError);
        }

        if (existingRole) {
          // Update existing role
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({
              role: 'agent',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.warn('User role update warning:', updateError);
          } else {
            console.log('✅ Updated user role to agent');
          }
        } else {
          // Insert new role
          const { error: insertError } = await supabase.from('user_roles').insert({
            user_id: user.id,
            role: 'agent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (insertError) {
            console.warn('User role creation warning:', insertError);
            // If insert fails due to conflict, try update as fallback
            if (
              insertError.code === '23505' ||
              insertError.message?.includes('duplicate') ||
              insertError.message?.includes('unique')
            ) {
              console.log('Role already exists, attempting update...');
              const { error: fallbackUpdateError } = await supabase
                .from('user_roles')
                .update({
                  role: 'agent',
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

              if (fallbackUpdateError) {
                console.warn('Fallback update also failed:', fallbackUpdateError);
              } else {
                console.log('✅ Updated user role to agent (fallback)');
              }
            }
          } else {
            console.log('✅ Created user role as agent');
          }
        }
      } catch (userRoleError) {
        console.warn('Could not update user_roles table:', userRoleError);
      }

      // Refresh user role to ensure proper access
      await refreshUserRole();

      toast.success('Agent profile completed successfully!');

      navigate('/agent/dashboard', { replace: true });
    } catch (error) {
      console.error('Agent onboarding error:', error);
      toast.error('Failed to complete agent onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Agent Profile</CardTitle>
          <CardDescription>
            Help us set up your agent profile to connect you with property owners and tenants. This
            information will help clients find and work with you effectively.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="mb-3 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
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
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +234 801 234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Contact Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How should clients contact you?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <div className="mb-3 flex items-center space-x-2">
                  <Home className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Professional Information</h3>
                </div>

                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Real Estate License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your license number (if applicable)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">New to real estate</SelectItem>
                          <SelectItem value="1">1 year</SelectItem>
                          <SelectItem value="2">2 years</SelectItem>
                          <SelectItem value="3">3 years</SelectItem>
                          <SelectItem value="5">5+ years</SelectItem>
                          <SelectItem value="10">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specializations"
                  render={() => (
                    <FormItem>
                      <FormLabel>Property Specializations</FormLabel>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {propertySpecializations.map((specialization) => (
                          <FormField
                            key={specialization}
                            control={form.control}
                            name="specializations"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={specialization}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(specialization)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), specialization])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== specialization
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {specialization}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workingAreas"
                  render={() => (
                    <FormItem>
                      <FormLabel>Working Areas</FormLabel>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {nigerianCities.map((city) => (
                          <FormField
                            key={city}
                            control={form.control}
                            name="workingAreas"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={city}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(city)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), city])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== city)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{city}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availabilityHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Hours</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="When are you available?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="business_hours">
                            Business Hours (9 AM - 5 PM)
                          </SelectItem>
                          <SelectItem value="extended_hours">
                            Extended Hours (8 AM - 8 PM)
                          </SelectItem>
                          <SelectItem value="flexible">Flexible Hours</SelectItem>
                          <SelectItem value="weekends_only">Weekends Only</SelectItem>
                          <SelectItem value="24_7">24/7 Available</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell clients about your experience, approach, and what makes you a great agent..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Terms and Conditions */}
              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I agree to the Terms of Service and Privacy Policy *</FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Agent Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
