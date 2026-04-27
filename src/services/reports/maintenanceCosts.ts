import { supabase } from '@/integrations/supabase/client';
import { MaintenanceCostsReportData, MaintenanceCostEntry } from '@/components/reports/types';

type FinanceTransactionRow = {
  amount: number;
  category: string;
  date: string;
  description: string | null;
  type: string;
  properties: { name: string } | null;
};

/** Row from public.expenses joined to properties */
type ExpenseWithPropertyRow = {
  amount: number;
  category: string | null;
  created_at: string;
  description: string | null;
  properties: { name: string } | null;
};

const isMaintenanceLike = (row: FinanceTransactionRow): boolean => {
  const category = String(row.category || '').toLowerCase();
  const type = String(row.type || '').toLowerCase();
  const description = String(row.description || '').toLowerCase();

  return (
    category.includes('maintenance') ||
    category.includes('repair') ||
    category.includes('service') ||
    type.includes('maintenance') ||
    (type.includes('expense') &&
      (description.includes('maintenance') || description.includes('repair') || category !== ''))
  );
};

export const getMaintenanceCosts = async (
  startDate: string,
  endDate: string
): Promise<MaintenanceCostsReportData> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount, category, created_at, description, properties(name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance costs data:', error);
    throw new Error('Failed to fetch maintenance costs data');
  }

  const rows = ((data || []) as ExpenseWithPropertyRow[]).map((row) => ({
    amount: row.amount,
    category: row.category || '',
    date: row.created_at,
    description: row.description,
    type: 'expense',
    properties: row.properties,
  })) as FinanceTransactionRow[];

  const filtered = rows.filter(isMaintenanceLike);
  const entries: MaintenanceCostEntry[] = filtered.map((row) => ({
    date: row.date,
    propertyName: row.properties?.name || 'Unknown Property',
    category: row.category || 'Uncategorized',
    description: row.description,
    amount: Number(row.amount || 0),
  }));

  const totalCost = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const transactionCount = entries.length;
  const averageCost = transactionCount === 0 ? 0 : totalCost / transactionCount;

  const byCategoryMap = new Map<string, { total: number; count: number }>();
  for (const entry of entries) {
    const current = byCategoryMap.get(entry.category) || { total: 0, count: 0 };
    current.total += entry.amount;
    current.count += 1;
    byCategoryMap.set(entry.category, current);
  }

  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, value]) => ({
      category,
      total: value.total,
      count: value.count,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalCost,
    transactionCount,
    averageCost,
    byCategory,
    entries,
  };
};
