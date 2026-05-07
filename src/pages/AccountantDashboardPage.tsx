import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { format, endOfMonth, startOfMonth } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAuthSession } from '@/contexts/auth';
import {
  fetchExpenses,
  fetchIncomeLines,
} from '@/modules/accounting/services/accountingDataService';
import { formatNgn } from '@/modules/accounting/export/accountingExports';
import { RoleDashboardInsights } from '@/components/dashboard/role-dashboard/RoleDashboardInsights';
import type {
  RoleDashboardActivity,
  RoleDashboardQuickAction,
  RoleDashboardStat,
} from '@/components/dashboard/role-dashboard/types';
import { Calculator, TrendingDown, TrendingUp, Wallet, FileSpreadsheet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AccountantDashboardPage = () => {
  const { user, userRole } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [activities, setActivities] = useState<RoleDashboardActivity[]>([]);

  const range = useMemo(() => {
    const d = new Date();
    return {
      start: format(startOfMonth(d), 'yyyy-MM-dd'),
      end: format(endOfMonth(d), 'yyyy-MM-dd'),
      label: format(d, 'MMMM yyyy'),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [income, expenses] = await Promise.all([
          fetchIncomeLines(range.start, range.end, null),
          fetchExpenses(range.start, range.end, null),
        ]);
        if (cancelled) return;
        const inc = income.reduce((s, r) => s + r.amount, 0);
        const exp = expenses.reduce(
          (s, r) => s + Number(r.amount_ngn || 0) + Number(r.vat_amount_ngn || 0),
          0
        );
        setIncomeTotal(inc);
        setExpenseTotal(exp);
        setLineCount(income.length + expenses.length);

        const actRows: { at: string; item: RoleDashboardActivity }[] = [];
        for (const r of income.slice(0, 6)) {
          const at = r.paymentDate || range.start;
          actRows.push({
            at,
            item: {
              id: `inc-${r.id}`,
              title: `Income · ${r.category}`,
              meta: r.propertyName || r.description || 'Rent ledger',
              time: at ? formatDistanceToNow(new Date(at), { addSuffix: true }) : '',
              icon: '📥',
            },
          });
        }
        for (const r of expenses.slice(0, 6)) {
          const at = r.expense_date;
          actRows.push({
            at,
            item: {
              id: `exp-${r.id}`,
              title: `Expense · ${r.expense_type}`,
              meta: r.description || 'Posted expense',
              time: at ? formatDistanceToNow(new Date(at), { addSuffix: true }) : '',
              icon: '📤',
            },
          });
        }
        actRows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        setActivities(actRows.slice(0, 8).map((x) => x.item));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [range.start, range.end]);

  if (!user || userRole !== 'accountant') {
    return <Navigate to="/unauthorized" replace />;
  }

  const net = incomeTotal - expenseTotal;

  const stats: RoleDashboardStat[] = [
    {
      title: 'Income (MTD)',
      value: loading ? '…' : formatNgn(incomeTotal),
      icon: <TrendingUp className="h-4 w-4" />,
      description: range.label,
    },
    {
      title: 'Expenses (MTD)',
      value: loading ? '…' : formatNgn(expenseTotal),
      icon: <TrendingDown className="h-4 w-4" />,
      description: range.label,
    },
    {
      title: 'Net (MTD)',
      value: loading ? '…' : formatNgn(net),
      icon: <Wallet className="h-4 w-4" />,
      description: 'Income minus expenses',
    },
    {
      title: 'Ledger lines',
      value: loading ? '…' : String(lineCount),
      icon: <Calculator className="h-4 w-4" />,
      description: 'Income + expense rows this month',
    },
  ];

  const quickActions: RoleDashboardQuickAction[] = [
    { label: 'Open accounting module', to: '/accounting', icon: FileSpreadsheet },
    { label: 'View properties', to: '/properties', icon: Calculator },
    { label: 'Executive analytics', to: '/analytics/executive', icon: TrendingUp },
  ];

  return (
    <PageLayout>
      <PageContent
        title="Accountant dashboard"
        description={`Month-to-date ledger snapshot for ${range.label}. Open Accounting (NG) for full detail, journals, and exports.`}
        showBreadcrumbs={false}
      >
        <RoleDashboardInsights
          sectionTitle="Finance pulse"
          stats={stats}
          quickActions={quickActions}
          activities={activities}
          activityTitle="Recent ledger activity"
          activityEmptyMessage="No income or expense lines this month yet."
        />
      </PageContent>
    </PageLayout>
  );
};

export default AccountantDashboardPage;
