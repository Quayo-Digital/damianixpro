/**
 * Demo Properties Data
 * Sample properties to display when database is empty or for development
 * Prices are annual rent (Nigeria standard)
 */

import type { Property } from '@/services/property/types';

export const demoProperties: Property[] = [
  {
    id: 'demo-prop-abuja-1',
    name: 'Office Space in Central Business District',
    address: '456 Business District, Wuse Zone II',
    location: 'Abuja',
    type: 'commercial',
    transaction_type: 'LEASE',
    property_category: 'COMMERCIAL',
    price: '₦10,200,000',
    squareFeet: '2200',
    bathrooms: '2',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop',
    ],
    description:
      "Prime office space in the heart of Abuja's business district. Recently renovated with modern infrastructure, high-speed internet connectivity, and private parking spaces for clients and staff.",
    features: ['Conference Room', 'Private Parking', '24/7 Power', 'Security', 'Reception Area'],
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    amenities: ['WiFi', 'Air Conditioning', 'Generator', 'Security'],
    leaseSummary: { totalUnits: 1, leasedUnits: 0, fullyLeased: false },
  },
  {
    id: 'demo-prop-abuja-2',
    name: 'Diplomatic Zone Villa — Maitama',
    address: '8 Diplomatic Drive, Maitama',
    location: 'Abuja',
    type: 'residential',
    transaction_type: 'LEASE',
    property_category: 'RESIDENTIAL',
    price: '₦11,400,000',
    bedrooms: '5',
    bathrooms: '4',
    squareFeet: '4500',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop',
    ],
    description:
      'Exclusive villa in diplomatic zone with private swimming pool and garden. Features spacious rooms, modern design, and premium finishes throughout. Ideal for diplomatic families or executives.',
    features: ['Private Pool', 'Garden', 'Security', '2-Car Garage', 'Staff Quarters'],
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    amenities: ['WiFi', 'Air Conditioning', 'Generator', 'Furnished', 'Garden'],
    leaseSummary: { totalUnits: 12, leasedUnits: 7, fullyLeased: false },
  },
  // All demo properties are now Abuja-focused only.
];
