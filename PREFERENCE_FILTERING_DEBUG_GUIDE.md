# AI Preferences Filtering - Debugging Guide

## Issue: Preferences Not Filtering Properties

If preferences are not filtering properties, check the following:

## 1. Verify Preferences Are Saved

### Check in Browser Console:

```javascript
// Open browser console and check:
// 1. After saving preferences, you should see:
//    "Preferences updated successfully!"

// 2. Check if preferences are loaded:
// In React DevTools, check the useUserPreferences hook
// preferences should not be null
```

### Check Database:

- Go to Supabase Dashboard
- Check `user_preferences` table
- Verify your user_id has a record
- Check that fields are populated (min_budget, max_budget, preferred_areas, etc.)

## 2. Check Console Logs

After completing preferences setup, you should see in console:

```
🎯 Applying preference filtering: {
  user: "user-id",
  preferencesCount: 20+,
  propertiesBefore: X,
  minBudget: ...,
  maxBudget: ...,
  preferredAreas: [...],
  propertyTypes: [...]
}

✅ Filtered properties: {
  propertiesAfter: Y,
  filteredOut: X - Y
}
```

If you don't see these logs:

- Preferences might not be loaded yet
- User might not be authenticated
- Preferences might be null

## 3. Verify Filtering Logic

### Minimum Match Score

- Default: **0.3 (30%)**
- Properties with score < 30% are filtered out
- If all properties are filtered out, try lowering the threshold

### Score Calculation

Each property gets a score (0-1) based on:

- **Budget (30%)**: Must be within budget range (with flexibility)
- **Location (25%)**: Must match preferred areas
- **Property Type (15%)**: Must match preferred types
- **Bedrooms (15%)**: Must meet minimum requirements
- **Bathrooms (10%)**: Must meet minimum requirements
- **Amenities (5%)**: Important amenities (score ≥ 7) must match

## 4. Common Issues

### Issue: Preferences are null

**Solution**:

- Complete the AI Preferences Setup form
- Make sure you click "Save Preferences" at the end
- Check browser console for errors

### Issue: Properties not filtering

**Possible causes**:

1. **Preferences not loaded**: Wait for preferences to load before filtering
2. **Property type mismatch**: Property.type might be "residential" but preferences expect "apartment"
   - **Fix**: The system now maps "residential" → ["apartment", "house", etc.]
3. **Budget mismatch**: Property prices might be outside your budget range
   - **Fix**: Check if prices are formatted correctly (e.g., "₦500,000" vs 500000)
4. **Location mismatch**: Property location doesn't match preferred areas
   - **Fix**: Check if location strings match exactly (case-insensitive)

### Issue: All properties filtered out

**Solution**:

- Lower the minimum match score (currently 0.3)
- Check if your preferences are too strict
- Verify property data is complete (price, location, type, etc.)

## 5. Testing Steps

1. **Complete Preferences Setup**:
   - Set budget: e.g., ₦500,000 - ₦2,000,000
   - Select preferred areas: e.g., "Lagos", "Victoria Island"
   - Select property types: e.g., "apartment", "house"
   - Set bedrooms: e.g., min 2, max 4
   - Set bathrooms: e.g., min 1
   - Save preferences

2. **Check Console Logs**:
   - Look for "🎯 Applying preference filtering" log
   - Check "propertiesBefore" vs "propertiesAfter"
   - If "filteredOut" is 0, no properties were filtered

3. **Verify Properties**:
   - Properties should match your budget range
   - Properties should be in preferred areas
   - Properties should match property types
   - Properties should meet bedroom/bathroom requirements

## 6. Debug Mode

The system logs detailed information in development mode:

- Properties filtered out (with scores)
- Total properties before/after filtering
- Preference values

Check browser console for these logs.

## 7. Manual Testing

To test if filtering works:

1. Set very strict preferences:
   - Budget: ₦100,000 - ₦200,000 (very narrow)
   - Location: "Victoria Island" (specific area)
   - Property type: "penthouse" (specific type)
   - Bedrooms: min 5 (high requirement)

2. Check results:
   - Should see very few or no properties
   - All shown properties should match criteria

3. Relax preferences:
   - Increase budget range
   - Add more locations
   - Add more property types
   - Lower bedroom requirements

4. Check results:
   - Should see more properties
   - Properties should still be sorted by match score

## 8. Property Type Mapping

The system maps property types as follows:

- `property.type = "residential"` → matches: apartment, house, studio, duplex, penthouse
- `property.type = "commercial"` → matches: commercial, office, retail
- `property.type = "land"` → matches: land

Also checks:

- Property name for type hints
- Property category (RESIDENTIAL, COMMERCIAL, etc.)

## 9. Force Refresh

If preferences were just saved:

1. Refresh the page
2. Check console for "🎯 Applying preference filtering" log
3. Properties should be filtered and sorted

## 10. Check Query Cache

Preferences are cached for 5 minutes. If you just saved preferences:

- The cache should be invalidated automatically
- If not, manually refresh the page
- Or wait up to 5 minutes for cache to expire

---

**Still not working?** Check:

- Browser console for errors
- Network tab for failed requests
- React DevTools for hook state
- Database for saved preferences
