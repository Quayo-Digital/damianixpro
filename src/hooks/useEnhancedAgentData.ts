import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

interface AgentLead {
  id: string;
  agent_id: string;
  property_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  lead_source: 'website' | 'referral' | 'social_media' | 'cold_call' | 'walk_in' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'viewing_scheduled' | 'offer_made' | 'negotiating' | 'closed_won' | 'closed_lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  property_type?: string;
  bedrooms?: number;
  notes?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  conversion_probability?: number;
  estimated_commission?: number;
  actual_commission?: number;
  closed_date?: string;
  created_at: string;
  updated_at: string;
}

interface AgentProperty {
  id: string;
  agent_id: string;
  title: string;
  type: string;
  status: 'available' | 'under_offer' | 'sold' | 'rented' | 'off_market';
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm?: number;
  listing_date: string;
  views_count: number;
  inquiries_count: number;
  viewings_count: number;
  commission_rate: number;
  estimated_commission: number;
  actual_commission?: number;
  days_on_market: number;
  created_at: string;
  updated_at: string;
}

interface AgentClient {
  id: string;
  agent_id: string;
  name: string;
  email: string;
  phone: string;
  client_type: 'buyer' | 'seller' | 'landlord' | 'tenant';
  status: 'active' | 'inactive' | 'converted';
  budget_range?: string;
  preferred_locations: string[];
  property_preferences?: string;
  communication_preference: 'email' | 'phone' | 'whatsapp' | 'sms';
  last_interaction_date?: string;
  total_transactions: number;
  total_commission_generated: number;
  satisfaction_rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AgentStats {
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalProperties: number;
  activeListings: number;
  propertiesSold: number;
  propertiesRented: number;
  totalCommission: number;
  monthlyCommission: number;
  averageDaysOnMarket: number;
  clientSatisfactionScore: number;
  totalClients: number;
  activeClients: number;
  averageTransactionValue: number;
}

interface AgentPerformanceMetrics {
  leadGeneration: {
    thisMonth: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'stable';
    conversionRate: number;
    averageLeadValue: number;
  };
  salesPerformance: {
    propertiesSold: number;
    propertiesRented: number;
    totalVolume: number;
    averagePrice: number;
    marketShare: number;
  };
  commissionAnalytics: {
    totalEarnings: number;
    monthlyEarnings: number;
    projectedAnnual: number;
    averageCommission: number;
    topPerformingCategory: string;
  };
  clientMetrics: {
    totalClients: number;
    activeClients: number;
    clientRetentionRate: number;
    averageSatisfactionScore: number;
    referralRate: number;
  };
  marketIntelligence: {
    averageDaysOnMarket: number;
    priceAccuracy: number;
    marketTrends: Array<{
      area: string;
      averagePrice: number;
      priceChange: number;
      demandLevel: 'low' | 'medium' | 'high';
    }>;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedDate: string;
    type: 'sales' | 'client_service' | 'market_knowledge' | 'leadership';
  }>;
}

interface AgentProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  years_experience: number;
  specialization: string;
  areas_served: string[];
  languages: string[];
  commission_rate: number;
  total_sales: number;
  total_listings: number;
  active_clients: number;
  average_rating: number;
  total_reviews: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export const useEnhancedAgentData = () => {
  const { user } = useAuth();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [leads, setLeads] = useState<AgentLead[]>([]);
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [clients, setClients] = useState<AgentClient[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<AgentPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development/testing
  const getMockProfile = (userId: string): AgentProfile => ({
    id: 'mock-agent-1',
    user_id: userId,
    name: 'Adebayo Johnson',
    email: user?.email || 'agent@example.com',
    phone: '+234 801 234 5678',
    specialization: 'Residential Sales',
    license_number: 'RE-2024-001',
    years_experience: 5,
    languages: ['English', 'Yoruba', 'Hausa'],
    areas_served: ['Lagos Island', 'Victoria Island', 'Lekki', 'Ikoyi'],
    commission_rate: 5.0,
    total_sales: 45,
    total_listings: 12,
    active_clients: 8,
    average_rating: 4.8,
    total_reviews: 127,
    verified: true,
    created_at: '2023-03-15T10:00:00Z',
    updated_at: '2024-08-08T11:20:00Z'
  });

  const getMockLeads = (): AgentLead[] => [
    {
      id: 'lead-1',
      agent_id: 'mock-agent-1',
      property_id: 'prop-1',
      client_name: 'Mrs. Funmi Adebayo',
      client_email: 'funmi.adebayo@email.com',
      client_phone: '+234 803 456 7890',
      lead_source: 'website',
      status: 'viewing_scheduled',
      priority: 'high',
      budget_min: 80000000,
      budget_max: 120000000,
      preferred_location: 'Lekki Phase 1',
      property_type: '4-bedroom duplex',
      bedrooms: 4,
      notes: 'Looking for family home, prefers gated community',
      last_contact_date: '2024-08-07T14:30:00Z',
      next_follow_up_date: '2024-08-09T10:00:00Z',
      conversion_probability: 75,
      estimated_commission: 5000000,
      created_at: '2024-08-05T09:15:00Z',
      updated_at: '2024-08-07T14:30:00Z'
    },
    {
      id: 'lead-2',
      agent_id: 'mock-agent-1',
      client_name: 'Mr. Chidi Okafor',
      client_email: 'chidi.okafor@business.com',
      client_phone: '+234 807 123 4567',
      lead_source: 'referral',
      status: 'qualified',
      priority: 'medium',
      budget_min: 45000000,
      budget_max: 65000000,
      preferred_location: 'Victoria Island',
      property_type: '3-bedroom apartment',
      bedrooms: 3,
      notes: 'Investment property, cash buyer',
      last_contact_date: '2024-08-06T16:45:00Z',
      next_follow_up_date: '2024-08-10T11:30:00Z',
      conversion_probability: 60,
      estimated_commission: 2750000,
      created_at: '2024-08-03T11:20:00Z',
      updated_at: '2024-08-06T16:45:00Z'
    },
    {
      id: 'lead-3',
      agent_id: 'mock-agent-1',
      client_name: 'Dr. Amina Hassan',
      client_email: 'amina.hassan@hospital.ng',
      client_phone: '+234 809 876 5432',
      lead_source: 'social_media',
      status: 'new',
      priority: 'medium',
      budget_min: 25000000,
      budget_max: 40000000,
      preferred_location: 'Ikeja GRA',
      property_type: '2-bedroom apartment',
      bedrooms: 2,
      notes: 'First-time buyer, needs financing assistance',
      conversion_probability: 40,
      estimated_commission: 1625000,
      created_at: '2024-08-08T08:30:00Z',
      updated_at: '2024-08-08T08:30:00Z'
    }
  ];

  const getMockProperties = (): AgentProperty[] => [
    {
      id: 'prop-1',
      agent_id: 'mock-agent-1',
      title: 'Luxury 4-Bedroom Duplex in Lekki Phase 1',
      type: 'duplex',
      status: 'available',
      price: 95000000,
      location: 'Lekki Phase 1, Lagos',
      bedrooms: 4,
      bathrooms: 5,
      area_sqm: 350,
      listing_date: '2024-07-15T00:00:00Z',
      views_count: 245,
      inquiries_count: 18,
      viewings_count: 12,
      commission_rate: 5.0,
      estimated_commission: 4750000,
      days_on_market: 24,
      created_at: '2024-07-15T10:00:00Z',
      updated_at: '2024-08-08T11:20:00Z'
    },
    {
      id: 'prop-2',
      agent_id: 'mock-agent-1',
      title: 'Modern 3-Bedroom Apartment in Victoria Island',
      type: 'apartment',
      status: 'under_offer',
      price: 55000000,
      location: 'Victoria Island, Lagos',
      bedrooms: 3,
      bathrooms: 3,
      area_sqm: 180,
      listing_date: '2024-07-28T00:00:00Z',
      views_count: 189,
      inquiries_count: 22,
      viewings_count: 15,
      commission_rate: 5.0,
      estimated_commission: 2750000,
      days_on_market: 11,
      created_at: '2024-07-28T14:30:00Z',
      updated_at: '2024-08-08T11:20:00Z'
    },
    {
      id: 'prop-3',
      agent_id: 'mock-agent-1',
      title: 'Executive 5-Bedroom House in Ikoyi',
      type: 'house',
      status: 'sold',
      price: 180000000,
      location: 'Ikoyi, Lagos',
      bedrooms: 5,
      bathrooms: 6,
      area_sqm: 450,
      listing_date: '2024-06-10T00:00:00Z',
      views_count: 312,
      inquiries_count: 28,
      viewings_count: 19,
      commission_rate: 5.0,
      estimated_commission: 9000000,
      actual_commission: 9000000,
      days_on_market: 45,
      created_at: '2024-06-10T09:00:00Z',
      updated_at: '2024-07-25T16:45:00Z'
    }
  ];

  const getMockClients = (): AgentClient[] => [
    {
      id: 'client-1',
      agent_id: 'mock-agent-1',
      name: 'Mrs. Funmi Adebayo',
      email: 'funmi.adebayo@email.com',
      phone: '+234 803 456 7890',
      client_type: 'buyer',
      status: 'active',
      budget_range: '₦80M - ₦120M',
      preferred_locations: ['Lekki Phase 1', 'Lekki Phase 2', 'Ajah'],
      property_preferences: '4-bedroom duplex, gated community, family-friendly',
      communication_preference: 'phone',
      last_interaction_date: '2024-08-07T14:30:00Z',
      total_transactions: 0,
      total_commission_generated: 0,
      satisfaction_rating: 4.5,
      notes: 'Very responsive, serious buyer, has financing pre-approval',
      created_at: '2024-08-05T09:15:00Z',
      updated_at: '2024-08-07T14:30:00Z'
    },
    {
      id: 'client-2',
      agent_id: 'mock-agent-1',
      name: 'Chief Emeka Okonkwo',
      email: 'emeka.okonkwo@business.ng',
      phone: '+234 802 123 4567',
      client_type: 'seller',
      status: 'converted',
      preferred_locations: ['Ikoyi', 'Victoria Island'],
      property_preferences: 'Luxury properties, waterfront preferred',
      communication_preference: 'email',
      last_interaction_date: '2024-07-25T16:45:00Z',
      total_transactions: 1,
      total_commission_generated: 9000000,
      satisfaction_rating: 5.0,
      notes: 'Sold 5-bedroom house in Ikoyi, excellent client relationship',
      created_at: '2024-06-10T09:00:00Z',
      updated_at: '2024-07-25T16:45:00Z'
    }
  ];

  const calculateStats = (
    leadsData: AgentLead[], 
    propertiesData: AgentProperty[], 
    clientsData: AgentClient[]
  ): AgentStats => {
    const totalLeads = leadsData.length;
    const activeLeads = leadsData.filter(lead => 
      ['new', 'contacted', 'qualified', 'viewing_scheduled', 'offer_made', 'negotiating'].includes(lead.status)
    ).length;
    const convertedLeads = leadsData.filter(lead => lead.status === 'closed_won').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const totalProperties = propertiesData.length;
    const activeListings = propertiesData.filter(prop => prop.status === 'available').length;
    const propertiesSold = propertiesData.filter(prop => prop.status === 'sold').length;
    const propertiesRented = propertiesData.filter(prop => prop.status === 'rented').length;

    const totalCommission = propertiesData
      .filter(prop => prop.actual_commission)
      .reduce((sum, prop) => sum + (prop.actual_commission || 0), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCommission = propertiesData
      .filter(prop => {
        if (!prop.actual_commission) return false;
        const updatedDate = new Date(prop.updated_at);
        return updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear;
      })
      .reduce((sum, prop) => sum + (prop.actual_commission || 0), 0);

    const averageDaysOnMarket = propertiesData.length > 0 
      ? propertiesData.reduce((sum, prop) => sum + prop.days_on_market, 0) / propertiesData.length 
      : 0;

    const clientSatisfactionScore = clientsData.length > 0
      ? clientsData
          .filter(client => client.satisfaction_rating)
          .reduce((sum, client) => sum + (client.satisfaction_rating || 0), 0) / 
        clientsData.filter(client => client.satisfaction_rating).length
      : 0;

    const totalClients = clientsData.length;
    const activeClients = clientsData.filter(client => client.status === 'active').length;

    const averageTransactionValue = propertiesData.length > 0
      ? propertiesData.reduce((sum, prop) => sum + prop.price, 0) / propertiesData.length
      : 0;

    return {
      totalLeads,
      activeLeads,
      convertedLeads,
      conversionRate,
      totalProperties,
      activeListings,
      propertiesSold,
      propertiesRented,
      totalCommission,
      monthlyCommission,
      averageDaysOnMarket,
      clientSatisfactionScore,
      totalClients,
      activeClients,
      averageTransactionValue
    };
  };

  const calculatePerformanceMetrics = (
    leadsData: AgentLead[],
    propertiesData: AgentProperty[],
    clientsData: AgentClient[],
    currentStats: AgentStats
  ): AgentPerformanceMetrics => {
    // Calculate real achievements based on actual data
    const achievements = [];
    
    // Sales achievement
    if (currentStats.propertiesSold > 0) {
      achievements.push({
        id: '1',
        title: 'Sales Success',
        description: `Sold ${currentStats.propertiesSold} propert${currentStats.propertiesSold === 1 ? 'y' : 'ies'}`,
        icon: '🏆',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'sales' as const
      });
    }
    
    // Client satisfaction achievement
    if (currentStats.clientSatisfactionScore >= 4.0) {
      achievements.push({
        id: '2',
        title: 'Client Champion',
        description: `Maintained ${currentStats.clientSatisfactionScore.toFixed(1)} client satisfaction rating`,
        icon: '⭐',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'client_service' as const
      });
    }
    
    // Lead conversion achievement
    if (currentStats.conversionRate > 20) {
      achievements.push({
        id: '3',
        title: 'Lead Converter',
        description: `Achieving ${currentStats.conversionRate.toFixed(1)}% conversion rate`,
        icon: '📊',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'lead_generation' as const
      });
    }
    
    // Active agent achievement
    if (currentStats.totalLeads > 0) {
      achievements.push({
        id: '4',
        title: 'Active Agent',
        description: `Managing ${currentStats.totalLeads} lead${currentStats.totalLeads === 1 ? '' : 's'}`,
        icon: '💼',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'activity' as const
      });
    }

    return {
      leadGeneration: {
        thisMonth: leadsData.filter(lead => {
          const createdDate = new Date(lead.created_at);
          const currentMonth = new Date().getMonth();
          return createdDate.getMonth() === currentMonth;
        }).length,
        lastMonth: Math.max(0, Math.floor(currentStats.totalLeads * 0.8)),
        trend: 'up',
        conversionRate: currentStats.conversionRate,
        averageLeadValue: currentStats.totalLeads > 0 
          ? leadsData.reduce((sum, lead) => sum + (lead.estimated_commission || 0), 0) / currentStats.totalLeads
          : 0
      },
      salesPerformance: {
        propertiesSold: currentStats.propertiesSold,
        propertiesRented: currentStats.propertiesRented,
        totalVolume: propertiesData.reduce((sum, prop) => sum + prop.price, 0),
        averagePrice: currentStats.averageTransactionValue,
        marketShare: currentStats.propertiesSold > 0 ? Math.min(100, (currentStats.propertiesSold / 10) * 100) : 0
      },
      commissionAnalytics: {
        totalEarnings: currentStats.totalCommission,
        monthlyEarnings: currentStats.monthlyCommission,
        projectedAnnual: currentStats.monthlyCommission * 12,
        averageCommission: currentStats.propertiesSold > 0 
          ? currentStats.totalCommission / currentStats.propertiesSold 
          : 0,
        topPerformingCategory: propertiesData.length > 0 ? 
          (() => {
            const counts = propertiesData.reduce((acc, prop) => {
              acc[prop.type] = (acc[prop.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            return Object.entries(counts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Residential';
          })()
          : 'Residential'
      },
      clientMetrics: {
        totalClients: currentStats.totalClients,
        activeClients: currentStats.activeClients,
        clientRetentionRate: clientsData.length > 0 ? 
          Math.round((clientsData.filter(c => c.status === 'active').length / clientsData.length) * 100) : 0,
        averageSatisfactionScore: currentStats.clientSatisfactionScore,
        referralRate: leadsData.length > 0 ? 
          Math.round((leadsData.filter(l => l.source === 'referral').length / leadsData.length) * 100) : 0
      },
      marketIntelligence: {
        averageDaysOnMarket: currentStats.averageDaysOnMarket,
        priceAccuracy: propertiesData.length > 0 ? 
          Math.round((propertiesData.filter(p => p.status === 'sold').length / propertiesData.length) * 100) : 0,
        marketTrends: propertiesData.length > 0 ? 
          [...new Set(propertiesData.map(p => p.location))].map(location => {
            const locationProperties = propertiesData.filter(p => p.location === location);
            const avgPrice = locationProperties.reduce((sum, p) => sum + p.price, 0) / locationProperties.length;
            const soldCount = locationProperties.filter(p => p.status === 'sold').length;
            return {
              area: location,
              averagePrice: Math.round(avgPrice),
              priceChange: Math.round((avgPrice / 100000000) * 10), // Estimate based on price levels
              demandLevel: soldCount > locationProperties.length * 0.7 ? 'high' as const : 
                          soldCount > locationProperties.length * 0.4 ? 'medium' as const : 'low' as const
            };
          }) : [
            {
              area: 'Lagos',
              averagePrice: 0,
              priceChange: 0,
              demandLevel: 'low' as const
            }
          ]
      },
      achievements
    };
  };

  const updateLeadStatus = async (leadId: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'closed_won') {
        updates.closed_date = new Date().toISOString();
      }

      // In a real implementation, this would update the database
      // For now, update local state
      const updatedLeads = leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: status as any, closed_date: updates.closed_date, notes }
          : lead
      );
      setLeads(updatedLeads);
      setStats(calculateStats(updatedLeads, properties, clients));
    } catch (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  };

  const addNewLead = async (leadData: Partial<AgentLead>) => {
    try {
      const newLead: AgentLead = {
        id: `lead-${Date.now()}`,
        agent_id: agentProfile?.id || 'mock-agent-1',
        client_name: leadData.client_name || '',
        client_email: leadData.client_email || '',
        client_phone: leadData.client_phone || '',
        lead_source: leadData.lead_source || 'other',
        status: 'new',
        priority: leadData.priority || 'medium',
        budget_min: leadData.budget_min,
        budget_max: leadData.budget_max,
        preferred_location: leadData.preferred_location,
        property_type: leadData.property_type,
        bedrooms: leadData.bedrooms,
        notes: leadData.notes,
        conversion_probability: 30, // Default for new leads
        estimated_commission: ((leadData.budget_max || 0) * 0.05), // 5% commission estimate
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...leadData
      };

      const updatedLeads = [...leads, newLead];
      setLeads(updatedLeads);
      setStats(calculateStats(updatedLeads, properties, clients));
    } catch (error) {
      console.error('Error adding new lead:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch real user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Error fetching profile:', profileError);
        }

        // Fetch agent's properties (simplified query for existing schema)
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('agent_id', user.id);

        if (propertiesError) {
          console.warn('Error fetching properties:', propertiesError);
        }

        // Create personalized profile using real user data with multiple fallbacks
        const realProfile: AgentProfile = {
          id: user.id,
          user_id: user.id,
          name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Real Estate Agent',
          email: user.email || '',
          phone: profileData?.phone || user.user_metadata?.phone || '',
          license_number: profileData?.license_number || user.user_metadata?.license_number || '',
          years_experience: profileData?.years_experience || 1,
          specialization: profileData?.specialization || 'Residential',
          areas_served: profileData?.areas_served || ['Lagos'],
          languages: profileData?.languages || ['English'],
          commission_rate: profileData?.commission_rate || 5.0,
          total_sales: 0,
          total_listings: propertiesData?.length || 0,
          active_clients: 0,
          average_rating: 0.0,
          total_reviews: 0,
          verified: false,
          created_at: profileData?.created_at || new Date().toISOString(),
          updated_at: profileData?.updated_at || new Date().toISOString()
        };

        // Transform real properties data if available
        const realProperties: AgentProperty[] = propertiesData?.map(prop => ({
          id: prop.id,
          agent_id: user.id,
          title: prop.name || 'Property',
          type: 'apartment',
          status: 'available' as const,
          price: parseFloat(String(prop.price)) || 0,
          location: prop.address || 'Lagos',
          bedrooms: parseInt(String(prop.bedrooms)) || 0,
          bathrooms: parseInt(String(prop.bathrooms)) || 0,
          area_sqm: parseInt(String(prop.squareFeet)) || 0,
          listing_date: prop.created_at,
          views_count: 0,
          inquiries_count: 0,
          viewings_count: 0,
          commission_rate: 5.0,
          estimated_commission: (parseFloat(String(prop.price)) || 0) * 0.05,
          days_on_market: Math.floor((new Date().getTime() - new Date(prop.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          created_at: prop.created_at,
          updated_at: prop.updated_at
        })) || [];

        // For now, no real leads data available from existing schema
        const realLeads: AgentLead[] = [];

        // Always use real profile data
        setAgentProfile(realProfile);
        
        // Always use real data (empty arrays if no data exists)
        setProperties(realProperties);
        setLeads(realLeads); // Empty for now until leads schema is implemented
        setClients([]); // Empty for now until clients schema is implemented
        
        console.log('Agent real data loaded:', {
          properties: realProperties.length,
          leads: realLeads.length,
          profile: realProfile.name
        });

        // Calculate statistics and performance metrics using real data only
        const dataToUse = {
          properties: realProperties,
          leads: realLeads,
          clients: [] as AgentClient[]
        };

        const calculatedStats = calculateStats(
          dataToUse.leads,
          dataToUse.properties,
          dataToUse.clients
        );
        setStats(calculatedStats);

        const metrics = calculatePerformanceMetrics(
          dataToUse.leads,
          dataToUse.properties,
          dataToUse.clients,
          calculatedStats
        );
        setPerformanceMetrics(metrics);

      } catch (err: any) {
        console.error('Error fetching agent data:', err);
        setError(err.message || 'An error occurred while fetching agent data');
        
        // Fallback to mock data on error
        const mockProfile = getMockProfile(user?.id || '');
        const mockLeads = getMockLeads();
        const mockProperties = getMockProperties();
        const mockClients = getMockClients();

        setAgentProfile(mockProfile);
        setLeads(mockLeads);
        setProperties(mockProperties);
        setClients(mockClients);

        const calculatedStats = calculateStats(mockLeads, mockProperties, mockClients);
        setStats(calculatedStats);

        const metrics = calculatePerformanceMetrics(mockLeads, mockProperties, mockClients, calculatedStats);
        setPerformanceMetrics(metrics);
        
        toast.error('Failed to load agent dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, [user]);

  return {
    agentProfile,
    leads,
    properties,
    clients,
    stats,
    performanceMetrics,
    isLoading,
    error,
    updateLeadStatus,
    addNewLead
  };
};

export type { AgentLead, AgentProperty, AgentClient, AgentStats, AgentPerformanceMetrics };
