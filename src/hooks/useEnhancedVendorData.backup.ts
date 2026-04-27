import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';

interface VendorJob {
  id: string;
  vendor_id: string;
  property_id: string;
  maintenance_request_id?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  scheduled_date?: string;
  started_date?: string;
  completed_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
  payment_status?: 'pending' | 'paid' | 'overdue';
  vendor_notes?: string;
  customer_feedback?: string;
  customer_rating?: number;
  created_at: string;
  updated_at: string;
  // Computed fields for UI
  property_address?: string;
}

interface VendorProfile {
  id: string;
  user_id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  specialties: string[];
  service_areas: string[];
  business_license?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  years_of_experience: number;
  hourly_rate: number;
  emergency_rate: number;
  available_weekdays: boolean;
  available_weekends: boolean;
  available_24_hours: boolean;
  description?: string;
  certifications?: string;
  professional_references?: string;
  rating: number;
  total_jobs: number;
  completed_jobs: number;
  response_time: string;
  active: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields for UI
  is_available?: boolean;
  profile_image_url?: string;
}

interface VendorStats {
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  pendingJobs: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  responseTime: number;
}

interface PerformanceMetrics {
  monthlyEarnings: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
  };
  completionRate: {
    current: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageRating: {
    current: number;
    previous: number;
    totalReviews: number;
  };
  responseTime: {
    current: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  jobsCompleted: {
    thisMonth: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  customerSatisfaction: {
    score: number;
    breakdown: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  };
  earningsBreakdown: {
    byCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedDate: string;
    type: 'milestone' | 'performance' | 'customer_service';
  }>;
}

export function useEnhancedVendorData() {
  const { user } = useAuthSession();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendorProfile = async (vendorId: string) => {
    const { data, error } = await supabase.from('vendors').select('*').eq('id', vendorId).single();

    if (error) throw error;
    return data;
  };

  const fetchVendorJobs = async (vendorId: string) => {
    const { data, error } = await supabase
      .from('vendor_jobs')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const calculateStats = (jobs: VendorJob[]): VendorStats => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter((job) => job.status === 'completed').length;
    const activeJobs = jobs.filter((job) => job.status === 'in_progress').length;
    const pendingJobs = jobs.filter((job) => job.status === 'scheduled').length;

    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    // Calculate earnings
    const totalEarnings = jobs
      .filter((job) => job.status === 'completed')
      .reduce((sum, job) => sum + (job.actual_cost || job.estimated_cost), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = jobs
      .filter((job) => {
        if (job.status !== 'completed' || !job.completed_date) return false;
        const completedDate = new Date(job.completed_date);
        return (
          completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, job) => sum + (job.actual_cost || job.estimated_cost), 0);

    // Calculate average rating
    const ratedJobs = jobs.filter((job) => job.customer_rating && job.customer_rating > 0);
    const averageRating =
      ratedJobs.length > 0
        ? ratedJobs.reduce((sum, job) => sum + (job.customer_rating || 0), 0) / ratedJobs.length
        : 0;

    // Mock response time (in real app, this would be calculated from actual response data)
    const responseTime = Math.random() * 12 + 1; // 1-13 hours

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      pendingJobs,
      totalEarnings,
      monthlyEarnings,
      averageRating,
      totalReviews: ratedJobs.length,
      completionRate,
      responseTime,
    };
  };

  const calculatePerformanceMetrics = (
    jobs: VendorJob[],
    currentStats: VendorStats
  ): PerformanceMetrics => {
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = new Date().getFullYear();
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calculate previous month earnings
    const lastMonthEarnings = jobs
      .filter((job) => {
        if (job.status !== 'completed' || !job.completed_date) return false;
        const completedDate = new Date(job.completed_date);
        return (
          completedDate.getMonth() === lastMonth && completedDate.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, job) => sum + (job.actual_cost || job.estimated_cost), 0);

    // Calculate earnings by category
    const categoryEarnings = new Map<string, number>();
    let totalCategoryEarnings = 0;

    jobs
      .filter((job) => job.status === 'completed')
      .forEach((job) => {
        const amount = job.actual_cost || job.estimated_cost;
        categoryEarnings.set(job.category, (categoryEarnings.get(job.category) || 0) + amount);
        totalCategoryEarnings += amount;
      });

    const earningsByCategory = Array.from(categoryEarnings.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalCategoryEarnings > 0 ? (amount / totalCategoryEarnings) * 100 : 0,
    }));

    // Calculate customer satisfaction breakdown
    const ratedJobs = jobs.filter((job) => job.customer_rating && job.customer_rating > 0);
    const satisfactionBreakdown = {
      excellent: ratedJobs.filter((job) => job.customer_rating === 5).length,
      good: ratedJobs.filter((job) => job.customer_rating === 4).length,
      average: ratedJobs.filter((job) => job.customer_rating === 3).length,
      poor: ratedJobs.filter((job) => job.customer_rating && job.customer_rating <= 2).length,
    };

    // Generate mock achievements based on performance
    const achievements = [];
    if (currentStats.completedJobs >= 10) {
      achievements.push({
        id: 'jobs-10',
        title: '10 Jobs Completed',
        description: 'Successfully completed your first 10 jobs',
        icon: 'target',
        earnedDate: new Date().toISOString(),
        type: 'milestone' as const,
      });
    }
    if (currentStats.averageRating >= 4.5) {
      achievements.push({
        id: 'rating-45',
        title: 'Excellent Service',
        description: 'Maintained 4.5+ star rating',
        icon: 'star',
        earnedDate: new Date().toISOString(),
        type: 'customer_service' as const,
      });
    }
    if (currentStats.completionRate >= 90) {
      achievements.push({
        id: 'completion-90',
        title: 'Reliable Professional',
        description: '90%+ job completion rate',
        icon: 'award',
        earnedDate: new Date().toISOString(),
        type: 'performance' as const,
      });
    }

    return {
      monthlyEarnings: {
        current: currentStats.monthlyEarnings,
        previous: lastMonthEarnings,
        trend:
          currentStats.monthlyEarnings > lastMonthEarnings
            ? 'up'
            : currentStats.monthlyEarnings < lastMonthEarnings
              ? 'down'
              : 'stable',
      },
      completionRate: {
        current: currentStats.completionRate,
        target: 85,
        trend: 'stable', // Would be calculated based on historical data
      },
      averageRating: {
        current: currentStats.averageRating,
        previous: currentStats.averageRating, // Would be calculated from historical data
        totalReviews: currentStats.totalReviews,
      },
      responseTime: {
        current: currentStats.responseTime,
        target: 4,
        trend: 'stable',
      },
      jobsCompleted: {
        thisMonth: jobs.filter((job) => {
          if (job.status !== 'completed' || !job.completed_date) return false;
          const completedDate = new Date(job.completed_date);
          return (
            completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear
          );
        }).length,
        lastMonth: jobs.filter((job) => {
          if (job.status !== 'completed' || !job.completed_date) return false;
          const completedDate = new Date(job.completed_date);
          return (
            completedDate.getMonth() === lastMonth && completedDate.getFullYear() === lastMonthYear
          );
        }).length,
        trend: 'stable',
      },
      customerSatisfaction: {
        score: currentStats.averageRating,
        breakdown: satisfactionBreakdown,
      },
      earningsBreakdown: {
        byCategory: earningsByCategory,
        byMonth: [], // Would be populated with historical monthly data
      },
      achievements,
    };
  };

  const updateJobStatus = async (jobId: string, status: string, notes?: string) => {
    const updates: any = { status };

    if (status === 'completed') {
      updates.completed_date = new Date().toISOString();
    }

    const { error } = await supabase.from('vendor_jobs').update(updates).eq('id', jobId);

    if (error) throw error;

    // Refresh jobs data
    if (profile) {
      const updatedJobs = await fetchVendorJobs(profile.id);
      setJobs(updatedJobs);
      setStats(calculateStats(updatedJobs));
    }
  };

  const updateJobCost = async (jobId: string, actualCost: number) => {
    const { error } = await supabase
      .from('vendor_jobs')
      .update({ actual_cost: actualCost })
      .eq('id', jobId);

    if (error) throw error;

    // Refresh jobs data
    if (profile) {
      const updatedJobs = await fetchVendorJobs(profile.id);
      setJobs(updatedJobs);
      setStats(calculateStats(updatedJobs));
    }
  };

  const updateProfile = async (updates: Partial<VendorProfile>) => {
    if (!profile) throw new Error('No profile to update');

    const { error } = await supabase.from('vendors').update(updates).eq('id', profile.id);

    if (error) throw error;

    // Update local state
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user || !profile) throw new Error('User or profile not found');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('vendor-images').getPublicUrl(fileName);

    return data.publicUrl;
  };

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get the vendor profile for the current user
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (vendorError || !vendorData) {
          // Create mock vendor profile for development/testing
          const mockProfile: VendorProfile = {
            id: 'mock-vendor-1',
            user_id: user.id,
            name: 'Lagos Plumbing Services',
            category: 'Plumbing',
            email: user.email || 'vendor@example.com',
            phone: '+234 803 123 4567',
            address: '15 Victoria Island, Lagos',
            specialties: ['Pipe Repair', 'Water Heater Installation', 'Drain Cleaning'],
            service_areas: ['Lagos', 'Ogun'],
            business_license: 'BL-2024-001',
            insurance_provider: 'AXA Mansard',
            insurance_policy_number: 'POL-2024-12345',
            years_of_experience: 8,
            hourly_rate: 5000,
            emergency_rate: 8000,
            available_weekdays: true,
            available_weekends: false,
            available_24_hours: true,
            description: 'Professional plumbing services with 8+ years experience',
            certifications: 'Licensed Plumber, Water Systems Certified',
            professional_references: 'Available upon request',
            rating: 4.7,
            total_jobs: 156,
            completed_jobs: 142,
            response_time: '2-4 hours',
            active: true,
            verified: true,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-08-07T15:30:00Z',
            is_available: true,
          };
          setProfile(mockProfile);
        } else {
          setProfile(vendorData as VendorProfile);
        }

        // Fetch jobs for this vendor
        const jobsData = await fetchVendorJobs(vendorData.id);
        setJobs(jobsData);

        // Calculate statistics
        const calculatedStats = calculateStats(jobsData);
        setStats(calculatedStats);

        // Calculate performance metrics
        const metrics = calculatePerformanceMetrics(jobsData, calculatedStats);
        setPerformanceMetrics(metrics);
      } catch (err: any) {
        console.error('Error fetching vendor data:', err);
        setError(err.message || 'An error occurred while fetching vendor data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorData();
  }, [user]);

  return {
    profile,
    jobs,
    stats,
    performanceMetrics,
    isLoading,
    error,
    updateJobStatus,
    updateJobCost,
    updateProfile,
    uploadImage,
  };
}

// Export type aliases for testing compatibility
export type VendorPerformanceMetrics = PerformanceMetrics;
