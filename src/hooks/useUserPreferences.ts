// Custom hook for managing user preferences

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserPreferences } from '@/types/preferences';
import { useAuthSession } from '@/contexts/auth';
import { toast } from 'sonner';

const DEFAULT_AMENITIES = {
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

const DEFAULT_SEARCH_PATTERNS = {
  most_active_hours: [9, 10, 11, 18, 19, 20],
  search_frequency: 3,
  decision_speed: 'moderate' as const,
};

const getPreferencesStorageKey = (userId: string) => `ai_preferences:${userId}`;

const getLocalPreferences = (userId: string): UserPreferences | null => {
  try {
    const raw = localStorage.getItem(getPreferencesStorageKey(userId));
    return raw ? (JSON.parse(raw) as UserPreferences) : null;
  } catch {
    return null;
  }
};

const setLocalPreferences = (userId: string, data: UserPreferences) => {
  try {
    localStorage.setItem(getPreferencesStorageKey(userId), JSON.stringify(data));
  } catch {
    // Ignore storage write errors (e.g. private mode quota)
  }
};

const normalizePreferences = (
  input: Partial<UserPreferences> | null | undefined,
  userId: string
): UserPreferences => {
  const minBudget = Number(input?.min_budget ?? 500000);
  const maxBudgetCandidate = Number(input?.max_budget ?? 5000000);
  const maxBudget = Math.max(maxBudgetCandidate, minBudget);
  const minBedrooms = Math.max(1, Number(input?.min_bedrooms ?? 1));
  const maxBedroomsCandidate = input?.max_bedrooms == null ? undefined : Number(input.max_bedrooms);
  const maxBedrooms =
    maxBedroomsCandidate == null || Number.isNaN(maxBedroomsCandidate)
      ? undefined
      : Math.max(maxBedroomsCandidate, minBedrooms);

  const preferredAreas = Array.isArray(input?.preferred_areas)
    ? input!.preferred_areas.filter(Boolean)
    : [];
  const propertyTypes = Array.isArray(input?.property_types)
    ? input!.property_types.filter(Boolean)
    : [];

  const now = new Date().toISOString();

  return {
    id: String(input?.id ?? crypto.randomUUID()),
    user_id: String(input?.user_id ?? userId),
    min_budget: minBudget,
    max_budget: maxBudget,
    budget_flexibility:
      (input?.budget_flexibility as UserPreferences['budget_flexibility']) ?? 'flexible',
    // Do not force a default city; if the user hasn't chosen areas yet,
    // leave this empty so location filtering can treat it as "no preference".
    preferred_areas: preferredAreas,
    property_types:
      (propertyTypes as UserPreferences['property_types'])?.length > 0
        ? (propertyTypes as UserPreferences['property_types'])
        : ['apartment'],
    min_bedrooms: minBedrooms,
    max_bedrooms: maxBedrooms,
    min_bathrooms: Math.max(1, Number(input?.min_bathrooms ?? 1)),
    furnished_preference:
      (input?.furnished_preference as UserPreferences['furnished_preference']) ?? 'either',
    amenity_preferences: {
      ...DEFAULT_AMENITIES,
      ...(input?.amenity_preferences ?? {}),
      pet_friendly:
        input?.has_pets === true
          ? 8
          : Number(
              (input?.amenity_preferences as any)?.pet_friendly ?? DEFAULT_AMENITIES.pet_friendly
            ),
    },
    noise_tolerance: (input?.noise_tolerance as UserPreferences['noise_tolerance']) ?? 'moderate',
    social_preference:
      (input?.social_preference as UserPreferences['social_preference']) ?? 'private',
    work_from_home: Boolean(input?.work_from_home ?? false),
    has_pets: Boolean(input?.has_pets ?? false),
    pet_types: Array.isArray(input?.pet_types) ? input!.pet_types.filter(Boolean) : [],
    viewed_properties: Array.isArray(input?.viewed_properties) ? input!.viewed_properties : [],
    saved_properties: Array.isArray(input?.saved_properties) ? input!.saved_properties : [],
    applied_properties: Array.isArray(input?.applied_properties) ? input!.applied_properties : [],
    rejected_properties: Array.isArray(input?.rejected_properties)
      ? input!.rejected_properties
      : [],
    search_patterns:
      (input?.search_patterns as UserPreferences['search_patterns']) ?? DEFAULT_SEARCH_PATTERNS,
    calculated_preferences: input?.calculated_preferences,
    created_at: String(input?.created_at ?? now),
    updated_at: now,
  };
};

export const useUserPreferences = () => {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error,
    refetch,
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

        // Handle 404 (table doesn't exist) or other errors gracefully
        if (error) {
          // If table doesn't exist (404), return null silently
          // Check for various 404 indicators
          const is404Error =
            error.code === 'PGRST116' ||
            error.message?.includes('does not exist') ||
            error.message?.includes('relation') ||
            error.message?.includes('not found') ||
            (error as any)?.status === 404 ||
            (error as any)?.statusCode === 404;

          if (is404Error) {
            // Fall back to local preferences if DB table isn't available yet
            return getLocalPreferences(user.id);
          }
          // Only log non-404 errors
          console.warn('Error fetching user preferences:', error);
          return getLocalPreferences(user.id);
        }

        if (!data) {
          // If no row yet, attempt to hydrate from profiles.onboarding_data.preferences if present
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_data')
            .eq('id', user.id)
            .maybeSingle();

          const onboardingPrefs = (profile as any)?.onboarding_data?.preferences;

          if (!profileError && onboardingPrefs && typeof onboardingPrefs === 'object') {
            try {
              const normalizedFromProfile = normalizePreferences(
                onboardingPrefs as Partial<UserPreferences>,
                user.id
              );

              // Save hydrated preferences back into user_preferences
              const payload = {
                user_id: user.id,
                min_budget: normalizedFromProfile.min_budget,
                max_budget: normalizedFromProfile.max_budget,
                budget_flexibility: normalizedFromProfile.budget_flexibility,
                preferred_areas: normalizedFromProfile.preferred_areas,
                property_types: normalizedFromProfile.property_types,
                min_bedrooms: normalizedFromProfile.min_bedrooms,
                max_bedrooms: normalizedFromProfile.max_bedrooms ?? null,
                min_bathrooms: normalizedFromProfile.min_bathrooms,
                furnished_preference: normalizedFromProfile.furnished_preference,
                amenity_preferences: normalizedFromProfile.amenity_preferences,
                noise_tolerance: normalizedFromProfile.noise_tolerance,
                social_preference: normalizedFromProfile.social_preference,
                work_from_home: normalizedFromProfile.work_from_home,
                has_pets: normalizedFromProfile.has_pets,
                pet_types: normalizedFromProfile.pet_types,
                viewed_properties: normalizedFromProfile.viewed_properties,
                saved_properties: normalizedFromProfile.saved_properties,
                applied_properties: normalizedFromProfile.applied_properties,
                rejected_properties: normalizedFromProfile.rejected_properties,
                search_patterns: normalizedFromProfile.search_patterns,
                updated_at: new Date().toISOString(),
              };

              const { error: upsertError } = await supabase
                .from('user_preferences')
                .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false });

              if (!upsertError) {
                setLocalPreferences(user.id, normalizedFromProfile);
                return normalizedFromProfile;
              }
            } catch (hydrateError) {
              console.warn('Failed to hydrate preferences from onboarding_data:', hydrateError);
            }
          }

          return getLocalPreferences(user.id);
        }

        // If we have a row, we may still need to repair legacy/placeholder preferred_areas
        const baseInput = data as Partial<UserPreferences>;

        // Raw areas from DB row
        const dbAreasRaw = Array.isArray((baseInput as any).preferred_areas)
          ? ((baseInput as any).preferred_areas as string[]).filter(Boolean)
          : [];

        let finalInput: Partial<UserPreferences> = baseInput;

        try {
          // Attempt a light repair using profiles.onboarding_data.preferences when either:
          // - there are no areas in DB, or
          // - DB areas look like legacy default ['Lagos'] but onboarding has a different city.
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_data')
            .eq('id', user.id)
            .maybeSingle();

          const onboardingPrefs = (profile as any)?.onboarding_data?.preferences;
          const onboardingAreas = Array.isArray(onboardingPrefs?.preferred_areas)
            ? onboardingPrefs.preferred_areas.filter(Boolean)
            : [];

          if (!profileError && onboardingPrefs && onboardingAreas.length > 0) {
            const dbAreasNormalized = dbAreasRaw.map((a) => String(a).toLowerCase().trim());
            const onboardingAreasNormalized = onboardingAreas.map((a) =>
              String(a).toLowerCase().trim()
            );

            const dbLooksLikeLegacyLagos =
              dbAreasNormalized.length === 1 && dbAreasNormalized[0] === 'lagos';

            const onboardingHasNonLagos =
              onboardingAreasNormalized.length > 0 &&
              onboardingAreasNormalized.some((a) => a !== 'lagos');

            const shouldReplaceAreas =
              dbAreasNormalized.length === 0 || (dbLooksLikeLegacyLagos && onboardingHasNonLagos);

            if (shouldReplaceAreas) {
              // Merge DB row with onboarding preferences, letting DB values win
              // except for preferred_areas which we take from onboarding.
              finalInput = {
                ...(onboardingPrefs as Partial<UserPreferences>),
                ...baseInput,
                preferred_areas: onboardingAreas,
              };

              const repaired = normalizePreferences(finalInput, user.id);

              const payload = {
                user_id: user.id,
                min_budget: repaired.min_budget,
                max_budget: repaired.max_budget,
                budget_flexibility: repaired.budget_flexibility,
                preferred_areas: repaired.preferred_areas,
                property_types: repaired.property_types,
                min_bedrooms: repaired.min_bedrooms,
                max_bedrooms: repaired.max_bedrooms ?? null,
                min_bathrooms: repaired.min_bathrooms,
                furnished_preference: repaired.furnished_preference,
                amenity_preferences: repaired.amenity_preferences,
                noise_tolerance: repaired.noise_tolerance,
                social_preference: repaired.social_preference,
                work_from_home: repaired.work_from_home,
                has_pets: repaired.has_pets,
                pet_types: repaired.pet_types,
                viewed_properties: repaired.viewed_properties,
                saved_properties: repaired.saved_properties,
                applied_properties: repaired.applied_properties,
                rejected_properties: repaired.rejected_properties,
                search_patterns: repaired.search_patterns,
                updated_at: new Date().toISOString(),
              };

              const { error: upsertError } = await supabase
                .from('user_preferences')
                .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false });

              if (!upsertError) {
                setLocalPreferences(user.id, repaired);
                return repaired;
              }
            }
          }
        } catch (repairError) {
          console.warn('Failed to repair preferences from onboarding_data:', repairError);
        }

        const normalized = normalizePreferences(finalInput, user.id);
        setLocalPreferences(user.id, normalized);
        return normalized;
      } catch (err: any) {
        // Handle 404 errors gracefully (table might not exist)
        const is404Error =
          err?.code === 'PGRST116' ||
          err?.message?.includes('does not exist') ||
          err?.message?.includes('relation') ||
          err?.message?.includes('not found') ||
          err?.status === 404 ||
          err?.statusCode === 404;

        if (is404Error) {
          return getLocalPreferences(user.id);
        }
        // Only log non-404 errors
        console.warn('Failed to fetch user preferences:', err);
        return getLocalPreferences(user.id);
      }
    },
    enabled: !!user?.id,
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Suppress error logging for 404s (table doesn't exist)
    onError: (error: any) => {
      // Only log non-404 errors
      const is404Error =
        error?.code === 'PGRST116' ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('relation') ||
        error?.message?.includes('not found') ||
        error?.status === 404 ||
        error?.statusCode === 404;

      if (!is404Error) {
        console.warn('Error fetching user preferences:', error);
      }
    },
  });

  // Create or update preferences mutation
  // Payload matches user_preferences table schema exactly (supabase/migrations/20250801_ai_smart_matching.sql)
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const merged = normalizePreferences(
        { ...(preferences || {}), ...(newPreferences || {}) } as Partial<UserPreferences>,
        user.id
      );

      // Build payload with only columns that exist in user_preferences table
      const payload = {
        user_id: user.id,
        min_budget: merged.min_budget,
        max_budget: merged.max_budget,
        budget_flexibility: merged.budget_flexibility,
        preferred_areas: merged.preferred_areas,
        property_types: merged.property_types,
        min_bedrooms: merged.min_bedrooms,
        max_bedrooms: merged.max_bedrooms ?? null,
        min_bathrooms: merged.min_bathrooms,
        furnished_preference: merged.furnished_preference,
        amenity_preferences: merged.amenity_preferences,
        noise_tolerance: merged.noise_tolerance,
        social_preference: merged.social_preference,
        work_from_home: merged.work_from_home,
        has_pets: merged.has_pets,
        pet_types: merged.pet_types,
        viewed_properties: merged.viewed_properties,
        saved_properties: merged.saved_properties,
        applied_properties: merged.applied_properties,
        rejected_properties: merged.rejected_properties,
        search_patterns: merged.search_patterns,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false })
        .select()
        .single();

      if (error) {
        console.error('[user_preferences] Save failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        const isTableMissing =
          error.code === 'PGRST116' ||
          error.code === '42P01' ||
          String(error.message || '')
            .toLowerCase()
            .includes('does not exist') ||
          String(error.message || '')
            .toLowerCase()
            .includes('relation');

        if (isTableMissing) {
          throw new Error(
            'AI Preferences table not set up. Run: supabase db push (or apply migration 20250801_ai_smart_matching.sql)'
          );
        }
        if (error.code === '42501') {
          throw new Error('Permission denied. Ensure you are logged in.');
        }
        const lowerMessage = String(error.message || '').toLowerCase();
        const canUseLocalFallback =
          isTableMissing ||
          lowerMessage.includes('migration') ||
          lowerMessage.includes('schema cache');

        if (canUseLocalFallback) {
          const localResult = normalizePreferences(
            {
              ...merged,
              id: merged.id ?? crypto.randomUUID(),
              user_id: user.id,
            },
            user.id
          );
          setLocalPreferences(user.id, localResult);
          return localResult;
        }

        throw new Error(error.message || 'Failed to save preferences');
      }

      const normalized = normalizePreferences(data as Partial<UserPreferences>, user.id);
      setLocalPreferences(user.id, normalized);
      return normalized;
    },
    onSuccess: (data) => {
      // Update the query cache
      queryClient.setQueryData(['userPreferences', user?.id], data);
      // Invalidate to ensure fresh data is fetched
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id] });
      // Also invalidate public properties to trigger re-filtering
      queryClient.invalidateQueries({ queryKey: ['publicProperties'] });
      toast.success('Preferences saved. Property matches updated!');
    },
    onError: (error: any) => {
      console.error('Error updating preferences:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to update preferences';

      if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
        errorMessage = 'Preferences table does not exist. Please contact support.';
      } else if (error?.code === '42501' || error?.message?.includes('permission denied')) {
        errorMessage = 'Permission denied. Please ensure you are logged in.';
      } else if (error?.message) {
        errorMessage = `Failed to update preferences: ${error.message}`;
      } else if (error?.error?.message) {
        errorMessage = `Failed to update preferences: ${error.error.message}`;
      }

      toast.error(errorMessage);
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
      'social_preference',
    ];

    let completedFields = 0;

    requiredFields.forEach((field) => {
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
    updatePreferences: (data: Partial<UserPreferences>) =>
      updatePreferencesMutation.mutateAsync(data),
    isUpdating: updatePreferencesMutation.isPending,
    isPreferencesComplete: isPreferencesComplete(preferences),
    completionPercentage: getCompletionPercentage(preferences),
  };
};

// Hook for tracking property interactions
export const usePropertyInteractions = () => {
  const { user } = useAuthSession();

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

      const { error } = await supabase.from('property_interactions').insert(interaction);

      if (error) throw error;

      // Update user preferences based on interaction
      await updatePreferencesFromInteraction(propertyId, interactionType);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const updatePreferencesFromInteraction = async (propertyId: string, interactionType: string) => {
    // This would implement learning from user behavior
    // For now, we'll just log the interaction
    console.log(`User ${user?.id} ${interactionType} property ${propertyId}`);
  };

  return {
    trackInteraction,
  };
};
