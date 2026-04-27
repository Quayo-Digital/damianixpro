export interface Vendor {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  responseTime: string;
  active: boolean;
  specialties: string[];
}

export interface VendorJob {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  property: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  completedDate?: string;
  cost?: number;
  rating?: number;
  feedback?: string;
}

// Sample data for testing
export const mockVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Reliable Plumbing Services',
    category: 'Plumbing',
    email: 'contact@reliableplumbing.com',
    phone: '+234 801 234 5678',
    address: '25 Adebayo Street, Lagos',
    rating: 4.8,
    totalJobs: 47,
    completedJobs: 45,
    responseTime: 'Under 2 hours',
    active: true,
    specialties: ['Emergency repairs', 'Installation', 'Maintenance'],
  },
  {
    id: 'v2',
    name: 'Sunshine Electrical',
    category: 'Electrical',
    email: 'info@sunshineelectric.com',
    phone: '+234 802 345 6789',
    address: '14 Opebi Road, Lagos',
    rating: 4.5,
    totalJobs: 32,
    completedJobs: 30,
    responseTime: 'Same day',
    active: true,
    specialties: ['Wiring', 'Lighting', 'Electrical safety'],
  },
  {
    id: 'v3',
    name: 'QuickFix HVAC',
    category: 'HVAC',
    email: 'service@quickfixhvac.com',
    phone: '+234 803 456 7890',
    address: '7 Gbagada Expressway, Lagos',
    rating: 4.7,
    totalJobs: 28,
    completedJobs: 27,
    responseTime: 'Under 3 hours',
    active: true,
    specialties: ['AC repair', 'Installation', 'Maintenance'],
  },
  {
    id: 'v4',
    name: 'Secure Locks & Gates',
    category: 'Security',
    email: 'info@securelocks.com',
    phone: '+234 805 567 8901',
    address: '45 Allen Avenue, Lagos',
    rating: 4.6,
    totalJobs: 19,
    completedJobs: 19,
    responseTime: 'Same day',
    active: true,
    specialties: ['Lock installation', 'Security systems', 'Gate automation'],
  },
];

export const mockVendorJobs: VendorJob[] = [
  {
    id: 'j1',
    vendorId: 'v1',
    title: 'Bathroom Sink Repair',
    description: 'Fix leaking sink in Unit 7',
    property: 'Palm View Apartments, Unit 7',
    status: 'completed',
    scheduledDate: '2025-04-05T10:00:00',
    completedDate: '2025-04-05T11:30:00',
    cost: 15000,
    rating: 5,
    feedback: 'Excellent service, arrived on time and fixed the issue quickly.',
  },
  {
    id: 'j2',
    vendorId: 'v2',
    title: 'Light Fixture Replacement',
    description: 'Replace broken kitchen light fixture',
    property: 'Sunlight Residences, Unit 4B',
    status: 'scheduled',
    scheduledDate: '2025-05-12T14:00:00',
  },
  {
    id: 'j3',
    vendorId: 'v3',
    title: 'AC System Maintenance',
    description: 'Routine maintenance check for all AC units',
    property: 'Green Acres, Multiple Units',
    status: 'in-progress',
    scheduledDate: '2025-05-08T09:00:00',
  },
  {
    id: 'j4',
    vendorId: 'v1',
    title: 'Kitchen Sink Installation',
    description: 'Install new sink in renovated kitchen',
    property: 'Victoria Garden Estate, Unit 12',
    status: 'scheduled',
    scheduledDate: '2025-05-15T11:00:00',
  },
];
