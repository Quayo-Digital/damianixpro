import { Property } from '@/services/property/types';

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/[^\d.]/g, '');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const getPropertyNumericPrice = (property: Property): number | null => {
  // Prefer the legacy `price` field used widely in UI, then fall back
  // to structured sale/lease values when present.
  const fromPrice = toFiniteNumber(property.price);
  if (fromPrice !== null) return fromPrice;

  const fromSale = toFiniteNumber(property.sale_price);
  if (fromSale !== null) return fromSale;

  const fromLease = toFiniteNumber(property.lease_price);
  if (fromLease !== null) return fromLease;

  return null;
};

/**
 * Filters properties based on search query
 */
export const filterBySearchQuery = (properties: Property[], searchQuery: string): Property[] => {
  if (!searchQuery) return properties;

  const query = searchQuery.toLowerCase();
  return properties.filter(
    (property) =>
      property.name.toLowerCase().includes(query) ||
      property.location.toLowerCase().includes(query) ||
      property.description?.toLowerCase().includes(query)
  );
};

/**
 * Filters properties based on property type
 */
export const filterByPropertyType = (properties: Property[], propertyType: string): Property[] => {
  if (propertyType === 'all') return properties;
  return properties.filter((property) => property.type === propertyType);
};

/**
 * Filters properties based on transaction type (SALE | LEASE)
 */
export const filterByTransactionType = (
  properties: Property[],
  transactionType: string
): Property[] => {
  if (transactionType === 'all') return properties;

  const normalized = transactionType.toUpperCase();
  return properties.filter((property) => {
    const propertyTransaction = property.transaction_type?.toUpperCase?.() || 'LEASE';
    return propertyTransaction === normalized;
  });
};

/**
 * Filters properties based on location
 */
export const filterByLocation = (properties: Property[], location: string): Property[] => {
  if (location === 'all') return properties;
  return properties.filter((property) => property.location === location);
};

/**
 * Filters properties based on price range
 */
export const filterByPriceRange = (
  properties: Property[],
  priceRange: [number, number]
): Property[] => {
  return properties.filter((property) => {
    const numericPrice = getPropertyNumericPrice(property);
    // If a listing has no parseable price, don't hide it from public browsing.
    if (numericPrice === null) return true;
    return numericPrice >= priceRange[0] && numericPrice <= priceRange[1];
  });
};

/**
 * Filters properties based on number of bedrooms
 */
export const filterByBedrooms = (properties: Property[], bedroomsFilter: string): Property[] => {
  if (bedroomsFilter === 'any') return properties;

  return properties.filter((property) => {
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

  return properties.filter((property) =>
    selectedFeatures.every((feature) => property.features && property.features.includes(feature))
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
    transactionType: string;
    location: string;
    priceRange: [number, number];
    bedroomsFilter: string;
    selectedFeatures: string[];
  }
): Property[] => {
  let result = [...properties];

  result = filterBySearchQuery(result, filters.searchQuery);
  result = filterByTransactionType(result, filters.transactionType);
  result = filterByPropertyType(result, filters.propertyType);
  result = filterByLocation(result, filters.location);
  result = filterByPriceRange(result, filters.priceRange);
  result = filterByBedrooms(result, filters.bedroomsFilter);
  result = filterByFeatures(result, filters.selectedFeatures);

  // If all filters eliminate every property but we still have a base list (e.g. Abuja demo data),
  // fall back to the unfiltered list so the user always sees something.
  if (result.length === 0 && properties.length > 0) {
    return properties;
  }

  return result;
};
