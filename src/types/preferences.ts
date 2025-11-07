// User Preference Types for AI Matching System

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Budget preferences
  min_budget: number;
  max_budget: number;
  budget_flexibility: 'strict' | 'flexible' | 'very_flexible';
  
  // Location preferences
  preferred_areas: string[];
  max_commute_time?: number;
  commute_locations?: string[];
  transportation_mode?: 'car' | 'public_transport' | 'walking' | 'mixed';
  
  // Property preferences
  property_types: ('apartment' | 'house' | 'studio' | 'duplex' | 'penthouse')[];
  min_bedrooms: number;
  max_bedrooms?: number;
  min_bathrooms: number;
  furnished_preference: 'furnished' | 'unfurnished' | 'either';
  
  // Amenity preferences (weighted by importance)
  amenity_preferences: {
    parking: number; // 0-10 importance scale
    gym: number;
    pool: number;
    security: number;
    generator: number;
    internet: number;
    air_conditioning: number;
    balcony: number;
    garden: number;
    elevator: number;
    laundry: number;
    pet_friendly: number;
  };
  
  // Lifestyle preferences
  noise_tolerance: 'quiet' | 'moderate' | 'lively';
  social_preference: 'private' | 'community_oriented';
  work_from_home: boolean;
  has_pets: boolean;
  pet_types?: string[];
  
  // Learning data
  viewed_properties: string[];
  saved_properties: string[];
  applied_properties: string[];
  rejected_properties: string[];
  
  // Behavioral patterns
  search_patterns: {
    most_active_hours: number[];
    search_frequency: number;
    decision_speed: 'quick' | 'moderate' | 'thorough';
  };
  
  // Calculated preferences (ML-derived)
  calculated_preferences?: {
    location_affinity_scores: Record<string, number>;
    amenity_importance_scores: Record<string, number>;
    price_sensitivity_score: number;
    style_preferences: Record<string, number>;
  };
  
  created_at: string;
  updated_at: string;
}

export interface PropertyInteraction {
  id: string;
  user_id: string;
  property_id: string;
  interaction_type: 'view' | 'save' | 'apply' | 'reject' | 'contact' | 'share';
  duration_seconds?: number;
  interaction_data?: Record<string, any>;
  created_at: string;
}

export interface MatchingScore {
  property_id: string;
  user_id: string;
  overall_score: number;
  score_breakdown: {
    budget_score: number;
    location_score: number;
    amenity_score: number;
    lifestyle_score: number;
    behavioral_score: number;
  };
  confidence_level: 'low' | 'medium' | 'high';
  reasons: string[];
  calculated_at: string;
}

export interface SmartRecommendation {
  id: string;
  user_id: string;
  property_id: string;
  matching_score: MatchingScore;
  recommendation_type: 'daily_picks' | 'instant_match' | 'similar_to_saved' | 'price_drop';
  status: 'pending' | 'viewed' | 'dismissed' | 'applied';
  created_at: string;
  expires_at?: string;
}
