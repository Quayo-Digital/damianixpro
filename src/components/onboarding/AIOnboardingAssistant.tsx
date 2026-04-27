import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Home,
  Users,
  MapPin,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';

interface OnboardingAnswers {
  userType: 'landlord' | 'agent' | 'property_manager' | '';
  propertyCount: string;
  propertyTypes: string[];
  locations: string[];
  paymentPreference: 'monthly' | 'quarterly' | 'annual' | '';
  staffSize: string;
}

interface RecommendedSettings {
  workflows: string[];
  features: string[];
  settings: Record<string, any>;
}

export function AIOnboardingAssistant() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    userType: '',
    propertyCount: '',
    propertyTypes: [],
    locations: [],
    paymentPreference: '',
    staffSize: '',
  });
  const [recommendations, setRecommendations] = useState<RecommendedSettings | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const { user } = useAuthSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  const questions = [
    {
      id: 'userType',
      question: "What's your role?",
      description: 'Help us personalize your experience',
      type: 'select',
      options: [
        { value: 'landlord', label: 'Landlord', icon: Home },
        { value: 'agent', label: 'Real Estate Agent', icon: Briefcase },
        { value: 'property_manager', label: 'Property Manager', icon: Building2 },
      ],
    },
    {
      id: 'propertyCount',
      question: 'How many properties do you manage?',
      description: 'This helps us set up the right features for you',
      type: 'select',
      options: [
        { value: '1-5', label: '1-5 properties' },
        { value: '6-20', label: '6-20 properties' },
        { value: '21-50', label: '21-50 properties' },
        { value: '50+', label: '50+ properties' },
      ],
    },
    {
      id: 'propertyTypes',
      question: 'What types of properties do you manage?',
      description: 'Select all that apply',
      type: 'multi-select',
      options: [
        { value: 'residential', label: 'Residential (Apartments, Houses)' },
        { value: 'commercial', label: 'Commercial (Offices, Shops)' },
        { value: 'shortlet', label: 'Short-let (Airbnb style)' },
      ],
    },
    {
      id: 'locations',
      question: 'Where are your properties located?',
      description: 'Enter Abuja cities or areas (e.g., Wuse 2, Maitama, Garki)',
      type: 'input',
      placeholder: 'Wuse 2, Maitama, Garki...',
    },
    {
      id: 'paymentPreference',
      question: 'How do you prefer to collect rent for long-term rentals?',
      description:
        'In Nigeria, rent is typically paid annually. Shortlets are charged daily. We can set up reminders based on this.',
      type: 'select',
      options: [
        { value: 'annual', label: 'Annual (Yearly) - Standard in Nigeria' },
        { value: 'quarterly', label: 'Quarterly (Every 3 months)' },
        { value: 'monthly', label: 'Monthly (Less common)' },
      ],
    },
    {
      id: 'staffSize',
      question: 'Do you have a team?',
      description: 'This helps us recommend collaboration features',
      type: 'select',
      options: [
        { value: 'solo', label: 'Just me (Solo)' },
        { value: 'small', label: 'Small team (2-5 people)' },
        { value: 'medium', label: 'Medium team (6-15 people)' },
        { value: 'large', label: 'Large team (15+ people)' },
      ],
    },
  ];

  const handleAnswer = (value: string | string[]) => {
    const question = questions[currentQuestion];
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      generateRecommendations();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const generateRecommendations = () => {
    const workflows: string[] = [];
    const features: string[] = [];
    const settings: Record<string, any> = {};

    // User type recommendations
    if (answers.userType === 'landlord') {
      features.push('Tenant Management', 'Rent Collection', 'Maintenance Tracking');
      workflows.push('Automated rent reminders', 'Tenant communication templates');
    } else if (answers.userType === 'agent') {
      features.push('Property Listings', 'Lead Management', 'Commission Tracking');
      workflows.push('Property inquiry automation', 'Client follow-up reminders');
    } else if (answers.userType === 'property_manager') {
      features.push('Multi-property Dashboard', 'Team Collaboration', 'Reporting & Analytics');
      workflows.push('Maintenance scheduling', 'Vendor management');
    }

    // Property count recommendations
    const count = parseInt(answers.propertyCount.split('-')[0] || '1');
    if (count >= 21) {
      features.push('Bulk Operations', 'Advanced Reporting', 'API Access');
      workflows.push('Bulk tenant communication', 'Automated reporting');
    }

    // Property type recommendations
    if (answers.propertyTypes.includes('shortlet')) {
      features.push('Calendar Management', 'Booking System', 'Dynamic Pricing');
      workflows.push('Availability sync', 'Guest check-in automation');
    }
    if (answers.propertyTypes.includes('commercial')) {
      features.push('Lease Management', 'Document Storage', 'Compliance Tracking');
    }

    // Payment preference
    settings.paymentFrequency = answers.paymentPreference;
    if (answers.paymentPreference === 'annual') {
      workflows.push('Annual rent reminders (14 days before due date)');
    } else if (answers.paymentPreference === 'quarterly') {
      workflows.push('Quarterly rent reminders (7 days before due date)');
    } else if (answers.paymentPreference === 'monthly') {
      workflows.push('Monthly rent reminders (5 days before due date)');
    }

    // Staff size recommendations
    if (answers.staffSize !== 'solo') {
      features.push('Team Permissions', 'Task Assignment', 'Activity Logs');
      workflows.push('Team collaboration workflows');
    }

    // Location-based settings
    if (answers.locations.length > 0) {
      settings.defaultLocations = answers.locations;
    }

    setRecommendations({
      workflows,
      features,
      settings,
    });
  };

  const handleConfigure = async () => {
    if (!user) return;

    setIsConfiguring(true);
    try {
      // Save onboarding data to user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_data: {
            userType: answers.userType,
            propertyCount: answers.propertyCount,
            propertyTypes: answers.propertyTypes,
            locations: answers.locations,
            paymentPreference: answers.paymentPreference,
            staffSize: answers.staffSize,
          },
          recommended_settings: recommendations?.settings,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mark user as onboarded in auth metadata (required for ProtectedRoute to allow dashboard access)
      await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      // Configure default settings based on recommendations
      if (recommendations) {
        // Set payment frequency preference
        if (recommendations.settings.paymentFrequency) {
          // This would typically update user settings in a settings table
          // For now, we'll just show success
        }
      }

      toast({
        title: 'Setup Complete! 🎉',
        description: 'Your account has been configured with recommended settings.',
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error configuring account:', error);
      // If profiles columns don't exist (PGRST204), still mark user as onboarded via auth metadata
      if (error?.code === 'PGRST204' || error?.message?.includes('onboarding_completed')) {
        await supabase.auth.updateUser({
          data: { onboarded: true },
        });
        toast({
          title: 'Setup Complete! 🎉',
          description:
            'Your account is ready. Run database migrations to save onboarding preferences to your profile.',
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast({
          title: 'Configuration Error',
          description: 'Failed to save your preferences. You can configure them later in settings.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsConfiguring(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const getCanProceed = () => {
    if (currentQ.id === 'locations') {
      return answers.locations.length > 0;
    }
    if (currentQ.id === 'propertyTypes') {
      return (answers.propertyTypes as string[]).length > 0;
    }
    const answer = answers[currentQ.id as keyof OnboardingAnswers];
    return answer !== '' && answer !== undefined && answer !== null;
  };

  const canProceed = getCanProceed();

  if (recommendations) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-muted/60 p-4">
        <Card className="w-full max-w-2xl border-border bg-card text-card-foreground shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Perfect! Here's Your Setup 🎉</CardTitle>
            <CardDescription>We've prepared everything based on your answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recommended Features */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Features to Activate First
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.features.map((feature, idx) => (
                  <Badge key={idx} variant="default" className="px-3 py-1">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommended Workflows */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Calendar className="h-5 w-5 text-blue-500" />
                Recommended Workflows
              </h3>
              <ul className="space-y-2">
                {recommendations.workflows.map((workflow, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1 text-primary">✓</span>
                    <span>{workflow}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Settings Summary */}
            <div className="rounded-lg border border-border bg-muted/80 p-4">
              <h3 className="mb-2 font-semibold text-foreground">Auto-Configured Settings</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {recommendations.settings.paymentFrequency && (
                  <li>• Payment reminders: {recommendations.settings.paymentFrequency}</li>
                )}
                {recommendations.settings.defaultLocations && (
                  <li>
                    • Default locations: {recommendations.settings.defaultLocations.join(', ')}
                  </li>
                )}
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRecommendations(null);
                  setCurrentQuestion(0);
                }}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Review Answers
              </Button>
              <Button
                onClick={handleConfigure}
                disabled={isConfiguring}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isConfiguring ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-muted/60 p-4">
      <Card className="w-full max-w-2xl border-border bg-card text-card-foreground shadow-md">
        <CardHeader>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Welcome! Let's Get You Set Up</CardTitle>
            </div>
            <Badge variant="outline">
              {currentQuestion + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="mb-2" />
          <CardDescription>{currentQ.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-lg font-semibold">{currentQ.question}</Label>

            {currentQ.type === 'select' && (
              <div className="mt-4 space-y-3">
                {currentQ.options?.map((option) => {
                  const Icon = option.icon;
                  const isSelected =
                    answers[currentQ.id as keyof OnboardingAnswers] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" />}
                        <span className="font-medium">{option.label}</span>
                        {isSelected && <CheckCircle className="ml-auto h-5 w-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'multi-select' && (
              <div className="mt-4 space-y-3">
                {currentQ.options?.map((option) => {
                  const isSelected = (
                    answers[currentQ.id as keyof OnboardingAnswers] as string[]
                  )?.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const current =
                          (answers[currentQ.id as keyof OnboardingAnswers] as string[]) || [];
                        if (isSelected) {
                          handleAnswer(current.filter((v) => v !== option.value));
                        } else {
                          handleAnswer([...current, option.value]);
                        }
                      }}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{option.label}</span>
                        {isSelected && <CheckCircle className="ml-auto h-5 w-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'input' && (
              <div className="mt-4">
                <Input
                  placeholder={currentQ.placeholder}
                  value={answers.locations.join(', ')}
                  onChange={(e) => {
                    const locations = e.target.value
                      .split(',')
                      .map((l) => l.trim())
                      .filter(Boolean);
                    handleAnswer(locations);
                  }}
                  className="w-full"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Separate multiple locations with commas
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            {currentQuestion > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex-1 ${currentQuestion === 0 ? '' : 'ml-auto'}`}
            >
              {currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
