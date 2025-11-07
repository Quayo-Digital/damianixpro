// Custom hook for managing user preferences

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserPreferences } from '@/types/preferences';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        // Return default preferences if user not authenticated
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching user preferences:', error);
          return null; // Return null instead of throwing
        }

        return data;
      } catch (err) {
        console.warn('Failed to fetch user preferences:', err);
        return null; // Return null instead of throwing
      }
    },
    enabled: !!user?.id,
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create or update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const preferencesData = {
        ...newPreferences,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      // If preferences exist, update them; otherwise, create new ones
      if (preferences?.id) {
        const { data, error } = await supabase
          .from('user_preferences')
          .update(preferencesData)
          .eq('id', preferences.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('user_preferences')
          .insert({
            ...preferencesData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            // Default values
            min_budget: newPreferences.min_budget || 0,
            max_budget: newPreferences.max_budget || 10000000,
            budget_flexibility: newPreferences.budget_flexibility || 'flexible',
            preferred_areas: newPreferences.preferred_areas || [],
            property_types: newPreferences.property_types || ['apartment'],
            min_bedrooms: newPreferences.min_bedrooms || 1,
            min_bathrooms: newPreferences.min_bathrooms || 1,
            furnished_preference: newPreferences.furnished_preference || 'either',
            amenity_preferences: newPreferences.amenity_preferences || {
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
              pet_friendly: newPreferences.has_pets ? 8 : 2,
            },
            noise_tolerance: newPreferences.noise_tolerance || 'moderate',
            social_preference: newPreferences.social_preference || 'private',
            work_from_home: newPreferences.work_from_home || false,
            has_pets: newPreferences.has_pets || false,
            viewed_properties: [],
            saved_properties: [],
            applied_properties: [],
            rejected_properties: [],
            search_patterns: {
              most_active_hours: [9, 10, 11, 18, 19, 20],
              search_frequency: 3,
              decision_speed: 'moderate',
            },
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['userPreferences', user?.id], data);
      toast.success('Preferences updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    },
  });

  // Helper function to check if preferences are complete
  const isPreferencesComplete = (prefs: UserPreferences | null | undefined): boolean => {
    if (!prefs) return false;
    
    return !!(
      prefs.min_budget &&
      prefs.max_budget &&
      prefs.preferred_areas.length > 0 &&
      prefs.property_types.length > 0 &&
      prefs.min_bedrooms &&
      prefs.min_bathrooms
    );
  };

  // Helper function to get completion percentage
  const getCompletionPercentage = (prefs: UserPreferences | null | undefined): number => {
    if (!prefs) return 0;

    const requiredFields = [
      'min_budget',
      'max_budget',
      'preferred_areas',
      'property_types',
      'min_bedrooms',
      'min_bathrooms',
      'furnished_preference',
      'noise_tolerance',
      'social_preference'
    ];

    let completedFields = 0;
    
    requiredFields.forEach(field => {
      const value = prefs[field as keyof UserPreferences];
      if (Array.isArray(value) ? value.length > 0 : value) {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  };

  return {
    preferences,
    isLoading,
    error,
    refetch,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
    isPreferencesComplete: isPreferencesComplete(preferences),
    completionPercentage: getCompletionPercentage(preferences),
  };
};

// Hook for tracking property interactions
export const usePropertyInteractions = () => {
  const { user } = useAuth();

  const trackInteraction = async (
    propertyId: string,
    interactionType: 'view' | 'save' | 'apply' | 'reject' | 'contact' | 'share',
    additionalData?: Record<string, any>
  ) => {
    if (!user?.id) return;

    try {
      const interaction = {
        id: crypto.randomUUID(),
        user_id: user.id,
        property_id: propertyId,
        interaction_type: interactionType,
        interaction_data: additionalData,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('property_interactions')
        .insert(interaction);

      if (error) throw error;

      // Update user preferences based on interaction
      await updatePreferencesFromInteraction(propertyId, interactionType);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const updatePreferencesFromInteraction = async (
    propertyId: string,
    interactionType: string
  ) => {
    // This would implement learning from user behavior
    // For now, we'll just log the interaction
    console.log(`User ${user?.id} ${interactionType} property ${propertyId}`);
  };

  return {
    trackInteraction,
  };
};
