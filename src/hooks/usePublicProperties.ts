import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@/services/property/types';
import { fetchProperties } from '@/services/property/api/queries';
import { applyAllFilters } from '@/utils/propertyFilters';
import { getPaginatedItems, calculateTotalPages } from '@/utils/paginationUtils';

export function usePublicProperties() {
  // Data fetching from Supabase
  const { data: properties = [], isLoading: loading, error } = useQuery<Property[]>({
    queryKey: ['publicProperties'],
    queryFn: () => fetchProperties(),
  });

  if (error) {
    console.error("Failed to fetch properties:", error);
  }
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [location, setLocation] = useState('all');
  
  // Dynamically set price range and other filters based on fetched properties
  const { minPrice, maxPrice, locations, availableFeatures } = useMemo(() => {
    if (properties.length === 0) {
      return { minPrice: 0, maxPrice: 1000000, locations: [], availableFeatures: [] };
    }
    const prices = properties.map(p => Number(p.price)).filter(p => !isNaN(p) && p > 0);
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 1000000;
    const locs = Array.from(new Set(properties.map(p => p.location).filter(Boolean)));
    const features = Array.from(new Set(properties.flatMap(p => p.features || [])));
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
  const filteredProperties = applyAllFilters(properties, {
    searchQuery,
    propertyType,
    location,
    priceRange,
    bedroomsFilter,
    selectedFeatures
  });
  
  // Get current page of properties
  const totalPages = calculateTotalPages(filteredProperties.length, propertiesPerPage);
  const currentProperties = getPaginatedItems(filteredProperties, currentPage, propertiesPerPage);
  
  // Pagination functions
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
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
    setLocation('all');
    setPriceRange([minPrice, maxPrice]);
    setBedroomsFilter('any');
    setSelectedFeatures([]);
    setCurrentPage(1);
  };
  
  return {
    loading,
    properties,
    filteredProperties,
    currentProperties,
    searchQuery,
    setSearchQuery,
    propertyType,
    setPropertyType,
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
