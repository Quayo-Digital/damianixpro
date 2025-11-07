import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, subMonths, subDays } from 'date-fns';

export interface UserTypeDatum {
  name: string;
  value: number;
  color: string;
}

export interface RevenueDatum {
  month: string;
  revenue: number;
}

export interface Trend {
  value: number;
  isPositive: boolean;
}

export function useAdminDashboardData() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalProperties, setTotalProperties] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [supportTickets, setSupportTickets] = useState<number>(0);
  const [userDistribution, setUserDistribution] = useState<UserTypeDatum[]>([]);
  const [platformRevenue, setPlatformRevenue] = useState<RevenueDatum[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openTicketsByCategory, setOpenTicketsByCategory] = useState<{ [key: string]: number }>({});
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);
  const [pendingScreeningsCount, setPendingScreeningsCount] = useState<number>(0);

  const [userTrend, setUserTrend] = useState<Trend>({ value: 0, isPositive: true });
  const [propertiesTrend, setPropertiesTrend] = useState<Trend>({ value: 0, isPositive: true });
  const [revenueTrend, setRevenueTrend] = useState<Trend>({ value: 0, isPositive: true });
  const [ticketsTrend, setTicketsTrend] = useState<Trend>({ value: 0, isPositive: false });

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString();
        
        const calculateTrend = (current: number, previous: number) => {
          if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
          const change = ((current - previous) / previous) * 100;
          return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
        };

        const [
          usersCountRes,
          propertiesCountRes,
          revenueRes,
          maintenanceCountRes,
          userRolesRes,
          monthlyRevenueRes,
          recentUsersCountRes,
          previousUsersCountRes,
          recentPropertiesCountRes,
          previousPropertiesCountRes,
          recentRevenueRes,
          previousRevenueRes,
          recentTicketsCountRes,
          previousTicketsCountRes,
          openTicketsRes,
          pendingApplicationsRes,
          pendingScreeningsRes
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('properties').select('id', { count: 'exact', head: true }),
          supabase.from('rent_payments').select('amount').eq('status', 'successful'),
          supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }),
          supabase.from('user_roles').select('role'),
          supabase.from('rent_payments').select('amount, created_at').eq('status', 'successful').gte('created_at', sixMonthsAgo),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
          supabase.from('properties').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          supabase.from('properties').select('id', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
          supabase.from('rent_payments').select('amount').eq('status', 'successful').gte('created_at', thirtyDaysAgo),
          supabase.from('rent_payments').select('amount').eq('status', 'successful').gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
          supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
          supabase.from('maintenance_requests').select('category').in('status', ['pending', 'in_progress']),
          supabase.from('rental_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('tenant_screenings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        if (usersCountRes.error) throw usersCountRes.error;
        setTotalUsers(usersCountRes.count || 0);

        if (propertiesCountRes.error) throw propertiesCountRes.error;
        setTotalProperties(propertiesCountRes.count || 0);

        if (revenueRes.error) throw revenueRes.error;
        const total = revenueRes.data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        setTotalRevenue(total);

        if (maintenanceCountRes.error) throw maintenanceCountRes.error;
        setSupportTickets(maintenanceCountRes.count || 0);

        if (recentUsersCountRes.error || previousUsersCountRes.error) {
          console.error('Error fetching user trend data');
        } else {
          setUserTrend(calculateTrend(recentUsersCountRes.count || 0, previousUsersCountRes.count || 0));
        }

        if (recentPropertiesCountRes.error || previousPropertiesCountRes.error) {
          console.error('Error fetching properties trend data');
        } else {
          setPropertiesTrend(calculateTrend(recentPropertiesCountRes.count || 0, previousPropertiesCountRes.count || 0));
        }

        if (recentRevenueRes.error || previousRevenueRes.error) {
          console.error('Error fetching revenue trend data');
        } else {
          const recentRevenue = recentRevenueRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
          const previousRevenue = previousRevenueRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
          setRevenueTrend(calculateTrend(recentRevenue, previousRevenue));
        }

        if (recentTicketsCountRes.error || previousTicketsCountRes.error) {
          console.error('Error fetching tickets trend data');
        } else {
          const trend = calculateTrend(recentTicketsCountRes.count || 0, previousTicketsCountRes.count || 0);
          // For tickets, an increase is a negative trend
          setTicketsTrend({ ...trend, isPositive: !trend.isPositive });
        }
        
        if (openTicketsRes.error) {
          console.error('Error fetching open tickets:', openTicketsRes.error);
        } else {
          const counts = (openTicketsRes.data || []).reduce((acc, { category }) => {
            if (category) {
              acc[category] = (acc[category] || 0) + 1;
            }
            return acc;
          }, {} as { [key: string]: number });
          setOpenTicketsByCategory(counts);
        }

        if (pendingApplicationsRes.error) {
          console.error('Error fetching pending rental applications:', pendingApplicationsRes.error);
        } else {
          setPendingApplicationsCount(pendingApplicationsRes.count || 0);
        }

        if (pendingScreeningsRes.error) {
          console.error('Error fetching pending tenant screenings:', pendingScreeningsRes.error);
        } else {
          setPendingScreeningsCount(pendingScreeningsRes.count || 0);
        }

        if (userRolesRes.error) throw userRolesRes.error;
        const roleCounts = (userRolesRes.data || []).reduce((acc: { [key: string]: number }, { role }) => {
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        const roleColors: { [key: string]: string } = { tenant: '#4CAF50', owner: '#2196F3', agent: '#FFC107', vendor: '#9C27B0', admin: '#F44336', user: '#795548' };
        const distData = Object.entries(roleCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: roleColors[name] || '#607D8B' }));
        setUserDistribution(distData);

        if (monthlyRevenueRes.error) throw monthlyRevenueRes.error;
        const revenueByMonth = (monthlyRevenueRes.data || []).reduce((acc: { [key: string]: number }, payment) => {
            const monthKey = format(new Date(payment.created_at), 'yyyy-MM');
            acc[monthKey] = (acc[monthKey] || 0) + Number(payment.amount);
            return acc;
        }, {});
        const revenueData = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthKey = format(date, 'yyyy-MM');
            const monthName = format(date, 'MMM');
            revenueData.push({ month: monthName, revenue: revenueByMonth[monthKey] || 0 });
        }
        setPlatformRevenue(revenueData);

      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return {
    totalUsers,
    totalProperties,
    totalRevenue,
    supportTickets,
    userDistribution,
    platformRevenue,
    isLoading,
    userTrend,
    propertiesTrend,
    revenueTrend,
    ticketsTrend,
    openTicketsByCategory,
    pendingApplicationsCount,
    pendingScreeningsCount,
  };
}
