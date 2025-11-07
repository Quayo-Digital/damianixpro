import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

interface OwnerProperty {
  id: string;
  owner_id: string;
  title: string;
  type: 'apartment' | 'house' | 'duplex' | 'commercial' | 'land';
  status: 'occupied' | 'vacant' | 'maintenance' | 'marketing' | 'sold';
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  purchase_price: number;
  current_value: number;
  monthly_rent: number;
  annual_rent: number;
  occupancy_rate: number;
  tenant_count: number;
  maintenance_cost_ytd: number;
  total_revenue_ytd: number;
  net_income_ytd: number;
  roi_percentage: number;
  days_vacant_ytd: number;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  property_manager?: string;
  insurance_expiry?: string;
  created_at: string;
  updated_at: string;
}

interface OwnerTenant {
  id: string;
  owner_id: string;
  property_id: string;
  name: string;
  email: string;
  phone: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  deposit_amount: number;
  payment_status: 'current' | 'late' | 'overdue' | 'defaulted';
  days_overdue: number;
  total_paid_ytd: number;
  satisfaction_rating?: number;
  last_payment_date?: string;
  next_payment_due: string;
  lease_status: 'active' | 'expiring_soon' | 'expired' | 'terminated';
  maintenance_requests: number;
  complaints: number;
  property_title: string;
  created_at: string;
  updated_at: string;
}

interface OwnerFinance {
  id: string;
  owner_id: string;
  property_id?: string;
  transaction_type: 'income' | 'expense';
  category: 'rent' | 'maintenance' | 'insurance' | 'taxes' | 'utilities' | 'management_fees' | 'mortgage' | 'other';
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'mobile_money';
  reference_number?: string;
  tenant_id?: string;
  vendor_id?: string;
  recurring: boolean;
  recurring_frequency?: 'monthly' | 'quarterly' | 'annually';
  tax_deductible: boolean;
  created_at: string;
  updated_at: string;
}

interface OwnerStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  totalTenants: number;
  occupancyRate: number;
  totalPortfolioValue: number;
  monthlyRentIncome: number;
  annualRentIncome: number;
  totalExpensesYTD: number;
  netIncomeYTD: number;
  averageROI: number;
  totalMaintenanceRequests: number;
  pendingMaintenanceRequests: number;
  averageTenantSatisfaction: number;
  portfolioAppreciation: number;
  cashFlow: number;
  totalDepositsHeld: number;
}

interface OwnerPerformanceMetrics {
  portfolioOverview: {
    totalValue: number;
    monthlyIncome: number;
    annualIncome: number;
    netWorth: number;
    portfolioGrowth: number;
  };
  financialPerformance: {
    grossRentYield: number;
    netRentYield: number;
    capitalGrowth: number;
    totalReturn: number;
    cashOnCashReturn: number;
    operatingExpenseRatio: number;
  };
  propertyMetrics: {
    averageOccupancyRate: number;
    averageRentPerSqm: number;
    maintenanceCostRatio: number;
    tenantTurnoverRate: number;
    averageTenancyLength: number;
    propertyAppreciationRate: number;
  };
  tenantMetrics: {
    totalTenants: number;
    onTimePaymentRate: number;
    averageTenantSatisfaction: number;
    tenantRetentionRate: number;
    averageRentIncrease: number;
    collectionEfficiency: number;
  };
  marketIntelligence: {
    portfolioVsMarket: number;
    rentGrowthVsMarket: number;
    occupancyVsMarket: number;
    marketTrends: Array<{
      area: string;
      averageRent: number;
      rentGrowth: number;
      occupancyRate: number;
      marketActivity: 'low' | 'medium' | 'high';
    }>;
  };
  riskAnalysis: {
    concentrationRisk: number;
    tenantCreditRisk: number;
    maintenanceRisk: number;
    marketRisk: number;
    liquidityRisk: number;
    overallRiskScore: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedDate: string;
    type: 'financial' | 'operational' | 'tenant_relations' | 'portfolio_growth';
  }>;
}

export const useEnhancedOwnerData = () => {
  const { user } = useAuth();
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [tenants, setTenants] = useState<OwnerTenant[]>([]);
  const [finances, setFinances] = useState<OwnerFinance[]>([]);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<OwnerPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development/testing
  const getMockOwnerProfile = (userId: string) => ({
    id: 'mock-owner-1',
    user_id: userId,
    name: 'Chief Adebayo Ogundimu',
    email: user?.email || 'owner@example.com',
    phone: '+234 802 345 6789',
    business_name: 'Ogundimu Properties Ltd',
    business_registration: 'RC-1234567',
    tax_id: 'TIN-98765432',
    investment_strategy: 'Buy and Hold',
    portfolio_size: 'Medium (5-20 properties)',
    years_investing: 12,
    preferred_locations: ['Lagos Island', 'Victoria Island', 'Lekki', 'Ikoyi', 'Abuja FCT'],
    total_properties: 8,
    total_portfolio_value: 1850000000, // ₦1.85B
    monthly_income: 15500000, // ₦15.5M
    average_roi: 18.5,
    verified: true,
    created_at: '2020-01-15T10:00:00Z',
    updated_at: '2024-08-08T11:55:00Z'
  });

  const getMockProperties = (): OwnerProperty[] => [
    {
      id: 'prop-1',
      owner_id: 'mock-owner-1',
      title: 'Luxury 4-Bedroom Duplex - Lekki Phase 1',
      type: 'duplex',
      status: 'occupied',
      address: '15 Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      bedrooms: 4,
      bathrooms: 5,
      area_sqm: 350,
      purchase_price: 180000000,
      current_value: 220000000,
      monthly_rent: 2800000,
      annual_rent: 33600000,
      occupancy_rate: 100,
      tenant_count: 1,
      maintenance_cost_ytd: 1200000,
      total_revenue_ytd: 22400000,
      net_income_ytd: 21200000,
      roi_percentage: 15.3,
      days_vacant_ytd: 0,
      last_maintenance_date: '2024-06-15T00:00:00Z',
      next_maintenance_due: '2024-12-15T00:00:00Z',
      property_manager: 'Lagos Property Management',
      insurance_expiry: '2025-03-30T00:00:00Z',
      created_at: '2020-01-15T10:00:00Z',
      updated_at: '2024-08-08T11:55:00Z'
    },
    {
      id: 'prop-2',
      owner_id: 'mock-owner-1',
      title: 'Modern 3-Bedroom Apartment - Victoria Island',
      type: 'apartment',
      status: 'occupied',
      address: '42 Akin Adesola Street, Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      bedrooms: 3,
      bathrooms: 3,
      area_sqm: 180,
      purchase_price: 120000000,
      current_value: 145000000,
      monthly_rent: 1800000,
      annual_rent: 21600000,
      occupancy_rate: 100,
      tenant_count: 1,
      maintenance_cost_ytd: 800000,
      total_revenue_ytd: 14400000,
      net_income_ytd: 13600000,
      roi_percentage: 18.0,
      days_vacant_ytd: 0,
      last_maintenance_date: '2024-07-20T00:00:00Z',
      property_manager: 'VI Property Services',
      insurance_expiry: '2025-01-15T00:00:00Z',
      created_at: '2021-03-10T10:00:00Z',
      updated_at: '2024-08-08T11:55:00Z'
    },
    {
      id: 'prop-3',
      owner_id: 'mock-owner-1',
      title: 'Executive 5-Bedroom House - Ikoyi',
      type: 'house',
      status: 'vacant',
      address: '28 Bourdillon Road, Ikoyi',
      city: 'Lagos',
      state: 'Lagos',
      bedrooms: 5,
      bathrooms: 6,
      area_sqm: 450,
      purchase_price: 350000000,
      current_value: 420000000,
      monthly_rent: 4500000,
      annual_rent: 54000000,
      occupancy_rate: 0,
      tenant_count: 0,
      maintenance_cost_ytd: 2500000,
      total_revenue_ytd: 27000000,
      net_income_ytd: 24500000,
      roi_percentage: 12.8,
      days_vacant_ytd: 60,
      last_maintenance_date: '2024-07-01T00:00:00Z',
      next_maintenance_due: '2024-09-01T00:00:00Z',
      property_manager: 'Elite Property Management',
      insurance_expiry: '2025-06-30T00:00:00Z',
      created_at: '2019-08-20T10:00:00Z',
      updated_at: '2024-08-08T11:55:00Z'
    }
  ];

  const getMockTenants = (): OwnerTenant[] => [
    {
      id: 'tenant-1',
      owner_id: 'mock-owner-1',
      property_id: 'prop-1',
      name: 'Dr. Funmi Adebayo',
      email: 'funmi.adebayo@hospital.ng',
      phone: '+234 803 456 7890',
      lease_start: '2023-01-01T00:00:00Z',
      lease_end: '2025-12-31T00:00:00Z',
      monthly_rent: 2800000,
      deposit_amount: 5600000,
      payment_status: 'current',
      days_overdue: 0,
      total_paid_ytd: 22400000,
      satisfaction_rating: 4.8,
      last_payment_date: '2024-08-01T00:00:00Z',
      next_payment_due: '2024-09-01T00:00:00Z',
      lease_status: 'active',
      maintenance_requests: 3,
      complaints: 0,
      property_title: 'Luxury 4-Bedroom Duplex - Lekki Phase 1',
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2024-08-08T11:55:00Z'
    },
    {
      id: 'tenant-2',
      owner_id: 'mock-owner-1',
      property_id: 'prop-2',
      name: 'Mr. Chidi Okafor',
      email: 'chidi.okafor@business.com',
      phone: '+234 807 123 4567',
      lease_start: '2024-02-01T00:00:00Z',
      lease_end: '2026-01-31T00:00:00Z',
      monthly_rent: 1800000,
      deposit_amount: 3600000,
      payment_status: 'current',
      days_overdue: 0,
      total_paid_ytd: 12600000,
      satisfaction_rating: 4.5,
      last_payment_date: '2024-08-01T00:00:00Z',
      next_payment_due: '2024-09-01T00:00:00Z',
      lease_status: 'active',
      maintenance_requests: 1,
      complaints: 0,
      property_title: 'Modern 3-Bedroom Apartment - Victoria Island',
      created_at: '2024-02-01T10:00:00Z',
      updated_at: '2024-08-08T11:55:00Z'
    }
  ];

  const calculateStats = (
    propertiesData: OwnerProperty[],
    tenantsData: OwnerTenant[],
    financesData: OwnerFinance[]
  ): OwnerStats => {
    const totalProperties = propertiesData.length;
    const occupiedProperties = propertiesData.filter(p => p.status === 'occupied').length;
    const vacantProperties = propertiesData.filter(p => p.status === 'vacant').length;
    const totalTenants = tenantsData.length;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

    const totalPortfolioValue = propertiesData.reduce((sum, p) => sum + p.current_value, 0);
    const monthlyRentIncome = propertiesData.reduce((sum, p) => sum + (p.status === 'occupied' ? p.monthly_rent : 0), 0);
    const annualRentIncome = propertiesData.reduce((sum, p) => sum + p.annual_rent, 0);

    const totalExpensesYTD = financesData
      .filter(f => f.transaction_type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);

    const totalIncomeYTD = financesData
      .filter(f => f.transaction_type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);

    const netIncomeYTD = totalIncomeYTD - totalExpensesYTD;

    const averageROI = propertiesData.length > 0 
      ? propertiesData.reduce((sum, p) => sum + p.roi_percentage, 0) / propertiesData.length 
      : 0;

    const averageTenantSatisfaction = tenantsData.length > 0
      ? tenantsData
          .filter(t => t.satisfaction_rating)
          .reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0) / 
        tenantsData.filter(t => t.satisfaction_rating).length
      : 0;

    const portfolioAppreciation = propertiesData.length > 0
      ? propertiesData.reduce((sum, p) => sum + ((p.current_value - p.purchase_price) / p.purchase_price * 100), 0) / propertiesData.length
      : 0;

    const cashFlow = monthlyRentIncome - (totalExpensesYTD / 8);

    const totalDepositsHeld = tenantsData.reduce((sum, t) => sum + t.deposit_amount, 0);

    return {
      totalProperties,
      occupiedProperties,
      vacantProperties,
      totalTenants,
      occupancyRate,
      totalPortfolioValue,
      monthlyRentIncome,
      annualRentIncome,
      totalExpensesYTD,
      netIncomeYTD,
      averageROI,
      totalMaintenanceRequests: 5,
      pendingMaintenanceRequests: 2,
      averageTenantSatisfaction,
      portfolioAppreciation,
      cashFlow,
      totalDepositsHeld
    };
  };

  const calculatePerformanceMetrics = (
    propertiesData: OwnerProperty[],
    tenantsData: OwnerTenant[],
    currentStats: OwnerStats
  ): OwnerPerformanceMetrics => {
    // Calculate real achievements based on actual data
    const achievements = [];
    
    // Portfolio value achievement
    if (currentStats.totalPortfolioValue >= 100000000) { // ₦100M+
      achievements.push({
        id: '1',
        title: 'Portfolio Milestone',
        description: `Reached ₦${(currentStats.totalPortfolioValue / 1000000).toFixed(0)}M portfolio value`,
        icon: '🏆',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'portfolio_growth' as const
      });
    }
    
    // High occupancy achievement
    if (currentStats.occupancyRate >= 90) {
      achievements.push({
        id: '2',
        title: 'High Occupancy',
        description: `Maintained ${currentStats.occupancyRate}% occupancy rate`,
        icon: '📈',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'operational' as const
      });
    }
    
    // Property owner achievement (for having properties)
    if (propertiesData.length > 0) {
      achievements.push({
        id: '3',
        title: 'Property Owner',
        description: `Managing ${propertiesData.length} propert${propertiesData.length === 1 ? 'y' : 'ies'}`,
        icon: '🏠',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'portfolio_growth' as const
      });
    }
    
    // ROI achievement
    if (currentStats.averageROI > 10) {
      achievements.push({
        id: '4',
        title: 'Strong Returns',
        description: `Achieving ${currentStats.averageROI.toFixed(1)}% average ROI`,
        icon: '💰',
        earnedDate: new Date().toISOString().split('T')[0],
        type: 'financial' as const
      });
    }

    return {
      portfolioOverview: {
        totalValue: currentStats.totalPortfolioValue,
        monthlyIncome: currentStats.monthlyRentIncome,
        annualIncome: currentStats.annualRentIncome,
        netWorth: currentStats.totalPortfolioValue - (currentStats.totalPortfolioValue * 0.3),
        portfolioGrowth: currentStats.portfolioAppreciation
      },
      financialPerformance: {
        grossRentYield: (currentStats.annualRentIncome / currentStats.totalPortfolioValue) * 100,
        netRentYield: (currentStats.netIncomeYTD / currentStats.totalPortfolioValue) * 100,
        capitalGrowth: currentStats.portfolioAppreciation,
        totalReturn: currentStats.averageROI,
        cashOnCashReturn: (currentStats.cashFlow * 12 / (currentStats.totalPortfolioValue * 0.3)) * 100,
        operatingExpenseRatio: (currentStats.totalExpensesYTD / currentStats.annualRentIncome) * 100
      },
      propertyMetrics: {
        averageOccupancyRate: currentStats.occupancyRate,
        averageRentPerSqm: propertiesData.length > 0 
          ? propertiesData.reduce((sum, p) => sum + (p.monthly_rent / p.area_sqm), 0) / propertiesData.length 
          : 0,
        maintenanceCostRatio: (currentStats.totalExpensesYTD / currentStats.annualRentIncome) * 100,
        tenantTurnoverRate: tenantsData.length > 0 ? 
          Math.round((tenantsData.filter(t => t.lease_status === 'terminated').length / tenantsData.length) * 100) : 0,
        averageTenancyLength: tenantsData.length > 0 ? 
          Math.round(tenantsData.reduce((sum, t) => {
            const startDate = new Date(t.lease_start);
            const endDate = t.lease_status === 'active' ? new Date() : new Date(t.lease_end);
            return sum + ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          }, 0) / tenantsData.length) : 0,
        propertyAppreciationRate: currentStats.portfolioAppreciation
      },
      tenantMetrics: {
        totalTenants: currentStats.totalTenants,
        onTimePaymentRate: tenantsData.length > 0 ? 
          Math.round((tenantsData.filter(t => t.payment_status === 'current').length / tenantsData.length) * 100) : 0,
        averageTenantSatisfaction: currentStats.averageTenantSatisfaction,
        tenantRetentionRate: tenantsData.length > 0 ? 
          Math.round((tenantsData.filter(t => t.lease_status === 'active').length / tenantsData.length) * 100) : 0,
        averageRentIncrease: propertiesData.length > 0 ? 
          Math.round((propertiesData.reduce((sum, p) => sum + (p.annual_rent * 0.08), 0) / propertiesData.length) * 100) / 100 : 0,
        collectionEfficiency: tenantsData.length > 0 ? 
          Math.round((tenantsData.filter(t => t.payment_status !== 'overdue').length / tenantsData.length) * 100) : 0
      },
      marketIntelligence: {
        portfolioVsMarket: currentStats.averageROI > 0 ? currentStats.averageROI - 8.0 : 0, // Compare to 8% market average
        rentGrowthVsMarket: propertiesData.length > 0 ? 
          (propertiesData.reduce((sum, p) => sum + ((p.monthly_rent * 12 / p.purchase_price) * 100), 0) / propertiesData.length) - 6.0 : 0,
        occupancyVsMarket: currentStats.occupancyRate - 85, // Compare to 85% market average
        marketTrends: propertiesData.length > 0 ? 
          [...new Set(propertiesData.map(p => p.city))].map(city => {
            const cityProperties = propertiesData.filter(p => p.city === city);
            const avgRent = cityProperties.reduce((sum, p) => sum + (p.monthly_rent / p.area_sqm), 0) / cityProperties.length;
            const avgOccupancy = cityProperties.reduce((sum, p) => sum + p.occupancy_rate, 0) / cityProperties.length;
            return {
              area: city,
              averageRent: Math.round(avgRent),
              rentGrowth: Math.round((avgRent / 8000) * 100) / 10, // Estimate based on rent levels
              occupancyRate: Math.round(avgOccupancy),
              marketActivity: avgOccupancy > 90 ? 'high' as const : avgOccupancy > 75 ? 'medium' as const : 'low' as const
            };
          }) : [
            {
              area: 'Lagos',
              averageRent: 0,
              rentGrowth: 0,
              occupancyRate: 0,
              marketActivity: 'low' as const
            }
          ]
      },
      riskAnalysis: {
        concentrationRisk: propertiesData.length > 0 ? 
          Math.min(100, Math.round((1 / propertiesData.length) * 100)) : 100, // Higher risk with fewer properties
        tenantCreditRisk: tenantsData.length > 0 ? 
          Math.round((tenantsData.filter(t => t.payment_status === 'overdue').length / tenantsData.length) * 100) : 0,
        maintenanceRisk: propertiesData.length > 0 ? 
          Math.round((propertiesData.reduce((sum, p) => sum + (p.maintenance_cost_ytd / p.annual_rent), 0) / propertiesData.length) * 100) : 0,
        marketRisk: currentStats.occupancyRate < 80 ? 40 : currentStats.occupancyRate < 90 ? 25 : 15,
        liquidityRisk: propertiesData.length <= 1 ? 50 : propertiesData.length <= 3 ? 30 : 20,
        overallRiskScore: Math.round((
          (propertiesData.length > 0 ? Math.min(100, Math.round((1 / propertiesData.length) * 100)) : 100) * 0.3 +
          (tenantsData.length > 0 ? Math.round((tenantsData.filter(t => t.payment_status === 'overdue').length / tenantsData.length) * 100) : 0) * 0.2 +
          (currentStats.occupancyRate < 80 ? 40 : currentStats.occupancyRate < 90 ? 25 : 15) * 0.3 +
          (propertiesData.length <= 1 ? 50 : propertiesData.length <= 3 ? 30 : 20) * 0.2
        ))
      },
      achievements
    };
  };

  useEffect(() => {
    const fetchOwnerData = async () => {
      if (!user) {
        setLoading(false);
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

        // Fetch user's properties (simplified query for existing schema)
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id);

        if (propertiesError) {
          console.warn('Error fetching properties:', propertiesError);
        }

        // Create personalized profile using real user data
        // Try multiple name sources for better user experience
        const userName = profileData?.full_name || 
                        profileData?.name || 
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Property Owner';
        
        const realProfile = {
          id: user.id,
          user_id: user.id,
          name: userName,
          email: user.email || '',
          phone: profileData?.phone || user.user_metadata?.phone || '',
          business_name: profileData?.business_name || user.user_metadata?.business_name || '',
          business_registration: profileData?.business_registration || '',
          tax_id: profileData?.tax_id || '',
          investment_strategy: 'Buy and Hold',
          portfolio_size: propertiesData?.length > 0 ? `Small (${propertiesData.length} properties)` : 'Getting Started',
          years_investing: 1,
          preferred_locations: ['Lagos'],
          total_properties: propertiesData?.length || 0,
          total_portfolio_value: 0,
          monthly_income: 0,
          average_roi: 0,
          verified: false,
          created_at: profileData?.created_at || new Date().toISOString(),
          updated_at: profileData?.updated_at || new Date().toISOString()
        };

        // Transform real properties data if available
        const realProperties = propertiesData?.map(prop => ({
          id: prop.id,
          owner_id: user.id,
          title: prop.name || prop.title || 'Property',
          type: (prop.type || 'apartment') as const,
          status: (prop.status || 'available') as const,
          address: prop.address || prop.location || '',
          city: prop.city || 'Lagos',
          state: prop.state || 'Lagos',
          bedrooms: parseInt(String(prop.bedrooms)) || 1,
          bathrooms: parseInt(String(prop.bathrooms)) || 1,
          area_sqm: parseInt(String(prop.squareFeet || prop.area_sqm)) || 100,
          purchase_price: parseFloat(String(prop.price || prop.purchase_price)) || 0,
          current_value: parseFloat(String(prop.price || prop.current_value)) || 0,
          monthly_rent: parseFloat(String(prop.rent_amount || prop.monthly_rent)) || 0,
          annual_rent: (parseFloat(String(prop.rent_amount || prop.monthly_rent)) || 0) * 12,
          occupancy_rate: prop.occupancy_rate || 0,
          tenant_count: prop.tenant_count || 0,
          maintenance_cost_ytd: prop.maintenance_cost_ytd || 0,
          total_revenue_ytd: prop.total_revenue_ytd || 0,
          net_income_ytd: prop.net_income_ytd || 0,
          roi_percentage: prop.roi_percentage || 0,
          days_vacant_ytd: prop.days_vacant_ytd || 0,
          created_at: prop.created_at,
          updated_at: prop.updated_at
        })) || [];

        // Always use real profile data
        setOwnerProfile(realProfile);
        
        // Always use real properties data (empty array if no properties)
        setProperties(realProperties);
        setTenants([]); // No tenant data available yet
        setFinances([]); // No finance data available yet
        
        console.log('Real properties loaded:', realProperties.length, realProperties);

        // Calculate statistics and performance metrics using real data
        const dataToUse = {
          properties: realProperties,
          tenants: [],
          finances: []
        };

        const calculatedStats = calculateStats(dataToUse.properties, dataToUse.tenants, dataToUse.finances);
        setStats(calculatedStats);
        setPerformanceMetrics(calculatePerformanceMetrics(dataToUse.properties, dataToUse.tenants, calculatedStats));
      } catch (error) {
        console.error('Error fetching owner data:', error);
        setError(error as Error);
        
        // Fallback to empty data on error, not mock data
        setOwnerProfile({
          id: user.id,
          user_id: user.id,
          name: user.email?.split('@')[0] || 'Property Owner',
          email: user.email || '',
          phone: '',
          business_name: '',
          business_registration: '',
          tax_id: '',
          investment_strategy: 'Buy and Hold',
          portfolio_size: 'Getting Started',
          years_investing: 1,
          preferred_locations: ['Lagos'],
          total_properties: 0,
          total_portfolio_value: 0,
          monthly_income: 0,
          average_roi: 0,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setProperties([]);
        setTenants([]);
        setFinances([]);
        setStats({
          totalProperties: 0,
          portfolioValue: 0,
          monthlyIncome: 0,
          netIncome: 0,
          occupancyRate: 0,
          averageRoi: 0
        });
        setPerformanceMetrics({
          monthlyRevenue: [],
          occupancyTrends: [],
          expenseBreakdown: [],
          roiComparison: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerData();
  }, [user]);

  // Add missing functions that the dashboard expects
  const refreshData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Re-trigger the useEffect by updating a dependency
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };


  const updateProperty = async (propertyId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId)
        .eq('owner_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Property updated successfully!');
      refreshData();
      return data;
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
      throw error;
    }
  };

  const addTenant = async (tenantData: any) => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      // Create tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          first_name: tenantData.firstName || tenantData.first_name || '',
          last_name: tenantData.lastName || tenantData.last_name || '',
          email: tenantData.email || '',
          phone: tenantData.phone || '',
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (tenantError) throw tenantError;

      // If property information is provided, create property-tenant relationship
      if (tenantData.propertyId && tenant) {
        const { error: propertyTenantError } = await supabase
          .from('property_tenants')
          .insert({
            property_id: tenantData.propertyId,
            tenant_id: tenant.id,
            rent_amount: tenantData.rentAmount ? parseFloat(tenantData.rentAmount) : null,
            deposit_amount: tenantData.depositAmount ? parseFloat(tenantData.depositAmount) : null,
            start_date: tenantData.startDate || new Date().toISOString().split('T')[0],
            end_date: tenantData.endDate || null,
            status: 'active'
          });

        if (propertyTenantError) throw propertyTenantError;
      }

      toast.success('Tenant added successfully!');
      
      // Refresh data to show the new tenant
      await refreshData();
      
      return tenant;
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast.error('Failed to add tenant');
      throw error;
    }
  };

  const updateTenant = async (tenantId: string, updates: any) => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return null;
      }

      // Update tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .update({
          first_name: updates.firstName || updates.first_name,
          last_name: updates.lastName || updates.last_name,
          email: updates.email,
          phone: updates.phone,
          status: updates.status || 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Update property-tenant relationship if provided
      if (updates.propertyId || updates.rentAmount || updates.depositAmount) {
        const { error: propertyTenantError } = await supabase
          .from('property_tenants')
          .update({
            property_id: updates.propertyId,
            rent_amount: updates.rentAmount ? parseFloat(updates.rentAmount) : undefined,
            deposit_amount: updates.depositAmount ? parseFloat(updates.depositAmount) : undefined,
            start_date: updates.startDate,
            end_date: updates.endDate,
            status: updates.status || 'active'
          })
          .eq('tenant_id', tenantId);

        if (propertyTenantError) throw propertyTenantError;
      }

      toast.success('Tenant updated successfully!');
      
      // Refresh data to show the updated tenant
      await refreshData();
      
      return tenant;
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Failed to update tenant');
      throw error;
    }
  };

  return {
    ownerProfile,
    properties,
    tenants,
    finances,
    stats,
    performanceMetrics,
    isLoading,
    error,
    refreshData,
    updateProperty,
    addTenant,
    updateTenant
  };
};

export type { OwnerProperty, OwnerTenant, OwnerFinance, OwnerStats, OwnerPerformanceMetrics };
