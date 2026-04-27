// Utility functions to filter properties based on user preferences

import { Property } from '@/services/property/types';
import { UserPreferences } from '@/types/preferences';

const normalizeText = (value: string | null | undefined) =>
  String(value || '')
    .toLowerCase()
    .trim();

const getAreaTokens = (areas: string[]): string[] =>
  areas
    .flatMap((area) => normalizeText(area).split(','))
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

const matchesPreferredLocation = (
  property: Property,
  preferredAreas: string[] | null | undefined
): boolean => {
  const areas = Array.isArray(preferredAreas) ? preferredAreas : [];
  if (areas.length === 0) return true;

  const searchable = `${normalizeText(property.location)} ${normalizeText(property.address)}`;
  const areaTokens = getAreaTokens(areas);
  if (areaTokens.length === 0) return true;

  return areaTokens.some(
    (token) =>
      searchable.includes(token) ||
      token.includes(normalizeText(property.location)) ||
      token.includes(normalizeText(property.address))
  );
};

/**
 * Filter properties based on user preferences
 * Returns properties that match the user's preferences with a minimum match score
 */
export function filterPropertiesByPreferences(
  properties: Property[],
  preferences: UserPreferences | null | undefined,
  minMatchScore: number = 0.3
): Property[] {
  if (!preferences || properties.length === 0) {
    return properties; // Return all if no preferences
  }

  const filtered = properties.filter((property) => {
    const locationText = `${normalizeText(property.location)} ${normalizeText(property.address)}`;

    // Global guard: hide Lagos and Port Harcourt properties in tenant-facing AI results
    if (locationText.includes('lagos') || locationText.includes('port harcourt')) {
      if (import.meta.env.DEV) {
        console.debug(`Property ${property.name} filtered out: non-Abuja market (${locationText})`);
      }
      return false;
    }

    // Location preference acts as a hard filter so non-matching cities/areas are excluded.
    if (!matchesPreferredLocation(property, preferences.preferred_areas)) {
      if (import.meta.env.DEV) {
        console.debug(`Property ${property.name} filtered out: location mismatch`);
      }
      return false;
    }

    const matchScore = getPreferenceMatchScore(property, preferences);
    // Log for debugging (only in dev mode)
    if (import.meta.env.DEV && matchScore < minMatchScore) {
      console.debug(
        `Property ${property.name} filtered out: score ${matchScore.toFixed(2)} < ${minMatchScore}`
      );
    }
    return matchScore >= minMatchScore;
  });

  if (import.meta.env.DEV) {
    console.log(
      `🎯 Preference filtering: ${properties.length} → ${filtered.length} properties (min score: ${minMatchScore})`
    );
  }

  return filtered;
}

/**
 * Calculate a simple match score (0-1) based on user preferences
 * This is a simplified version of the SmartMatchingService for client-side filtering
 */
export function getPreferenceMatchScore(property: Property, preferences: UserPreferences): number {
  const preferredAreas = Array.isArray(preferences.preferred_areas)
    ? preferences.preferred_areas
    : [];
  const preferredPropertyTypes = Array.isArray(preferences.property_types)
    ? preferences.property_types
    : [];
  const amenityPrefs =
    preferences.amenity_preferences || ({} as UserPreferences['amenity_preferences']);

  let score = 0;
  let totalWeight = 0; // Track total weight instead of factors

  // Budget match (30% weight)
  // Parse price - handle both numeric and formatted strings (e.g., "₦500,000" or "500000")
  const propertyPrice =
    typeof property.price === 'string'
      ? Number(property.price.replace(/[^\d]/g, '')) || 0
      : Number(property.price) || 0;

  const budgetWeight = 0.3;
  totalWeight += budgetWeight;

  if (propertyPrice > 0) {
    if (propertyPrice >= preferences.min_budget && propertyPrice <= preferences.max_budget) {
      score += budgetWeight; // Perfect match
    } else {
      // Calculate how close it is to the budget range
      const flexibility =
        preferences.budget_flexibility === 'strict'
          ? 0.1
          : preferences.budget_flexibility === 'flexible'
            ? 0.2
            : 0.3;

      if (propertyPrice < preferences.min_budget) {
        const ratio = propertyPrice / preferences.min_budget;
        score += budgetWeight * Math.max(0, ratio - (1 - flexibility));
      } else if (propertyPrice > preferences.max_budget) {
        const ratio = preferences.max_budget / propertyPrice;
        score += budgetWeight * Math.max(0, ratio - (1 - flexibility));
      }
    }
  } else {
    // No price data - give partial score
    score += budgetWeight * 0.5;
  }

  // Location match (25% weight)
  const locationWeight = 0.25;
  totalWeight += locationWeight;

  if (preferredAreas.length > 0) {
    const locationMatch = matchesPreferredLocation(property, preferredAreas);
    score += locationMatch ? locationWeight : 0;
  } else {
    score += locationWeight; // No preference = neutral
  }

  // Property type match (15% weight)
  const typeWeight = 0.15;
  totalWeight += typeWeight;

  if (preferredPropertyTypes.length > 0) {
    const typeMatch = preferredPropertyTypes.some((type) => {
      const propType = property.type?.toLowerCase() || '';
      const prefType = type.toLowerCase();

      // Map property types to preference types
      // Property.type might be "residential", "commercial", etc.
      // Preferences.property_types are "apartment", "house", "studio", etc.
      const typeMapping: Record<string, string[]> = {
        residential: ['apartment', 'house', 'studio', 'duplex', 'penthouse'],
        commercial: ['commercial', 'office', 'retail'],
        land: ['land'],
      };

      // Check direct match first
      if (propType === prefType || propType.includes(prefType) || prefType.includes(propType)) {
        return true;
      }

      // Check property name/description for type hints
      const propertyName = property.name?.toLowerCase() || '';
      if (propertyName.includes(prefType)) {
        return true;
      }

      // Check if property type maps to preference type
      // If property.type is "residential", it should match any residential preference type
      const mappedTypes = typeMapping[propType] || [];
      if (mappedTypes.includes(prefType)) {
        return true;
      }

      // Also check property_category if available
      const propertyCategory = (property as any).property_category?.toLowerCase();
      if (
        propertyCategory === 'residential' &&
        ['apartment', 'house', 'studio', 'duplex', 'penthouse'].includes(prefType)
      ) {
        return true;
      }

      return false;
    });
    score += typeMatch ? typeWeight : 0;
  } else {
    score += typeWeight; // No preference = neutral
  }

  // Bedrooms match (15% weight)
  const bedroomsWeight = 0.15;
  totalWeight += bedroomsWeight;

  if (property.bedrooms) {
    const bedrooms = Number(property.bedrooms);
    if (bedrooms >= preferences.min_bedrooms) {
      if (preferences.max_bedrooms && bedrooms <= preferences.max_bedrooms) {
        score += bedroomsWeight; // Perfect match
      } else if (!preferences.max_bedrooms) {
        score += bedroomsWeight; // No max specified, so it's fine
      } else {
        score += bedroomsWeight * 0.67; // Slightly over, but acceptable
      }
    } else {
      score += bedroomsWeight * 0.33; // Below minimum, low score
    }
  } else {
    score += bedroomsWeight; // No data = neutral
  }

  // Bathrooms match (10% weight)
  const bathroomsWeight = 0.1;
  totalWeight += bathroomsWeight;

  if (property.bathrooms) {
    const bathrooms = Number(property.bathrooms);
    if (bathrooms >= preferences.min_bathrooms) {
      score += bathroomsWeight;
    } else {
      score += bathroomsWeight * 0.5;
    }
  } else {
    score += bathroomsWeight; // No data = neutral
  }

  // Amenities match (5% weight) - simplified
  const amenitiesWeight = 0.05;
  totalWeight += amenitiesWeight;

  if (property.features && property.features.length > 0 && amenityPrefs) {
    const importantAmenities = Object.entries(amenityPrefs)
      .filter(([_, importance]) => importance >= 7)
      .map(([amenity, _]) => amenity.toLowerCase());

    if (importantAmenities.length > 0) {
      const matchedAmenities = importantAmenities.filter((amenity) =>
        property.features?.some(
          (feature) =>
            feature.toLowerCase().includes(amenity) || amenity.includes(feature.toLowerCase())
        )
      );
      score += amenitiesWeight * (matchedAmenities.length / importantAmenities.length);
    } else {
      score += amenitiesWeight; // No important amenities = neutral
    }
  } else {
    score += amenitiesWeight; // No data = neutral
  }

  // Return the raw score (0-1)
  // Total weight should be 1.0 (0.3 + 0.25 + 0.15 + 0.15 + 0.1 + 0.05 = 1.0)
  return Math.min(1.0, score);
}

/**
 * Sort properties by preference match score (highest first)
 */
export function sortPropertiesByPreferences(
  properties: Property[],
  preferences: UserPreferences | null | undefined
): Property[] {
  if (!preferences || properties.length === 0) {
    return properties;
  }

  return [...properties].sort((a, b) => {
    const scoreA = getPreferenceMatchScore(a, preferences);
    const scoreB = getPreferenceMatchScore(b, preferences);
    return scoreB - scoreA; // Descending order (highest score first)
  });
}

/**
 * Get properties filtered and sorted by preferences
 */
export function getFilteredAndSortedProperties(
  properties: Property[],
  preferences: UserPreferences | null | undefined,
  minMatchScore: number = 0.3
): Property[] {
  const filtered = filterPropertiesByPreferences(properties, preferences, minMatchScore);
  return sortPropertiesByPreferences(filtered, preferences);
}
