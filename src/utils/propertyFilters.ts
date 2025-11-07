
import { Property } from '@/services/property/types';

/**
 * Filters properties based on search query
 */
export const filterBySearchQuery = (
  properties: Property[], 
  searchQuery: string
): Property[] => {
  if (!searchQuery) return properties;
  
  const query = searchQuery.toLowerCase();
  return properties.filter(property => 
    property.name.toLowerCase().includes(query) ||
    property.location.toLowerCase().includes(query) ||
    property.description?.toLowerCase().includes(query)
  );
};

/**
 * Filters properties based on property type
 */
export const filterByPropertyType = (
  properties: Property[], 
  propertyType: string
): Property[] => {
  if (propertyType === 'all') return properties;
  return properties.filter(property => property.type === propertyType);
};

/**
 * Filters properties based on location
 */
export const filterByLocation = (
  properties: Property[], 
  location: string
): Property[] => {
  if (location === 'all') return properties;
  return properties.filter(property => property.location === location);
};

/**
 * Filters properties based on price range
 */
export const filterByPriceRange = (
  properties: Property[],
  priceRange: [number, number]
): Property[] => {
  return properties.filter(property => {
    const numericPrice = parseInt(property.price.replace(/[^\d]/g, ''));
    return numericPrice >= priceRange[0] && numericPrice <= priceRange[1];
  });
};

/**
 * Filters properties based on number of bedrooms
 */
export const filterByBedrooms = (
  properties: Property[],
  bedroomsFilter: string
): Property[] => {
  if (bedroomsFilter === 'any') return properties;
  
  return properties.filter(property => {
    if (!property.bedrooms) return false;
    
    const bedroomCount = parseInt(property.bedrooms);
    const filterCount = bedroomsFilter === '5+' ? 5 : parseInt(bedroomsFilter);
    
    if (bedroomsFilter === '5+') {
      return bedroomCount >= 5;
    }
    
    return bedroomCount === filterCount;
  });
};

/**
 * Filters properties based on selected features
 */
export const filterByFeatures = (
  properties: Property[],
  selectedFeatures: string[]
): Property[] => {
  if (selectedFeatures.length === 0) return properties;
  
  return properties.filter(property => 
    selectedFeatures.every(feature => 
      property.features && property.features.includes(feature)
    )
  );
};

/**
 * Apply all filters to properties
 */
export const applyAllFilters = (
  properties: Property[],
  filters: {
    searchQuery: string;
    propertyType: string;
    location: string;
    priceRange: [number, number];
    bedroomsFilter: string;
    selectedFeatures: string[];
  }
): Property[] => {
  let result = [...properties];
  
  result = filterBySearchQuery(result, filters.searchQuery);
  result = filterByPropertyType(result, filters.propertyType);
  result = filterByLocation(result, filters.location);
  result = filterByPriceRange(result, filters.priceRange);
  result = filterByBedrooms(result, filters.bedroomsFilter);
  result = filterByFeatures(result, filters.selectedFeatures);
  
  return result;
};
