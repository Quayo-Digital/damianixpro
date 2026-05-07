// AI-Powered Smart Property Matching Service

import { supabase } from '@/integrations/supabase/client';
import {
  UserPreferences,
  PropertyInteraction,
  MatchingScore,
  SmartRecommendation,
} from '@/types/preferences';

/** Great-circle distance in kilometres (sufficient for residential proximity scoring). */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class SmartMatchingService {
  /**
   * Calculate compatibility score between user preferences and property
   */
  static calculateMatchingScore(userPreferences: UserPreferences, property: any): MatchingScore {
    const scores = {
      budget_score: this.calculateBudgetScore(userPreferences, property),
      location_score: this.calculateLocationScore(userPreferences, property),
      amenity_score: this.calculateAmenityScore(userPreferences, property),
      lifestyle_score: this.calculateLifestyleScore(userPreferences, property),
      behavioral_score: this.calculateBehavioralScore(userPreferences, property),
    };

    // Weighted overall score
    const weights = {
      budget_score: 0.3,
      location_score: 0.25,
      amenity_score: 0.2,
      lifestyle_score: 0.15,
      behavioral_score: 0.1,
    };

    const overall_score = Object.entries(scores).reduce(
      (total, [key, score]) => total + score * weights[key as keyof typeof weights],
      0
    );

    const confidence_level = this.calculateConfidenceLevel(scores, userPreferences);
    const reasons = this.generateMatchReasons(scores, userPreferences, property);

    return {
      property_id: property.id,
      user_id: userPreferences.user_id,
      overall_score: Math.round(overall_score * 100) / 100,
      score_breakdown: scores,
      confidence_level,
      reasons,
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate budget compatibility score (0-1)
   */
  private static calculateBudgetScore(preferences: UserPreferences, property: any): number {
    const propertyPrice = property.rent_amount || property.price;
    const { min_budget, max_budget, budget_flexibility } = preferences;

    // Perfect match within budget
    if (propertyPrice >= min_budget && propertyPrice <= max_budget) {
      return 1.0;
    }

    // Handle flexibility
    const flexibility_multiplier = {
      strict: 0.1,
      flexible: 0.3,
      very_flexible: 0.5,
    }[budget_flexibility];

    // Below minimum budget
    if (propertyPrice < min_budget) {
      const deficit_ratio = (min_budget - propertyPrice) / min_budget;
      return Math.max(0, 1 - deficit_ratio / flexibility_multiplier);
    }

    // Above maximum budget
    if (propertyPrice > max_budget) {
      const excess_ratio = (propertyPrice - max_budget) / max_budget;
      return Math.max(0, 1 - excess_ratio / flexibility_multiplier);
    }

    return 0;
  }

  /**
   * Calculate location compatibility score (0-1)
   */
  private static calculateLocationScore(preferences: UserPreferences, property: any): number {
    let score = 0;

    // Check preferred areas
    if (preferences.preferred_areas.length > 0) {
      const areaMatch = preferences.preferred_areas.some(
        (area) =>
          property.location?.toLowerCase().includes(area.toLowerCase()) ||
          property.address?.toLowerCase().includes(area.toLowerCase())
      );
      score += areaMatch ? 0.6 : 0;
    }

    // Commute score (if commute locations provided)
    if (preferences.commute_locations && preferences.commute_locations.length > 0) {
      // This would integrate with a mapping service to calculate actual commute times
      // For now, we'll use a simplified distance-based approach
      const commuteScore = this.calculateCommuteScore(preferences, property);
      score += commuteScore * 0.4;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate amenity compatibility score (0-1)
   */
  private static calculateAmenityScore(preferences: UserPreferences, property: any): number {
    const propertyAmenities = property.amenities || [];
    const { amenity_preferences } = preferences;

    let totalWeight = 0;
    let matchedWeight = 0;

    Object.entries(amenity_preferences).forEach(([amenity, importance]) => {
      totalWeight += importance;

      const hasAmenity = propertyAmenities.some(
        (pa: any) =>
          pa.name?.toLowerCase().includes(amenity.toLowerCase()) ||
          pa.type?.toLowerCase().includes(amenity.toLowerCase())
      );

      if (hasAmenity) {
        matchedWeight += importance;
      }
    });

    return totalWeight > 0 ? matchedWeight / totalWeight : 0.5;
  }

  /**
   * Calculate lifestyle compatibility score (0-1)
   */
  private static calculateLifestyleScore(preferences: UserPreferences, property: any): number {
    let score = 0;
    let factors = 0;

    // Property type preference
    if (preferences.property_types.includes(property.property_type)) {
      score += 0.3;
    }
    factors += 0.3;

    // Bedroom requirements
    if (
      property.bedrooms >= preferences.min_bedrooms &&
      (!preferences.max_bedrooms || property.bedrooms <= preferences.max_bedrooms)
    ) {
      score += 0.2;
    }
    factors += 0.2;

    // Bathroom requirements
    if (property.bathrooms >= preferences.min_bathrooms) {
      score += 0.1;
    }
    factors += 0.1;

    // Furnished preference
    const furnishedMatch =
      preferences.furnished_preference === 'either' ||
      (preferences.furnished_preference === 'furnished' && property.is_furnished) ||
      (preferences.furnished_preference === 'unfurnished' && !property.is_furnished);

    if (furnishedMatch) {
      score += 0.2;
    }
    factors += 0.2;

    // Pet-friendly if user has pets
    if (preferences.has_pets) {
      if (property.pet_friendly) {
        score += 0.2;
      }
      factors += 0.2;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Behavioral compatibility score derived from the user's own interaction history
   * stored on `UserPreferences`. Strong signals (saved / applied) outweigh weaker
   * ones (viewed); explicit rejection drops the score sharply.
   *
   * No async DB call: we use the lists already loaded with `UserPreferences`.
   */
  private static calculateBehavioralScore(preferences: UserPreferences, property: any): number {
    const id = property?.id;
    if (!id) return 0.5;

    const saved = preferences.saved_properties || [];
    const applied = preferences.applied_properties || [];
    const viewed = preferences.viewed_properties || [];
    const rejected = preferences.rejected_properties || [];

    if (rejected.includes(id)) return 0.0;
    if (applied.includes(id)) return 1.0;
    if (saved.includes(id)) return 0.95;
    if (viewed.includes(id)) return 0.65;

    /**
     * Engagement signal: a user with many saves/applications shows clear intent,
     * which raises the floor for unseen properties. Many rejections moves it down.
     */
    const positiveSignals = saved.length * 1.0 + applied.length * 1.5;
    const rejectedSignals = rejected.length;
    const totalSignals = positiveSignals + rejectedSignals;
    if (totalSignals === 0) return 0.5;

    const engagementBias = (positiveSignals - rejectedSignals * 0.5) / Math.max(1, totalSignals);
    const baseline = 0.5 + Math.max(-0.25, Math.min(0.25, engagementBias * 0.5));

    /** Optional ML-derived booster when location_affinity_scores is populated. */
    const calc = preferences.calculated_preferences;
    if (calc?.location_affinity_scores && property.location) {
      const loc = String(property.location).toLowerCase();
      const matched = Object.entries(calc.location_affinity_scores).find(([area]) =>
        loc.includes(area.toLowerCase())
      );
      if (matched) {
        const [, affinity] = matched;
        return Math.max(0, Math.min(1, baseline * 0.7 + Number(affinity) * 0.3));
      }
    }

    return Math.max(0, Math.min(1, baseline));
  }

  /**
   * Commute score: prefers properties whose location/address text mentions any of
   * the user's commute locations, with a graceful fallback to preferred areas.
   * If lat/lng exist on both sides, a Haversine bonus rewards closer properties.
   *
   * Range: 0..1. When no signal is available we return a conservative 0.5
   * (down from the original constant 0.7, so commute now meaningfully penalises
   * properties far from declared commute hubs).
   */
  private static calculateCommuteScore(preferences: UserPreferences, property: any): number {
    const commuteLocations = (preferences.commute_locations || []).filter(Boolean);
    if (commuteLocations.length === 0) return 0.5;

    const haystack = `${property.location || ''} ${property.address || ''}`.toLowerCase();
    let bestMatch = 0;
    for (const loc of commuteLocations) {
      const needle = String(loc).toLowerCase();
      if (!needle) continue;
      if (haystack.includes(needle)) {
        bestMatch = Math.max(bestMatch, 1.0);
      } else {
        const tokens = needle.split(/\s+/).filter(Boolean);
        const tokenHits = tokens.filter((t) => haystack.includes(t)).length;
        if (tokenHits > 0) {
          bestMatch = Math.max(bestMatch, tokenHits / tokens.length);
        }
      }
    }

    if (bestMatch === 0) {
      const preferred = preferences.preferred_areas || [];
      const areaMatch = preferred.some((area) => haystack.includes(String(area).toLowerCase()));
      if (areaMatch) bestMatch = 0.55;
    }

    /** Haversine bonus when both sides have coordinates (e.g. property has latitude/longitude). */
    const propLat = Number(property.latitude);
    const propLng = Number(property.longitude);
    const userLat = Number((preferences as any).preferred_latitude);
    const userLng = Number((preferences as any).preferred_longitude);
    if (
      Number.isFinite(propLat) &&
      Number.isFinite(propLng) &&
      Number.isFinite(userLat) &&
      Number.isFinite(userLng)
    ) {
      const km = haversineKm(userLat, userLng, propLat, propLng);
      const proximity = km <= 2 ? 1 : km <= 5 ? 0.85 : km <= 10 ? 0.65 : km <= 20 ? 0.4 : 0.15;
      bestMatch = Math.max(bestMatch, proximity);
    }

    return Math.max(0.15, Math.min(1, bestMatch));
  }

  /**
   * Determine confidence level based on score distribution
   */
  private static calculateConfidenceLevel(
    scores: Record<string, number>,
    preferences: UserPreferences
  ): 'low' | 'medium' | 'high' {
    const scoreValues = Object.values(scores);
    const averageScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
    const variance =
      scoreValues.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) /
      scoreValues.length;

    // High confidence: high average score with low variance
    if (averageScore > 0.7 && variance < 0.1) return 'high';
    if (averageScore > 0.5 && variance < 0.2) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable reasons for the match
   */
  private static generateMatchReasons(
    scores: Record<string, number>,
    preferences: UserPreferences,
    property: any
  ): string[] {
    const reasons: string[] = [];

    if (scores.budget_score > 0.8) {
      reasons.push('Perfect fit for your budget');
    } else if (scores.budget_score > 0.6) {
      reasons.push('Within your budget range');
    }

    if (scores.location_score > 0.8) {
      reasons.push('Located in your preferred area');
    } else if (scores.location_score > 0.6) {
      reasons.push('Good location match');
    }

    if (scores.amenity_score > 0.8) {
      reasons.push('Has most of your desired amenities');
    } else if (scores.amenity_score > 0.6) {
      reasons.push('Good amenity match');
    }

    if (scores.lifestyle_score > 0.8) {
      reasons.push('Matches your lifestyle preferences');
    }

    if (property.bedrooms >= preferences.min_bedrooms) {
      reasons.push(`${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''} as requested`);
    }

    if (preferences.has_pets && property.pet_friendly) {
      reasons.push('Pet-friendly property');
    }

    return reasons.length > 0 ? reasons : ['Good overall match for your preferences'];
  }

  /**
   * Get smart recommendations for a user
   */
  static async getSmartRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<SmartRecommendation[]> {
    try {
      // Get user preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      // If no preferences found, return empty array instead of throwing error
      if (!preferences) {
        console.log('No user preferences found for user:', userId);
        return [];
      }

      // Get available properties
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(50); // Get more than needed for better filtering

      if (!properties) {
        return [];
      }

      // Calculate matching scores for all properties
      const scoredProperties = properties
        .map((property) => ({
          property,
          matchingScore: this.calculateMatchingScore(preferences, property),
        }))
        .filter((item) => item.matchingScore.overall_score > 0.3) // Filter low scores
        .sort((a, b) => b.matchingScore.overall_score - a.matchingScore.overall_score)
        .slice(0, limit);

      // Convert to recommendations
      const recommendations: SmartRecommendation[] = scoredProperties.map((item) => ({
        id: `rec_${userId}_${item.property.id}_${Date.now()}`,
        user_id: userId,
        property_id: item.property.id,
        matching_score: item.matchingScore,
        recommendation_type: 'daily_picks',
        status: 'pending',
        created_at: new Date().toISOString(),
      }));

      return recommendations;
    } catch (error) {
      console.error('Error generating smart recommendations:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  }

  /**
   * Track user interaction with properties for learning
   */
  static async trackInteraction(
    userId: string,
    propertyId: string,
    interactionType: PropertyInteraction['interaction_type'],
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      const interaction: Omit<PropertyInteraction, 'id'> = {
        user_id: userId,
        property_id: propertyId,
        interaction_type: interactionType,
        interaction_data: additionalData,
        created_at: new Date().toISOString(),
      };

      await supabase.from('property_interactions').insert(interaction);

      // Update user preferences based on interaction
      await this.updatePreferencesFromInteraction(userId, propertyId, interactionType);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  /**
   * Update user preferences based on interactions (learning)
   */
  private static async updatePreferencesFromInteraction(
    userId: string,
    propertyId: string,
    interactionType: PropertyInteraction['interaction_type']
  ): Promise<void> {
    // This would implement machine learning to update preferences
    // For now, we'll do basic preference learning

    try {
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .limit(1)
        .maybeSingle();

      if (!property) return;

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!preferences) return;

      // Update interaction arrays
      const updatedPreferences = { ...preferences };

      switch (interactionType) {
        case 'view':
          if (!updatedPreferences.viewed_properties.includes(propertyId)) {
            updatedPreferences.viewed_properties.push(propertyId);
          }
          break;
        case 'save':
          if (!updatedPreferences.saved_properties.includes(propertyId)) {
            updatedPreferences.saved_properties.push(propertyId);
          }
          break;
        case 'apply':
          if (!updatedPreferences.applied_properties.includes(propertyId)) {
            updatedPreferences.applied_properties.push(propertyId);
          }
          break;
        case 'reject':
          if (!updatedPreferences.rejected_properties.includes(propertyId)) {
            updatedPreferences.rejected_properties.push(propertyId);
          }
          break;
      }

      await supabase.from('user_preferences').update(updatedPreferences).eq('user_id', userId);
    } catch (error) {
      console.error('Error updating preferences from interaction:', error);
    }
  }
}
