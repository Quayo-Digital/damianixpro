// Enhanced Tenant Onboarding with AI Preferences Setup

import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CheckCircle,
  User,
  Brain,
  Home,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthSession, useAuthActions } from '@/contexts/auth';
import { PreferencesSetup } from '@/components/ai/PreferencesSetup';

const basicInfoSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  emergencyContact: z.string().optional(),
  occupation: z.string().optional(),
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

type OnboardingStep = 'welcome' | 'basic-info' | 'ai-preferences' | 'complete';

export function EnhancedTenantOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [basicInfoCompleted, setBasicInfoCompleted] = useState(false);
  const { user } = useAuthSession();
  const { refreshUserRole } = useAuthActions();
  const navigate = useNavigate();

  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      phone: user?.user_metadata?.phone || '',
      emergencyContact: '',
      occupation: '',
    },
  });

  const steps = [
    { id: 'welcome', title: 'Welcome', description: 'Get started with DamianixPro' },
    { id: 'basic-info', title: 'Basic Info', description: 'Tell us about yourself' },
    { id: 'ai-preferences', title: 'AI Preferences', description: 'Personalize your experience' },
    { id: 'complete', title: 'Complete', description: "You're all set!" },
  ];

  const getCurrentStepIndex = () => steps.findIndex((step) => step.id === currentStep);
  const getProgressPercentage = () => ((getCurrentStepIndex() + 1) / steps.length) * 100;

  const handleBasicInfoSubmit = async (values: BasicInfoValues) => {
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check if tenant record already exists
      const { data: existingTenant, error: checkError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const firstName = values.fullName.split(' ')[0];
      const lastName = values.fullName.split(' ').slice(1).join(' ') || '';

      let tenantData;
      let tenantError;

      if (existingTenant) {
        // Update existing tenant record
        const { data, error } = await supabase
          .from('tenants')
          .update({
            first_name: firstName,
            last_name: lastName,
            email: user?.email,
            phone: values.phone,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        tenantData = data;
        tenantError = error;
      } else {
        // Create new tenant record
        const { data, error } = await supabase
          .from('tenants')
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            email: user?.email,
            phone: values.phone,
            status: 'active',
          })
          .select()
          .single();

        tenantData = data;
        tenantError = error;
      }

      // Handle duplicate key error (409) gracefully - tenant already exists
      if (tenantError) {
        if (tenantError.code === '23505' || tenantError.message?.includes('duplicate key')) {
          // Tenant record already exists, try to update it instead
          const { data: updatedTenant, error: updateError } = await supabase
            .from('tenants')
            .update({
              first_name: firstName,
              last_name: lastName,
              email: user?.email,
              phone: values.phone,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }
          tenantData = updatedTenant;
        } else {
          throw tenantError;
        }
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: values.fullName,
          phone: values.phone,
          onboarded: false, // Will be set to true after AI preferences
        },
      });

      if (updateError) throw updateError;

      setBasicInfoCompleted(true);
      setCurrentStep('ai-preferences');
      toast.success('Basic information saved successfully!');
    } catch (error: any) {
      console.error('Error saving basic info:', error);
      toast.error(error.message || 'Failed to save information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferencesComplete = async () => {
    setIsSubmitting(true);

    try {
      // Mark user as fully onboarded
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
        },
      });

      if (updateError) throw updateError;

      const refreshedRole = await refreshUserRole();
      setCurrentStep('complete');
      toast.success('Welcome to DamianixPro! Your AI preferences are set up.');

      // Navigate to role-specific dashboard after a short delay
      setTimeout(() => {
        if (refreshedRole === 'tenant') {
          navigate('/tenant/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipPreferences = async () => {
    setIsSubmitting(true);

    try {
      // Mark user as onboarded even without preferences
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
        },
      });

      if (updateError) throw updateError;

      const refreshedRole = await refreshUserRole();

      // Verify role is actually 'tenant' before proceeding
      if (refreshedRole !== 'tenant') {
        console.error('Role mismatch: Expected tenant, got:', refreshedRole);
        toast.error('Role verification failed. Please contact support.');
        return;
      }

      toast.success('Welcome to DamianixPro! You can set up AI preferences later in your profile.');
      // Navigate to tenant dashboard
      navigate('/tenant/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWelcomeStep = () => (
    <Card className="mx-auto w-full max-w-2xl border-border bg-card text-card-foreground shadow-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 p-3 ring-1 ring-border">
          <Home className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to DamianixPro!</CardTitle>
        <CardDescription className="text-lg">
          Let's get you set up with your personalized property management experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/60 p-4 text-center">
            <User className="mx-auto mb-2 h-8 w-8 text-primary" />
            <h3 className="font-semibold text-foreground">Your Profile</h3>
            <p className="text-sm text-muted-foreground">Basic information and preferences</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/60 p-4 text-center">
            <Brain className="mx-auto mb-2 h-8 w-8 text-primary" />
            <h3 className="font-semibold text-foreground">AI Matching</h3>
            <p className="text-sm text-muted-foreground">Personalized property recommendations</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/60 p-4 text-center">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary" />
            <h3 className="font-semibold text-foreground">Smart Features</h3>
            <p className="text-sm text-muted-foreground">Intelligent property management</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h4 className="font-semibold text-foreground">AI-Powered Experience</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Our AI learns your preferences to recommend properties that perfectly match your
            lifestyle, budget, and location needs. The more you use the platform, the smarter it
            gets!
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setCurrentStep('basic-info')} className="w-full" size="lg">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderBasicInfoStep = () => (
    <Card className="mx-auto w-full max-w-2xl border-border bg-card text-card-foreground shadow-md">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tell us a bit about yourself</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBasicInfoSubmit)} className="space-y-4">
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
                    <Input placeholder="Enter your phone number" {...field} />
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
                  <FormLabel>Emergency Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Emergency contact number (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input placeholder="Your occupation (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('welcome')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={form.handleSubmit(handleBasicInfoSubmit)} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderAIPreferencesStep = () => (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card className="border-border bg-card text-card-foreground shadow-md">
        <CardHeader className="text-center">
          <div className="mb-2 flex items-center justify-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle>AI Preferences Setup</CardTitle>
          </div>
          <CardDescription>
            Help our AI understand your preferences for personalized property recommendations
          </CardDescription>
          <div className="mt-4 flex justify-center space-x-2">
            <Badge
              variant="secondary"
              className="border border-primary/25 bg-primary/15 text-foreground"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Smart Matching
            </Badge>
            <Badge variant="secondary" className="border border-border bg-muted text-foreground">
              Personalized
            </Badge>
            <Badge
              variant="secondary"
              className="border border-primary/25 bg-primary/10 text-foreground"
            >
              Learning AI
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <PreferencesSetup
        onComplete={handlePreferencesComplete}
        showProgress={false}
        onboardingMode={true}
      />

      <Card className="border-border bg-card text-card-foreground shadow-md">
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('basic-info')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" onClick={handleSkipPreferences} disabled={isSubmitting}>
            Skip for now (can set up later)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderCompleteStep = () => (
    <Card className="mx-auto w-full max-w-2xl border-border bg-card text-card-foreground shadow-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 p-3 ring-1 ring-border">
          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <CardTitle className="text-2xl">Welcome to DamianixPro!</CardTitle>
        <CardDescription className="text-lg">
          Your account is set up and ready to go
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-4">
          <h4 className="mb-2 font-semibold text-foreground">What's Next?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Browse personalized property recommendations</li>
            <li>• Apply for properties that match your preferences</li>
            <li>• Manage payments and maintenance requests</li>
            <li>• Connect with property owners and agents</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Redirecting to your dashboard in a moment...
          </p>
          <div className="mt-2">
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-muted/60 p-4 text-foreground">
      <div className="w-full max-w-5xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="mb-4 flex justify-center">
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                    ${
                      index <= getCurrentStepIndex()
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                  >
                    {index < getCurrentStepIndex() ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                      mx-2 h-0.5 w-8
                      ${index < getCurrentStepIndex() ? 'bg-primary' : 'bg-border'}
                    `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold">{steps[getCurrentStepIndex()]?.title}</h2>
            <p className="text-sm text-muted-foreground">
              {steps[getCurrentStepIndex()]?.description}
            </p>
          </div>

          <div className="mx-auto mt-4 max-w-md">
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Step {getCurrentStepIndex() + 1} of {steps.length}
            </p>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'welcome' && renderWelcomeStep()}
        {currentStep === 'basic-info' && renderBasicInfoStep()}
        {currentStep === 'ai-preferences' && renderAIPreferencesStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
}

export default EnhancedTenantOnboarding;
