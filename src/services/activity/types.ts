
// Define activity related types

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  date: string;
  amount?: string;
  property?: string;
  location?: string;
}

// Mock data kept for development fallback purposes
export const mockActivities = [
  { id: '1', type: 'Payment', description: 'Rent payment received from Chioma Okeke', date: '12 May 2025, 10:23 AM', amount: '₦750,000' },
  { id: '2', type: 'Maintenance', description: 'Maintenance request completed - Plumbing issue', date: '10 May 2025, 02:15 PM', property: '2 Bedroom Flat, Lekki' },
  { id: '3', type: 'Tenant', description: 'New tenant added - Emmanuel Okafor', date: '08 May 2025, 11:30 AM', property: 'Shop Space, Ikeja' },
  { id: '4', type: 'Property', description: 'Property added - 3 Bedroom Apartment', date: '05 May 2025, 03:45 PM', location: 'Ikoyi, Lagos' },
  { id: '5', type: 'Payment', description: 'Maintenance expense - AC Repair', date: '02 May 2025, 09:10 AM', amount: '₦85,000' },
  { id: '6', type: 'Tenant', description: 'Tenant contract renewed - Tunde Bello', date: '29 Apr 2025, 01:20 PM', property: 'Office Space, Victoria Island' },
  { id: '7', type: 'Payment', description: 'Rent payment received from Amina Ibrahim', date: '25 Apr 2025, 10:05 AM', amount: '₦950,000' },
  { id: '8', type: 'Maintenance', description: 'Maintenance request raised - Electrical issue', date: '22 Apr 2025, 04:30 PM', property: 'Office Space, Victoria Island' },
  { id: '9', type: 'Property', description: 'Property inspection completed', date: '20 Apr 2025, 11:00 AM', property: '2 Bedroom Flat, Lekki' },
  { id: '10', type: 'Payment', description: 'Property tax payment', date: '15 Apr 2025, 02:00 PM', amount: '₦250,000' },
];
