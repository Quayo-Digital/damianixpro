// User Preferences Setup Component for AI Matching

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Home, MapPin, DollarSign, Settings, Star, CheckCircle } from 'lucide-react';
import { UserPreferences } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuthSession } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const defaultAmenities = {
  parking: 5,
  gym: 3,
  pool: 3,
  security: 8,
  generator: 7,
  internet: 6,
  air_conditioning: 6,
  balcony: 4,
  garden: 3,
  elevator: 4,
  laundry: 5,
  pet_friendly: 2,
};

const preferencesSchema = z
  .object({
    min_budget: z.preprocess(
      (val) =>
        val === undefined || val === '' || Number.isNaN(Number(val)) ? 500000 : Number(val),
      z.number().min(0)
    ),
    max_budget: z.preprocess(
      (val) =>
        val === undefined || val === '' || Number.isNaN(Number(val)) ? 5000000 : Number(val),
      z.number().min(0)
    ),
    budget_flexibility: z.enum(['strict', 'flexible', 'very_flexible']).default('flexible'),
    preferred_areas: z.preprocess(
      (val) => (Array.isArray(val) ? val.filter(Boolean) : []),
      z.array(z.string()).default([])
    ),
    property_types: z.preprocess(
      (val) => (Array.isArray(val) && val.length === 0 ? ['apartment'] : val),
      z.array(z.enum(['apartment', 'house', 'studio', 'duplex', 'penthouse'])).min(1)
    ),
    min_bedrooms: z.preprocess((val) => {
      const n = Number(val);
      return val === undefined || val === '' || Number.isNaN(n) || n < 1 ? 1 : n;
    }, z.number().min(1)),
    max_bedrooms: z.preprocess((val) => {
      if (val === undefined || val === '') return undefined;
      const n = Number(val);
      return Number.isNaN(n) || n < 1 ? undefined : n;
    }, z.number().min(1).optional()),
    min_bathrooms: z.preprocess((val) => {
      const n = Number(val);
      return val === undefined || val === '' || Number.isNaN(n) || n < 1 ? 1 : n;
    }, z.number().min(1)),
    furnished_preference: z.enum(['furnished', 'unfurnished', 'either']).default('either'),
    amenity_preferences: z.preprocess(
      (val) => {
        if (!val || typeof val !== 'object') return defaultAmenities;
        const merged = { ...defaultAmenities };
        for (const k of Object.keys(defaultAmenities)) {
          const v = (val as Record<string, unknown>)[k];
          if (typeof v === 'number' && v >= 0 && v <= 10) merged[k as keyof typeof merged] = v;
        }
        return merged;
      },
      z.object({
        parking: z.number().min(0).max(10).default(5),
        gym: z.number().min(0).max(10).default(3),
        pool: z.number().min(0).max(10).default(3),
        security: z.number().min(0).max(10).default(8),
        generator: z.number().min(0).max(10).default(7),
        internet: z.number().min(0).max(10).default(6),
        air_conditioning: z.number().min(0).max(10).default(6),
        balcony: z.number().min(0).max(10).default(4),
        garden: z.number().min(0).max(10).default(3),
        elevator: z.number().min(0).max(10).default(4),
        laundry: z.number().min(0).max(10).default(5),
        pet_friendly: z.number().min(0).max(10).default(2),
      })
    ),
    noise_tolerance: z.enum(['quiet', 'moderate', 'lively']).default('moderate'),
    social_preference: z.enum(['private', 'community_oriented']).default('private'),
    work_from_home: z.boolean().default(false),
    has_pets: z.boolean().default(false),
    pet_types: z.array(z.string()).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.max_budget < data.min_budget) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max_budget'],
        message: 'Maximum budget must be greater than or equal to minimum budget',
      });
    }
    if (data.max_bedrooms != null && data.max_bedrooms < data.min_bedrooms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max_bedrooms'],
        message: 'Max bedrooms must be greater than or equal to min bedrooms',
      });
    }
  });

type PreferencesFormData = z.infer<typeof preferencesSchema>;

// Abuja-focused cities and areas
const NIGERIAN_CITIES = [
  // Federal Capital Territory (Abuja)
  {
    city: 'Abuja',
    label: 'Abuja FCT',
    areas: [
      'Maitama',
      'Asokoro',
      'Wuse',
      'Garki',
      'Gwarinpa',
      'Kubwa',
      'Nyanya',
      'Karu',
      'Lugbe',
      'Jabi',
      'Utako',
      'Lokogoma',
      'Katampe',
      'Lifecamp',
      'Gwagwalada',
      'Suleja',
      'Kuje',
      'Guzape',
      'Jikwoyi',
      'Apo',
      'Asokoro Extension',
      'Pyakasa',
      'Karsana',
      'Guzape 2',
      'Idu',
      'Katampe Extension',
      'Asokoro Hilltop',
      'Kurudu',
      'Maitama 2',
      'Apo Tyafi',
    ],
  },
];

// Flatten all areas for easy access
const ALL_NIGERIAN_AREAS = NIGERIAN_CITIES.reduce((acc, cityData) => {
  const cityAreas = cityData.areas.map((area) => `${area}, ${cityData.city}`);
  return [...acc, ...cityAreas];
}, [] as string[]);

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'penthouse', label: 'Penthouse' },
];

const AMENITIES = [
  { key: 'parking', label: 'Parking', icon: '🚗' },
  { key: 'gym', label: 'Gym', icon: '💪' },
  { key: 'pool', label: 'Swimming Pool', icon: '🏊' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'generator', label: 'Generator', icon: '⚡' },
  { key: 'internet', label: 'Internet', icon: '📶' },
  { key: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
  { key: 'balcony', label: 'Balcony', icon: '🏠' },
  { key: 'garden', label: 'Garden', icon: '🌿' },
  { key: 'elevator', label: 'Elevator', icon: '🛗' },
  { key: 'laundry', label: 'Laundry', icon: '🧺' },
  { key: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
];

interface PreferencesSetupProps {
  onComplete?: () => void;
  showProgress?: boolean;
  /** When true (e.g. in onboarding), falls back to profiles if user_preferences fails */
  onboardingMode?: boolean;
}

export const PreferencesSetup: React.FC<PreferencesSetupProps> = ({
  onComplete,
  showProgress = true,
  onboardingMode = false,
}) => {
  const { user } = useAuthSession();
  const { preferences, updatePreferences, isUpdating, completionPercentage } = useUserPreferences();
  const [currentStep, setCurrentStep] = useState(0);

  // Type cast preferences to UserPreferences to fix type inference issues
  const userPrefs = preferences as UserPreferences | null;

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      min_budget: userPrefs?.min_budget || 500000,
      max_budget: userPrefs?.max_budget || 5000000,
      budget_flexibility: userPrefs?.budget_flexibility || 'flexible',
      preferred_areas: userPrefs?.preferred_areas || [],
      property_types: userPrefs?.property_types || ['apartment'],
      min_bedrooms: userPrefs?.min_bedrooms || 1,
      max_bedrooms: userPrefs?.max_bedrooms || undefined,
      min_bathrooms: userPrefs?.min_bathrooms || 1,
      furnished_preference: userPrefs?.furnished_preference || 'either',
      amenity_preferences: userPrefs?.amenity_preferences || {
        parking: 5,
        gym: 3,
        pool: 3,
        security: 8,
        generator: 7,
        internet: 6,
        air_conditioning: 6,
        balcony: 4,
        garden: 3,
        elevator: 4,
        laundry: 5,
        pet_friendly: 2,
      },
      noise_tolerance: userPrefs?.noise_tolerance || 'moderate',
      social_preference: userPrefs?.social_preference || 'private',
      work_from_home: userPrefs?.work_from_home || false,
      has_pets: userPrefs?.has_pets || false,
      pet_types: userPrefs?.pet_types || [],
    },
  });

  useEffect(() => {
    if (!userPrefs) return;
    form.reset({
      min_budget: userPrefs.min_budget || 500000,
      max_budget: userPrefs.max_budget || 5000000,
      budget_flexibility: userPrefs.budget_flexibility || 'flexible',
      preferred_areas: userPrefs.preferred_areas || [],
      property_types: userPrefs.property_types || ['apartment'],
      min_bedrooms: userPrefs.min_bedrooms || 1,
      max_bedrooms: userPrefs.max_bedrooms || undefined,
      min_bathrooms: userPrefs.min_bathrooms || 1,
      furnished_preference: userPrefs.furnished_preference || 'either',
      amenity_preferences: userPrefs.amenity_preferences || defaultAmenities,
      noise_tolerance: userPrefs.noise_tolerance || 'moderate',
      social_preference: userPrefs.social_preference || 'private',
      work_from_home: userPrefs.work_from_home || false,
      has_pets: userPrefs.has_pets || false,
      pet_types: userPrefs.pet_types || [],
    });
  }, [userPrefs, form]);

  const saveToProfilesFallback = async (data: PreferencesFormData) => {
    if (!user?.id) throw new Error('Please sign in to save preferences');
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_data: {
          preferences: data,
          saved_at: new Date().toISOString(),
        },
      })
      .eq('id', user.id);
    if (profileError) throw profileError;
    await supabase.auth.updateUser({ data: { onboarded: true } });
  };

  const onSubmit = async (data: PreferencesFormData) => {
    if (!user?.id) {
      toast.error('Please sign in to save your preferences');
      return;
    }
    try {
      await updatePreferences(data);
      onComplete?.();
    } catch (error) {
      console.error('Error saving preferences:', error);
      if (onboardingMode && onComplete) {
        try {
          await saveToProfilesFallback(data);
          toast.success('Preferences saved! Completing setup...');
          onComplete();
        } catch (fallbackError) {
          console.error('Fallback save failed:', fallbackError);
          toast.error('Could not save preferences. Try again or use "Skip for now" to continue.');
        }
      } else {
        toast.error('Could not save preferences. Please try again.');
      }
    }
  };

  const onInvalid = () => {
    const errors = form.formState.errors;
    const firstError = Object.values(errors)[0];
    const message =
      firstError?.message && typeof firstError.message === 'string'
        ? firstError.message
        : 'Please complete all required fields (e.g. budget, preferred areas, property type)';
    toast.error(message);
  };

  const handleNextStep = async () => {
    const currentFields = steps[currentStep].fields as Array<keyof PreferencesFormData>;
    const isValid = await form.trigger(currentFields);
    if (!isValid) {
      toast.error('Please complete the required fields before continuing');
      return;
    }
    setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
  };

  const steps = [
    {
      title: 'Budget & Location',
      description: 'Set your budget and preferred areas',
      fields: ['min_budget', 'max_budget', 'budget_flexibility', 'preferred_areas'],
    },
    {
      title: 'Property Details',
      description: 'Choose property type and size',
      fields: [
        'property_types',
        'min_bedrooms',
        'max_bedrooms',
        'min_bathrooms',
        'furnished_preference',
      ],
    },
    {
      title: 'Amenities',
      description: 'Rate amenity importance (0-10)',
      fields: ['amenity_preferences'],
    },
    {
      title: 'Lifestyle',
      description: 'Personal preferences and lifestyle',
      fields: ['noise_tolerance', 'social_preference', 'work_from_home', 'has_pets', 'pet_types'],
    },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Budget (₦/year)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value !== '' ? Number(e.target.value) : 500000)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Budget (₦/year)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value !== '' ? Number(e.target.value) : 5000000)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="budget_flexibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Flexibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value || 'flexible'}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="strict" id="strict" />
                        <label htmlFor="strict">Strict</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flexible" id="flexible" />
                        <label htmlFor="flexible">Flexible</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="very_flexible" id="very_flexible" />
                        <label htmlFor="very_flexible">Very Flexible</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_areas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Areas</FormLabel>
                  <FormDescription>Select areas and cities you'd like to live in</FormDescription>
                  <div className="space-y-4">
                    {NIGERIAN_CITIES.map((cityData) => (
                      <div key={cityData.city} className="space-y-2">
                        <h4 className="text-sm font-medium text-primary">{cityData.label}</h4>
                        <div className="grid grid-cols-2 gap-2 pl-4 md:grid-cols-3">
                          {cityData.areas.map((area) => {
                            const fullAreaName = `${area}, ${cityData.city}`;
                            return (
                              <div key={fullAreaName} className="flex items-center space-x-2">
                                <Checkbox
                                  id={fullAreaName}
                                  checked={(field.value || []).includes(fullAreaName)}
                                  onCheckedChange={(checked) => {
                                    const arr = field.value || [];
                                    if (checked) {
                                      field.onChange([...arr, fullAreaName]);
                                    } else {
                                      field.onChange(arr.filter((a) => a !== fullAreaName));
                                    }
                                  }}
                                />
                                <label htmlFor={fullAreaName} className="cursor-pointer text-sm">
                                  {area}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="property_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Types</FormLabel>
                  <FormDescription>Select property types you're interested in</FormDescription>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPERTY_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.value}
                          checked={(field.value || []).includes(type.value)}
                          onCheckedChange={(checked) => {
                            const arr = field.value || [];
                            if (checked) {
                              field.onChange([...arr, type.value]);
                            } else {
                              field.onChange(arr.filter((t) => t !== type.value));
                            }
                          }}
                        />
                        <label htmlFor={type.value} className="text-sm">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="min_bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Bedrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v !== '' ? Math.max(1, Number(v)) : 1);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Bedrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value !== '' ? Number(e.target.value) : undefined)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Bathrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v !== '' ? Math.max(1, Number(v)) : 1);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="furnished_preference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Furnished Preference</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : 'either'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="furnished">Furnished</SelectItem>
                      <SelectItem value="unfurnished">Unfurnished</SelectItem>
                      <SelectItem value="either">Either</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="mb-4 text-sm text-muted-foreground">
              Rate each amenity's importance to you (0 = Not important, 10 = Very important)
            </div>
            {AMENITIES.map((amenity) => (
              <FormField
                key={amenity.key}
                control={form.control}
                name={`amenity_preferences.${amenity.key}` as any}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center space-x-2">
                        <span>{amenity.icon}</span>
                        <span>{amenity.label}</span>
                      </FormLabel>
                      <Badge variant="outline">{field.value}</Badge>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[field.value ?? 5]}
                        onValueChange={(value) => field.onChange(value[0] ?? 5)}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="noise_tolerance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Noise Tolerance</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : 'moderate'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tolerance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="quiet">Quiet environment</SelectItem>
                      <SelectItem value="moderate">Moderate noise is okay</SelectItem>
                      <SelectItem value="lively">Lively environment is fine</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_preference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social Preference</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : 'private'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private/Independent</SelectItem>
                      <SelectItem value="community_oriented">Community-oriented</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="work_from_home"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Work from Home</FormLabel>
                    <FormDescription>Do you work from home regularly?</FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(c) => field.onChange(c === true)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_pets"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Have Pets</FormLabel>
                    <FormDescription>Do you have pets that will live with you?</FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(c) => field.onChange(c === true)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <div>
            <CardTitle>AI Preferences Setup</CardTitle>
            <CardDescription>
              Help us understand your preferences for better property recommendations
            </CardDescription>
          </div>
        </div>
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{completionPercentage}% complete</span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form
                .handleSubmit(
                  onSubmit,
                  onInvalid
                )(e)
                .catch((err) => {
                  console.error('Form submission error:', err);
                  toast.error('Something went wrong. Please try again.');
                });
            }}
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>

            {renderStep()}

            <Separator />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              <div className="flex space-x-2">
                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={handleNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Settings className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PreferencesSetup;
