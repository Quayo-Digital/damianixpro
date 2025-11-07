import { supabase } from '@/integrations/supabase/client';

interface FetchFinanceDashboardDataProps {
  timeframe: string;
  propertyFilter: string;
}

export const fetchFinanceDashboardData = async ({ timeframe, propertyFilter }: FetchFinanceDashboardDataProps) => {
  const numMonths = timeframe === '3months' ? 3 : timeframe === '1year' ? 12 : 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - numMonths + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const startDateString = startDate.toISOString();

  // --- Generate month labels ---
  const months: string[] = [];
  const now = new Date();
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short' }));
  }
  
  const revenueByMonth = months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {} as Record<string, number>);
  const expensesByMonth = months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {} as Record<string, number>);
  const expensesByCategory: Record<string, number> = {};

  // --- Fetch Revenue Data ---
  let revenueQuery = supabase
    .from('rent_payments')
    .select('payment_date, amount, property_tenant_id')
    .eq('status', 'successful')
    .gte('payment_date', startDateString);
  
  if (propertyFilter !== 'all') {
    const { data: propertyTenants, error: ptError } = await supabase
      .from('property_tenants')
      .select('id')
      .eq('property_id', propertyFilter);

    if (ptError) {
        console.error('Error fetching property tenants:', ptError);
    } else if (propertyTenants && propertyTenants.length > 0) {
        const propertyTenantIds = propertyTenants.map(pt => pt.id);
        revenueQuery = revenueQuery.in('property_tenant_id', propertyTenantIds);
    } else {
        revenueQuery = revenueQuery.in('property_tenant_id', []); // No tenants for property, so no revenue
    }
  }

  const { data: payments, error: revenueError } = await revenueQuery;

  if (revenueError) {
    console.error('Error fetching revenue data:', revenueError);
    throw new Error('Failed to fetch revenue data');
  }

  if (payments) {
    payments.forEach(p => {
      if (p.payment_date) {
        const date = new Date(p.payment_date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (revenueByMonth.hasOwnProperty(month)) {
          revenueByMonth[month] += p.amount;
        }
      }
    });
  }

  const totalRevenue = payments ? payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  
  // --- Fetch Expense Data ---
  let expenseQuery = supabase
    .from('finance_transactions')
    .select('date, amount, category, property_id')
    .eq('type', 'expense')
    .gte('date', startDateString);

  if (propertyFilter !== 'all') {
    expenseQuery = expenseQuery.eq('property_id', propertyFilter);
  }

  const { data: expenses, error: expenseError } = await expenseQuery;
  
  if (expenseError) {
    console.error('Error fetching expense data:', expenseError);
    throw new Error('Failed to fetch expense data');
  }

  if (expenses) {
      expenses.forEach(e => {
          if (e.date) {
              const date = new Date(e.date);
              const month = date.toLocaleString('default', { month: 'short' });
              if (expensesByMonth.hasOwnProperty(month)) {
                  expensesByMonth[month] += e.amount;
              }
          }
          if (e.category) {
              expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
          }
      });
  }
  
  const totalExpenses = expenses ? expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
  
  // --- Calculate Totals ---
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  // --- Format Chart Data ---
  const revenueData = months.map(month => ({
      month,
      amount: revenueByMonth[month],
      expenses: expensesByMonth[month],
      profit: revenueByMonth[month] - expensesByMonth[month],
  }));

  const expenseData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));
  
  const cashFlowData = months.map(month => ({ 
    month, 
    inflow: revenueByMonth[month], 
    outflow: expensesByMonth[month] 
  }));
  
  // --- Calculate Property Performance Data ---
  let propertyPerformanceData;

  if (propertyFilter !== 'all') {
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('name')
      .eq('id', propertyFilter)
      .single();
      
    if (propertyError) console.error("Error fetching property name", propertyError);

    propertyPerformanceData = [
      { 
        name: property?.name || 'Selected Property', 
        revenue: totalRevenue, 
        expenses: totalExpenses, 
        profit: totalProfit 
      }
    ];
  } else {
    // For 'all' properties view, we need to group revenue and expenses by property.
    const expensesByProperty: Record<string, number> = {};
    if (expenses) {
      expenses.forEach(e => {
        if (e.property_id) {
          expensesByProperty[e.property_id] = (expensesByProperty[e.property_id] || 0) + e.amount;
        }
      });
    }

    const revenueByProperty: Record<string, number> = {};
    const { data: allPropertyTenants, error: ptError } = await supabase
      .from('property_tenants')
      .select('id, property_id');
    
    if (ptError) {
      console.error('Error fetching property tenants for grouping:', ptError);
    } else if (allPropertyTenants && payments) {
      const propertyTenantMap = allPropertyTenants.reduce((acc, pt) => {
        if (pt.property_id) acc[pt.id] = pt.property_id;
        return acc;
      }, {} as Record<string, string>);

      payments.forEach(p => {
        if (p.property_tenant_id) {
          const propertyId = propertyTenantMap[p.property_tenant_id];
          if (propertyId) {
            revenueByProperty[propertyId] = (revenueByProperty[propertyId] || 0) + p.amount;
          }
        }
      });
    }

    const { data: allProperties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, name');

    if (propertiesError) {
      console.error('Error fetching all properties:', propertiesError);
      propertyPerformanceData = [];
    } else if (allProperties) {
      propertyPerformanceData = allProperties.map(prop => {
        const revenue = revenueByProperty[prop.id] || 0;
        const expense = expensesByProperty[prop.id] || 0;
        return {
          name: prop.name,
          revenue,
          expenses: expense,
          profit: revenue - expense,
        };
      });
    } else {
      propertyPerformanceData = [];
    }
  }

  const monthlyExpenses = months.map(month => ({ month, expenses: expensesByMonth[month] }));

  return {
    revenueData,
    expenseData,
    cashFlowData,
    propertyPerformanceData,
    monthlyExpenses,
    totalRevenue,
    totalExpenses,
    totalProfit,
    profitMargin,
  };
};
