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
import { useAuth } from '@/contexts/auth';

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
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
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
  'Investment Properties'
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
  'Calabar'
];

export function AgentOnboardingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshUserRole } = useAuth();
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
      agreeToTerms: false
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
          onboarded: true
        }
      });
      
      // Update profiles table with agent information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          license_number: data.licenseNumber,
          years_of_experience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : null,
          specializations: data.specializations,
          working_areas: data.workingAreas,
          bio: data.bio,
          availability_hours: data.availabilityHours,
          preferred_contact_method: data.preferredContactMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.error('Failed to update profile information');
        return;
      }

      // Create agent-specific record if needed (for additional agent data)
      const { error: agentError } = await supabase
        .from('agents')
        .upsert({
          user_id: user.id,
          license_number: data.licenseNumber,
          years_of_experience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : null,
          specializations: data.specializations,
          working_areas: data.workingAreas,
          availability_hours: data.availabilityHours,
          preferred_contact_method: data.preferredContactMethod,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (agentError) {
        console.warn('Agent record creation warning:', agentError);
        // Don't fail the onboarding if agents table doesn't exist yet
      }

      // Refresh user role to ensure proper access
      await refreshUserRole();
      
      toast.success('Agent profile completed successfully!');
      
      // Navigate to agent dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Agent onboarding error:', error);
      toast.error('Failed to complete agent onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary/50 items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Agent Profile</CardTitle>
          <CardDescription>
            Help us set up your agent profile to connect you with property owners and tenants.
            This information will help clients find and work with you effectively.
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
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
                <div className="flex items-center space-x-2 mb-3">
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
                      <div className="grid grid-cols-2 gap-2 mt-2">
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
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {specialization}
                                  </FormLabel>
                                </FormItem>
                              )
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
                      <div className="grid grid-cols-2 gap-2 mt-2">
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
                                              field.value?.filter(
                                                (value) => value !== city
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {city}
                                  </FormLabel>
                                </FormItem>
                              )
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
                          <SelectItem value="business_hours">Business Hours (9 AM - 5 PM)</SelectItem>
                          <SelectItem value="extended_hours">Extended Hours (8 AM - 8 PM)</SelectItem>
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
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to the Terms of Service and Privacy Policy *
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
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
