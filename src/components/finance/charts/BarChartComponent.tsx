import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

type MonthlyData = {
  name: string;
  total: number;
  platformFee: number;
  agentCommission: number;
  ownerAmount: number;
};

export const BarChartComponent = () => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const axisTickStyle = { fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 };

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);

      // Get the current year's data
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11); // Last 12 months
      startDate.setDate(1); // First day of month
      const startDateStr = startDate.toISOString().split('T')[0];

      // Get payment data
      const { data: payments, error } = await supabase
        .from('rent_payments')
        .select(
          `
          id,
          payment_date,
          amount
        `
        )
        .eq('status', 'successful')
        .gte('payment_date', startDateStr);

      if (error) throw error;

      // Process data by month
      const monthlyData: Record<string, MonthlyData> = {};

      // Initialize with empty data for last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const key = `${monthName} ${year}`;
        monthlyData[key] = {
          name: key,
          total: 0,
          platformFee: 0,
          agentCommission: 0,
          ownerAmount: 0,
        };
      }

      // Add payment data
      if (payments && payments.length > 0) {
        // Simplified approach due to type issues
        payments.forEach((payment) => {
          const date = new Date(payment.payment_date);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear();
          const key = `${monthName} ${year}`;

          if (!monthlyData[key]) {
            monthlyData[key] = {
              name: key,
              total: 0,
              platformFee: 0,
              agentCommission: 0,
              ownerAmount: 0,
            };
          }

          // Apply default percentage breakdowns
          const amount = Number(payment.amount);
          monthlyData[key].total += amount;
          monthlyData[key].platformFee += amount * 0.05; // 5% platform fee
          monthlyData[key].agentCommission += amount * 0.03; // 3% agent commission
          monthlyData[key].ownerAmount += amount * 0.85; // 85% to owner (remaining after 15% fees)
        });
      }

      // Convert to array and sort by date
      const result = Object.values(monthlyData).sort((a, b) => {
        const dateA = new Date(a.name.split(' ')[0] + ' 1, ' + a.name.split(' ')[1]);
        const dateB = new Date(b.name.split(' ')[0] + ' 1, ' + b.name.split(' ')[1]);
        return dateA.getTime() - dateB.getTime();
      });

      setData(result);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading chart data...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.45} />
        <XAxis dataKey="name" tick={axisTickStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => [`₦${Number(value).toLocaleString()}`, undefined]}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 16px 36px rgba(16,24,40,0.16)',
          }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="platformFee" name="Platform Fees" fill="#8884d8" />
        <Bar dataKey="agentCommission" name="Agent Commissions" fill="#82ca9d" />
        <Bar dataKey="ownerAmount" name="Owner Payouts" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
};
