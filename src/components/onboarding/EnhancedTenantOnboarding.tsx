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
  Sparkles 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { PreferencesSetup } from '@/components/ai/PreferencesSetup';

const basicInfoSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  emergencyContact: z.string().optional(),
  occupation: z.string().optional()
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

type OnboardingStep = 'welcome' | 'basic-info' | 'ai-preferences' | 'complete';

export function EnhancedTenantOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [basicInfoCompleted, setBasicInfoCompleted] = useState(false);
  const { user, refreshUserRole } = useAuth();
  const navigate = useNavigate();

  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      phone: user?.user_metadata?.phone || '',
      emergencyContact: '',
      occupation: ''
    }
  });

  const steps = [
    { id: 'welcome', title: 'Welcome', description: 'Get started with Nigeria Homes' },
    { id: 'basic-info', title: 'Basic Info', description: 'Tell us about yourself' },
    { id: 'ai-preferences', title: 'AI Preferences', description: 'Personalize your experience' },
    { id: 'complete', title: 'Complete', description: 'You\'re all set!' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const getProgressPercentage = () => ((getCurrentStepIndex() + 1) / steps.length) * 100;

  const handleBasicInfoSubmit = async (values: BasicInfoValues) => {
    setIsSubmitting(true);
    
    try {
      // Create tenant record
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          user_id: user?.id,
          first_name: values.fullName.split(' ')[0],
          last_name: values.fullName.split(' ').slice(1).join(' ') || '',
          email: user?.email,
          phone: values.phone,
          status: 'active'
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: values.fullName,
          phone: values.phone,
          onboarded: false // Will be set to true after AI preferences
        }
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
          onboarded: true
        }
      });

      if (updateError) throw updateError;

      await refreshUserRole();
      setCurrentStep('complete');
      toast.success('Welcome to Nigeria Homes! Your AI preferences are set up.');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
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
          onboarded: true
        }
      });

      if (updateError) throw updateError;

      await refreshUserRole();
      toast.success('Welcome to Nigeria Homes! You can set up AI preferences later in your profile.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWelcomeStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 w-16 h-16 flex items-center justify-center">
          <Home className="h-8 w-8 text-purple-600" />
        </div>
        <CardTitle className="text-2xl">Welcome to Nigeria Homes!</CardTitle>
        <CardDescription className="text-lg">
          Let's get you set up with your personalized property management experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold">Your Profile</h3>
            <p className="text-sm text-muted-foreground">Basic information and preferences</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
            <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold">AI Matching</h3>
            <p className="text-sm text-muted-foreground">Personalized property recommendations</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold">Smart Features</h3>
            <p className="text-sm text-muted-foreground">Intelligent property management</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="h-5 w-5 text-orange-600" />
            <h4 className="font-semibold text-orange-800">AI-Powered Experience</h4>
          </div>
          <p className="text-sm text-orange-700">
            Our AI learns your preferences to recommend properties that perfectly match your lifestyle, 
            budget, and location needs. The more you use the platform, the smarter it gets!
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => setCurrentStep('basic-info')} 
          className="w-full"
          size="lg"
        >
          Get Started
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderBasicInfoStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-blue-600" />
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
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('welcome')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={form.handleSubmit(handleBasicInfoSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderAIPreferencesStep = () => (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <CardTitle>AI Preferences Setup</CardTitle>
          </div>
          <CardDescription>
            Help our AI understand your preferences for personalized property recommendations
          </CardDescription>
          <div className="flex justify-center space-x-2 mt-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Sparkles className="h-3 w-3 mr-1" />
              Smart Matching
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Personalized
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Learning AI
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      <PreferencesSetup 
        onComplete={handlePreferencesComplete}
        showProgress={false}
      />
      
      <Card>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('basic-info')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkipPreferences}
            disabled={isSubmitting}
          >
            Skip for now (can set up later)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderCompleteStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 w-16 h-16 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Welcome to Nigeria Homes!</CardTitle>
        <CardDescription className="text-lg">
          Your account is set up and ready to go
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">What's Next?</h4>
          <ul className="text-sm text-green-700 space-y-1">
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
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= getCurrentStepIndex() 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {index < getCurrentStepIndex() ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-8 h-0.5 mx-2
                      ${index < getCurrentStepIndex() ? 'bg-purple-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {steps[getCurrentStepIndex()]?.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {steps[getCurrentStepIndex()]?.description}
            </p>
          </div>
          
          <div className="mt-4 max-w-md mx-auto">
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-xs text-center mt-1 text-muted-foreground">
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
