import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

const SERVICE_CATEGORIES = [
  'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting', 'Cleaning',
  'Security', 'Landscaping', 'Roofing', 'Flooring', 'Appliance Repair',
  'General Maintenance', 'Pest Control', 'Moving Services', 'Other'
] as const;

const NIGERIAN_STATES = [
  'Lagos', 'Abuja FCT', 'Kano', 'Rivers', 'Oyo', 'Delta', 'Imo', 'Anambra',
  'Kaduna', 'Akwa Ibom', 'Osun', 'Edo', 'Kwara', 'Ogun', 'Enugu'
] as const;

const vendorOnboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(5, 'Please enter your business address'),
  primaryCategory: z.enum(SERVICE_CATEGORIES, {
    required_error: 'Please select your primary service category'
  }),
  specialties: z.array(z.string()).min(1, 'Please select at least one specialty'),
  serviceAreas: z.array(z.string()).min(1, 'Please select at least one service area'),
  yearsOfExperience: z.number().min(0).max(50),
  hourlyRate: z.number().min(0).optional(),
  description: z.string().min(20, 'Please provide a detailed description of your services'),
  businessLicense: z.string().optional(),
  insuranceProvider: z.string().optional(),
  availableWeekdays: z.boolean().default(true),
  availableWeekends: z.boolean().default(false),
  available24Hours: z.boolean().default(false)
});

type VendorOnboardingFormData = z.infer<typeof vendorOnboardingSchema>;

export function VendorOnboardingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
  const { user, refreshUserRole } = useAuth();
  const navigate = useNavigate();

  const form = useForm<VendorOnboardingFormData>({
    resolver: zodResolver(vendorOnboardingSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      companyName: '',
      address: '',
      specialties: [],
      serviceAreas: [],
      yearsOfExperience: 0,
      hourlyRate: 0,
      description: '',
      businessLicense: '',
      insuranceProvider: '',
      availableWeekdays: true,
      availableWeekends: false,
      available24Hours: false
    }
  });

  const handleSpecialtyToggle = (specialty: string) => {
    const updated = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty];
    
    setSelectedSpecialties(updated);
    form.setValue('specialties', updated);
  };

  const handleServiceAreaToggle = (area: string) => {
    const updated = selectedServiceAreas.includes(area)
      ? selectedServiceAreas.filter(a => a !== area)
      : [...selectedServiceAreas, area];
    
    setSelectedServiceAreas(updated);
    form.setValue('serviceAreas', updated);
  };

  const onSubmit = async (data: VendorOnboardingFormData) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          onboarding_tour_completed: true
        })
        .eq('id', user.id);

      if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);

      // Create vendor record
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          name: data.companyName,
          category: data.primaryCategory,
          email: data.email,
          phone: data.phone,
          address: data.address,
          specialties: data.specialties,
          service_areas: data.serviceAreas,
          professional_references: data.references,
          business_license: data.businessLicense,
          insurance_provider: data.insuranceProvider,
          years_of_experience: data.yearsOfExperience,
          hourly_rate: data.hourlyRate,
          available_weekdays: data.availableWeekdays,
          available_weekends: data.availableWeekends,
          available_24_hours: data.available24Hours,
          description: data.description,
          rating: 0.0,
          total_jobs: 0,
          completed_jobs: 0,
          active: true
        });

      if (vendorError) throw new Error(`Vendor creation failed: ${vendorError.message}`);

      // Update user metadata
      await supabase.auth.updateUser({
        data: { 
          onboarded: true,
          role: 'vendor',
          company: data.companyName
        }
      });

      await refreshUserRole(user.id);
      toast.success('Vendor onboarding completed successfully!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Vendor onboarding error:', error);
      toast.error(error instanceof Error ? error.message : 'Onboarding failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wrench className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl font-bold">Vendor Onboarding</CardTitle>
          </div>
          <CardDescription>Join Nigeria Homes as a trusted service provider</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
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
                        <FormLabel>Company/Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
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
                          <Input placeholder="+234 xxx xxx xxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your business address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Service Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Information</h3>
                
                <FormField
                  control={form.control}
                  name="primaryCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Service Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your main service category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="mb-3 block">Service Specialties (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SERVICE_CATEGORIES.map((specialty) => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={specialty}
                          checked={selectedSpecialties.includes(specialty)}
                          onCheckedChange={() => handleSpecialtyToggle(specialty)}
                        />
                        <label htmlFor={specialty} className="text-sm">{specialty}</label>
                      </div>
                    ))}
                  </div>
                  {selectedSpecialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {selectedSpecialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">{specialty}</Badge>
                      ))}
                    </div>
                  )}
                  {form.formState.errors.specialties && (
                    <p className="text-sm text-destructive mt-2">
                      {form.formState.errors.specialties.message}
                    </p>
                  )}
                </div>

                <div>
                  <FormLabel className="mb-3 block">Service Areas (Select states where you operate)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {NIGERIAN_STATES.map((state) => (
                      <div key={state} className="flex items-center space-x-2">
                        <Checkbox
                          id={state}
                          checked={selectedServiceAreas.includes(state)}
                          onCheckedChange={() => handleServiceAreaToggle(state)}
                        />
                        <label htmlFor={state} className="text-sm">{state}</label>
                      </div>
                    ))}
                  </div>
                  {selectedServiceAreas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {selectedServiceAreas.map((area) => (
                        <Badge key={area} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  )}
                  {form.formState.errors.serviceAreas && (
                    <p className="text-sm text-destructive mt-2">
                      {form.formState.errors.serviceAreas.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate (₦)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business License (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="License number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Insurance company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your services, experience, and what makes you unique..."
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Availability</h3>
                
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="availableWeekdays"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="weekdays"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label htmlFor="weekdays" className="text-sm font-medium">
                          Available on weekdays (Monday - Friday)
                        </label>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableWeekends"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="weekends"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label htmlFor="weekends" className="text-sm font-medium">
                          Available on weekends (Saturday - Sunday)
                        </label>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="available24Hours"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="24hours"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label htmlFor="24hours" className="text-sm font-medium">
                          Available 24/7 for emergencies
                        </label>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Onboarding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Onboarding
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
