import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@/services/property/types';
import { fetchProperties } from '@/services/property/api/queries';
import { applyAllFilters } from '@/utils/propertyFilters';
import { getPropertyNumericPrice } from '@/utils/propertyFilters';
import { getPaginatedItems, calculateTotalPages } from '@/utils/paginationUtils';
import { demoProperties } from '@/data/demoProperties';
import { useUserPreferences } from './useUserPreferences';
import { getFilteredAndSortedProperties } from '@/utils/preferenceFilters';
import { useAuthSession } from '@/contexts/auth';

let hasLoggedAbujaFallbackInSession = false;
let hasLoggedPreferenceFilterInSession = false;

export function usePublicProperties() {
  const hasLoggedAbujaFallbackRef = useRef(false);
  const lastDataSourceSignatureRef = useRef<string>('');
  const { user } = useAuthSession();
  const { preferences, isLoading: preferencesLoading } = useUserPreferences();

  // Data fetching from Supabase
  const {
    data: fetchedProperties = [],
    isLoading: loading,
    error,
  } = useQuery<Property[]>({
    queryKey: ['publicProperties', user?.id ?? 'anon'],
    queryFn: async () => {
      try {
        return await fetchProperties();
      } catch (error) {
        // On network errors, return demo data
        if (
          error instanceof Error &&
          (error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('Failed to fetch'))
        ) {
          console.warn('Network error detected, using demo properties');
          return demoProperties;
        }
        throw error;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Public listings should stay fresh when users navigate back after adding/editing properties.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Use demo data if no properties found or on error
  const properties = useMemo(() => {
    let baseProperties: Property[] = [];

    if (
      error &&
      error instanceof Error &&
      (error.message.includes('fetch') || error.message.includes('network'))
    ) {
      baseProperties = demoProperties;
    } else if (fetchedProperties.length === 0 && !loading) {
      // Keep public page populated when DB currently yields no visible rows
      // (e.g. strict RLS, empty seed data, or status mismatch).
      baseProperties = demoProperties;
    } else {
      baseProperties = fetchedProperties;
    }

    // Apply AI preference filtering if user has preferences set up
    // Wait for preferences to load before applying filter
    let result = baseProperties;

    if (user && !preferencesLoading && preferences) {
      if (import.meta.env.DEV && !hasLoggedPreferenceFilterInSession) {
        console.log('🎯 Applying preference filtering:', {
          user: user.id,
          preferencesCount: Object.keys(preferences).length,
          propertiesBefore: baseProperties.length,
          minBudget: preferences.min_budget,
          maxBudget: preferences.max_budget,
          preferredAreas: preferences.preferred_areas,
          propertyTypes: preferences.property_types,
        });
      }

      const filtered = getFilteredAndSortedProperties(baseProperties, preferences, 0.3);

      if (import.meta.env.DEV && !hasLoggedPreferenceFilterInSession) {
        console.log('✅ Filtered properties:', {
          propertiesAfter: filtered.length,
          filteredOut: baseProperties.length - filtered.length,
        });
        hasLoggedPreferenceFilterInSession = true;
      }

      result = filtered;
    }

    // Abuja-only fallback: only when AI preference filtering is active and yields no matches.
    const aiFilteringActive = !!user && !preferencesLoading && !!preferences;
    if (result.length === 0 && aiFilteringActive) {
      const abujaDemo = demoProperties.filter((p) => {
        const text = `${String(p.location || '')} ${String(p.address || '')}`.toLowerCase();
        return text.includes('abuja');
      });

      if (
        import.meta.env.DEV &&
        !hasLoggedAbujaFallbackRef.current &&
        !hasLoggedAbujaFallbackInSession
      ) {
        console.log('⚠️ No matching properties after AI filter; falling back to Abuja demo data', {
          abujaDemoCount: abujaDemo.length,
        });
        hasLoggedAbujaFallbackRef.current = true;
        hasLoggedAbujaFallbackInSession = true;
      }

      return abujaDemo;
    }

    return result;
  }, [fetchedProperties, loading, error, user, preferences, preferencesLoading]);

  const isDemoSource =
    fetchedProperties.length === 0 ||
    (properties.length > 0 && properties.every((p) => String(p.id).startsWith('demo-')));
  const publicDataSource: 'supabase' | 'demo' = isDemoSource ? 'demo' : 'supabase';

  useEffect(() => {
    if (!import.meta.env.DEV || loading) return;

    const isFallbackDemo =
      fetchedProperties.length === 0 ||
      (properties.length > 0 && properties.every((p) => String(p.id).startsWith('demo-')));
    const source = isFallbackDemo ? 'demo' : 'supabase';
    const signature = `${source}:${fetchedProperties.length}:${properties.length}`;
    if (lastDataSourceSignatureRef.current === signature) return;
    lastDataSourceSignatureRef.current = signature;

    const message = isFallbackDemo
      ? `Public properties source: DEMO fallback (supabase rows: ${fetchedProperties.length}, shown: ${properties.length})`
      : `Public properties source: SUPABASE (rows: ${fetchedProperties.length}, shown: ${properties.length})`;

    console.log(`[usePublicProperties] ${message}`);
  }, [fetchedProperties.length, properties, loading]);

  if (error && !error.message?.includes('fetch') && !error.message?.includes('network')) {
    console.error('Failed to fetch properties:', error);
  }

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [location, setLocation] = useState('all');

  // Dynamically set price range and other filters based on fetched properties
  const { minPrice, maxPrice, locations, availableFeatures } = useMemo(() => {
    if (properties.length === 0) {
      return { minPrice: 0, maxPrice: 1000000, locations: [], availableFeatures: [] };
    }
    const prices = properties
      .map((p) => getPropertyNumericPrice(p))
      .filter((p): p is number => p !== null && p > 0);
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 1000000;
    const locs = Array.from(new Set(properties.map((p) => p.location).filter(Boolean)));
    const features = Array.from(new Set(properties.flatMap((p) => p.features || [])));
    return { minPrice: min, maxPrice: max, locations: locs, availableFeatures: features };
  }, [properties]);

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [bedroomsFilter, setBedroomsFilter] = useState('any');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Update price range when properties data loads
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 6;

  // Derived values for filtering
  const bedroomOptions = ['1', '2', '3', '4', '5+'];

  // Filter properties based on filter settings
  // Note: Preference filtering is already applied in the `properties` memo above
  // Manual filters are applied on top of preference-filtered properties
  const filteredProperties = applyAllFilters(properties, {
    searchQuery,
    propertyType,
    transactionType,
    location,
    priceRange,
    bedroomsFilter,
    selectedFeatures,
  });

  // Get current page of properties
  const totalPages = calculateTotalPages(filteredProperties.length, propertiesPerPage);
  const currentProperties = getPaginatedItems(filteredProperties, currentPage, propertiesPerPage);

  // Pagination functions
  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset all filters
  const clearFilters = () => {
    setSearchQuery('');
    setPropertyType('all');
    setTransactionType('all');
    setLocation('all');
    setPriceRange([minPrice, maxPrice]);
    setBedroomsFilter('any');
    setSelectedFeatures([]);
    setCurrentPage(1);
  };

  return {
    loading,
    publicDataSource,
    supabaseRowCount: fetchedProperties.length,
    basePropertyCount: properties.length,
    preferences,
    preferencesLoading,
    properties,
    filteredProperties,
    currentProperties,
    searchQuery,
    setSearchQuery,
    propertyType,
    setPropertyType,
    transactionType,
    setTransactionType,
    location,
    setLocation,
    locations,
    priceRange,
    setPriceRange,
    minPrice,
    maxPrice,
    bedroomsFilter,
    setBedroomsFilter,
    bedroomOptions,
    selectedFeatures,
    setSelectedFeatures,
    availableFeatures,
    currentPage,
    totalPages,
    paginate,
    nextPage,
    prevPage,
    clearFilters,
  };
}
