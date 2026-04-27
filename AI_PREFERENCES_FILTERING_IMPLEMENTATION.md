# AI Preferences Filtering Implementation

## Overview

The AI Preferences Setup now actively filters and sorts properties displayed to tenants based on their preferences. Properties are automatically filtered and sorted by match score when tenants have completed their AI preferences setup.

## Implementation Details

### 1. **New Utility: `preferenceFilters.ts`**

Created `src/utils/preferenceFilters.ts` with three main functions:

- **`filterPropertiesByPreferences()`**: Filters properties based on user preferences with a minimum match score threshold (default: 0.3)
- **`sortPropertiesByPreferences()`**: Sorts properties by match score (highest first)
- **`getFilteredAndSortedProperties()`**: Combines filtering and sorting

### 2. **Match Score Calculation**

The system calculates a match score (0-1) based on:

- **Budget (30% weight)**: Checks if property price is within user's budget range, with flexibility consideration
- **Location (25% weight)**: Matches preferred areas/neighborhoods
- **Property Type (15% weight)**: Matches preferred property types (apartment, house, etc.)
- **Bedrooms (15% weight)**: Matches minimum/maximum bedroom requirements
- **Bathrooms (10% weight)**: Matches minimum bathroom requirements
- **Amenities (5% weight)**: Matches important amenities (importance score ≥ 7)

### 3. **Integration with `usePublicProperties`**

Updated `src/hooks/usePublicProperties.ts` to:

- Import `useUserPreferences` hook to get user's preferences
- Import `getFilteredAndSortedProperties` utility
- Apply preference filtering automatically when:
  - User is authenticated
  - User has preferences set up
- Filter happens **before** manual filters (search, location, etc.)

### 4. **How It Works**

1. **User completes AI Preferences Setup** during onboarding
2. **Preferences are saved** to `user_preferences` table
3. **When properties are fetched**:
   - System checks if user has preferences
   - If yes: Properties are filtered (min match score: 0.3) and sorted by match score
   - If no: All available properties are shown
4. **Manual filters** (search, location, price range) are applied on top of preference-filtered results

## Where It's Applied

### Tenant Dashboard

- Properties shown in the "Available Longterm Properties" section are filtered by preferences
- Properties are sorted by match score (best matches first)

### Public Properties Page

- All properties are filtered and sorted by preferences
- Manual filters work on top of preference-filtered results

## Filtering Logic

### Budget Matching

- **Perfect match**: Property price within `min_budget` and `max_budget` → 100% score
- **Flexible matching**: Based on `budget_flexibility`:
  - `strict`: Very little tolerance (10%)
  - `flexible`: Moderate tolerance (20%)
  - `very_flexible`: High tolerance (30%)

### Location Matching

- Checks if property location/address contains any preferred area
- Partial match gives some score (0.1) to avoid excluding all properties

### Property Type Matching

- Matches property type against user's preferred types
- Handles variations (e.g., "apartment" matches "Apartment")

### Bedrooms/Bathrooms Matching

- Must meet minimum requirements
- Can exceed maximum (with slight score reduction)
- Below minimum gets very low score

### Amenities Matching

- Only considers amenities with importance score ≥ 7
- Calculates percentage of important amenities matched

## Minimum Match Score

Default minimum match score: **0.3 (30%)**

This means:

- Properties with match score < 30% are filtered out
- Only properties with at least 30% match are shown
- Adjustable in the code if needed

## Benefits

1. **Personalized Experience**: Tenants see properties that match their preferences
2. **Better Recommendations**: Best matches appear first
3. **Time Saving**: Filters out irrelevant properties automatically
4. **Flexible**: Works with or without preferences (shows all if no preferences)

## Future Enhancements

- Allow users to adjust minimum match score
- Show match score percentage on property cards
- Add "Why this matches" explanations
- Learn from user interactions to improve matching
- Consider commute time when available

## Testing

To test the filtering:

1. Complete AI Preferences Setup as a tenant
2. Set specific preferences (budget, location, property type, etc.)
3. View properties in Tenant Dashboard or Public Properties page
4. Verify that:
   - Properties match your preferences
   - Properties are sorted by relevance
   - Properties outside your preferences are filtered out (if match score < 0.3)

## Notes

- Filtering only applies when user is authenticated and has preferences
- Manual filters (search, location, etc.) still work on top of preference filtering
- If no preferences exist, all available properties are shown (backward compatible)
