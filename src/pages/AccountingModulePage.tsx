import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuthSession } from '@/contexts/auth';
import { toast } from 'sonner';
import {
  aggregateMonthlyPl,
  fetchCommissions,
  fetchExpenses,
  fetchIncomeLines,
  fetchJournal,
  fetchMaintenanceCostLines,
  fetchMaintenanceTicketsForExpenseLink,
  fetchPaymentBreakdownLines,
  fetchPropertiesForAccounting,
  fetchProfilesForAgents,
  insertCommission,
  insertExpense,
  type CommissionRow,
  type ExpenseRow,
  type IncomeLine,
  type JournalRow,
  type MaintenanceCostLine,
  type MonthlyPlRow,
  type PaymentBreakdownLine,
} from '@/modules/accounting/services/accountingDataService';
import {
  exportCommissionsCsv,
  exportExpensesCsv,
  exportIncomeCsv,
  exportMaintenanceCostsCsv,
  exportMonthlyReportPdf,
  exportOwnerStatementPdf,
  exportPaymentSettlementsCsv,
  exportPlCsv,
  formatNgn,
} from '@/modules/accounting/export/accountingExports';
import { runReconciliation } from '@/services/payments/accounting/reconciliation';
import { Loader2, FileDown, FileSpreadsheet, Scale } from 'lucide-react';

function monthRange(monthOffset: number): { start: string; end: string; label: string } {
  const d = subMonths(new Date(), monthOffset);
  const s = startOfMonth(d);
  const e = endOfMonth(d);
  return {
    start: format(s, 'yyyy-MM-dd'),
    end: format(e, 'yyyy-MM-dd'),
    label: format(s, 'MMMM yyyy'),
  };
}

const EXPENSE_TYPES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'utilities', label: 'Utilities (PHCN / diesel / water)' },
  { value: 'service_charge', label: 'Service charge (outflow)' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'legal', label: 'Legal & compliance' },
  { value: 'agency_fee', label: 'Agency / marketing' },
  { value: 'management_fee', label: 'Property management fee' },
  { value: 'other', label: 'Other' },
];

const AccountingModulePage = () => {
  const { user, hasPermission } = useAuthSession();
  const canPost = hasPermission('accounting.post');

  const [tab, setTab] = useState('overview');
  const [monthOffset, setMonthOffset] = useState(0);
  const { start, end, label } = useMemo(() => monthRange(monthOffset), [monthOffset]);

  const [propertyId, setPropertyId] = useState<string>('all');
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; label: string }[]>([]);

  const [income, setIncome] = useState<IncomeLine[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [pl, setPl] = useState<MonthlyPlRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recon, setRecon] = useState<Awaited<ReturnType<typeof runReconciliation>> | null>(null);

  const [expForm, setExpForm] = useState({
    expense_type: 'utilities',
    amount_ngn: '',
    vat_amount_ngn: '0',
    description: '',
    property_id: '',
    maintenance_ticket_id: '',
  });
  const [ticketOptions, setTicketOptions] = useState<
    { id: string; label: string; suggestedAmount: number }[]
  >([]);
  const [maintenanceCosts, setMaintenanceCosts] = useState<MaintenanceCostLine[]>([]);
  const [settlements, setSettlements] = useState<PaymentBreakdownLine[]>([]);
  const [comForm, setComForm] = useState({
    property_id: '',
    agent_id: '',
    basis_amount_ngn: '',
    commission_pct: '5',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pid = propertyId === 'all' ? null : propertyId;
      const [inc, exp, com, jrnl, props, ag, maint, settle] = await Promise.all([
        fetchIncomeLines(start, end, pid),
        fetchExpenses(start, end, pid),
        fetchCommissions(start, end, pid, null),
        fetchJournal(start, end),
        fetchPropertiesForAccounting(),
        fetchProfilesForAgents(),
        fetchMaintenanceCostLines(start, end, pid),
        fetchPaymentBreakdownLines(start, end, pid),
      ]);
      setIncome(inc);
      setExpenses(exp);
      setCommissions(com);
      setJournal(jrnl);
      setProperties(props);
      setAgents(ag);
      setMaintenanceCosts(maint);
      setSettlements(settle);
      setPl(aggregateMonthlyPl(inc, exp, com, maint, settle));
      const r = await runReconciliation(start, end);
      setRecon(r);
    } finally {
      setLoading(false);
    }
  }, [start, end, propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!expForm.property_id) {
      setTicketOptions([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const opts = await fetchMaintenanceTicketsForExpenseLink(expForm.property_id);
      if (!cancelled) setTicketOptions(opts);
    })();
    return () => {
      cancelled = true;
    };
  }, [expForm.property_id]);

  const ownerDisplay = useMemo(() => {
    const meta = user?.user_metadata as Record<string, string> | undefined;
    return (
      meta?.full_name ||
      [meta?.first_name, meta?.last_name].filter(Boolean).join(' ') ||
      user?.email ||
      'Account'
    );
  }, [user]);

  const onAddExpense = async () => {
    if (!canPost) {
      toast.error('You do not have permission to post accounting entries.');
      return;
    }
    const amt = Number(expForm.amount_ngn);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount (NGN).');
      return;
    }
    const { error } = await insertExpense({
      property_id: expForm.property_id || null,
      expense_type: expForm.expense_type,
      amount_ngn: amt,
      vat_amount_ngn: Number(expForm.vat_amount_ngn) || 0,
      expense_date: start,
      description: expForm.description || null,
      maintenance_ticket_id: expForm.maintenance_ticket_id || null,
    });
    if (error) toast.error(error);
    else {
      toast.success('Expense recorded');
      setExpForm((s) => ({
        ...s,
        amount_ngn: '',
        description: '',
        maintenance_ticket_id: '',
      }));
      void load();
    }
  };

  const onAddCommission = async () => {
    if (!canPost) {
      toast.error('You do not have permission to post accounting entries.');
      return;
    }
    if (!comForm.property_id || !comForm.agent_id) {
      toast.error('Select property and agent.');
      return;
    }
    const basis = Number(comForm.basis_amount_ngn);
    const pct = Number(comForm.commission_pct);
    if (!basis || pct < 0) {
      toast.error('Enter basis amount and commission %.');
      return;
    }
    const comm = (basis * pct) / 100;
    const { error } = await insertCommission({
      property_id: comForm.property_id,
      agent_id: comForm.agent_id,
      basis_amount_ngn: basis,
      commission_pct: pct,
      commission_amount_ngn: Math.round(comm * 100) / 100,
      period_month: start.slice(0, 10),
      notes: comForm.notes || null,
    });
    if (error) toast.error(error);
    else {
      toast.success('Commission line saved');
      setComForm((s) => ({ ...s, basis_amount_ngn: '', notes: '' }));
      void load();
    }
  };

  const incomeTotals = useMemo(() => {
    const rent = income.filter((i) => i.category === 'rent').reduce((s, i) => s + i.amount, 0);
    const sc = income
      .filter((i) => i.category === 'service_charge')
      .reduce((s, i) => s + i.amount, 0);
    const oth = income.filter((i) => i.category === 'other').reduce((s, i) => s + i.amount, 0);
    const exp = expenses.reduce(
      (s, e) => s + Number(e.amount_ngn) + Number(e.vat_amount_ngn || 0),
      0
    );
    const com = commissions.reduce((s, c) => s + Number(c.commission_amount_ngn), 0);
    const maintActual = maintenanceCosts
      .filter((m) => m.isActualCost)
      .reduce((s, m) => s + m.amount, 0);
    const settleFees = settlements.reduce(
      (s, l) => s + l.platformFee + l.agentCommission + l.taxAmount,
      0
    );
    const ownerPool = settlements.reduce((s, l) => s + l.ownerAmount, 0);
    return {
      rent,
      sc,
      oth,
      exp,
      com,
      maintActual,
      settleFees,
      ownerPool,
      net: rent + sc + oth - exp - com - maintActual - settleFees,
    };
  }, [income, expenses, commissions, maintenanceCosts, settlements]);

  const settlementCommissionSummary = useMemo(() => {
    const total = settlements.reduce((s, l) => s + l.agentCommission, 0);
    const byKey = new Map<string, { propertyKey: string; label: string; total: number }>();
    for (const s of settlements) {
      if (s.agentCommission <= 0) continue;
      const propertyKey = s.propertyId ?? '_unassigned';
      const label = s.propertyName || s.propertyId || 'Property';
      const cur = byKey.get(propertyKey) ?? { propertyKey, label, total: 0 };
      cur.total += s.agentCommission;
      byKey.set(propertyKey, cur);
    }
    const byProperty = [...byKey.values()].sort((a, b) => b.total - a.total);
    return {
      total,
      byProperty,
      linesWithCommission: settlements.filter((s) => s.agentCommission > 0).length,
    };
  }, [settlements]);

  return (
    <PageLayout>
      <PageContent
        title="Accounting (Nigeria)"
        description="Income from rent payments, operating expenses (optionally linked to maintenance tickets), Flutterwave settlement splits, P&amp;L, owner statements, and exports — amounts in NGN."
      >
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Reporting month</Label>
            <Select value={String(monthOffset)} onValueChange={(v) => setMonthOffset(Number(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {monthRange(m).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Property filter</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accessible properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="overview">Overview &amp; P&amp;L</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance costs</TabsTrigger>
            <TabsTrigger value="settlements">Payment settlements</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="statements">Owner statements</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="reports">Exports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Rent collected</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatNgn(incomeTotals.rent)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Service charge</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatNgn(incomeTotals.sc)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Other income</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatNgn(incomeTotals.oth)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Operating expenses</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-amber-700">
                  {formatNgn(incomeTotals.exp)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Commissions (manual)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-blue-800">
                  {formatNgn(incomeTotals.com)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Maintenance (actual)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-orange-800">
                  {formatNgn(incomeTotals.maintActual)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Settlement fees (platform + agent + tax)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-slate-800">
                  {formatNgn(incomeTotals.settleFees)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Owner pool (from breakdowns)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-muted-foreground">
                  {formatNgn(incomeTotals.ownerPool)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Net (period)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-emerald-800">
                  {formatNgn(incomeTotals.net)}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4" />
                  Ledger reconciliation (rent vs journal)
                </CardTitle>
                <CardDescription>
                  Compares successful `rent_payments` in the period with `journal_entries` on
                  Cash/Bank and owner payout lines when present.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                {recon ? (
                  <div className="space-y-1">
                    <p>
                      Revenue (payments): <strong>{formatNgn(recon.revenueFromPayments)}</strong> ·
                      Journal cash debits: <strong>{formatNgn(recon.revenueFromJournal)}</strong>
                    </p>
                    <p>
                      Payouts (breakdowns):{' '}
                      <strong>{formatNgn(recon.payoutsFromBreakdowns)}</strong> · Journal owner
                      credits: <strong>{formatNgn(recon.payoutsFromJournal)}</strong>
                    </p>
                    <Badge variant={recon.balanced ? 'default' : 'destructive'}>
                      {recon.balanced ? 'Within tolerance' : 'Review discrepancy'}
                    </Badge>
                    <span className="ml-2 text-muted-foreground">
                      Combined variance: {formatNgn(recon.discrepancy)}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No reconciliation data.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly P &amp; L (rollup)</CardTitle>
                <CardDescription>
                  Net subtracts manual expenses, manual commissions, resolved maintenance actuals,
                  and recorded payment settlement fees (platform, agent, tax) from income.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Comm.</TableHead>
                      <TableHead className="text-right">Maint.</TableHead>
                      <TableHead className="text-right">Settle.</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pl.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell className="text-right">
                          {formatNgn(row.incomeRent + row.incomeServiceCharge + row.incomeOther)}
                        </TableCell>
                        <TableCell className="text-right">{formatNgn(row.expenses)}</TableCell>
                        <TableCell className="text-right">{formatNgn(row.commissions)}</TableCell>
                        <TableCell className="text-right">
                          {formatNgn(row.maintenanceActual)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNgn(
                            row.platformFeesSettled + row.agentCommissionSettled + row.taxSettled
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNgn(row.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pl.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-muted-foreground">
                          No rows for this filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Income lines</CardTitle>
                  <CardDescription>
                    Successful rent payments. Categorised as rent / service charge from the
                    `category` field.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportIncomeCsv(income, `income-${label.replace(/\s+/g, '-')}.csv`)
                  }
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.paymentDate}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.category}</Badge>
                        </TableCell>
                        <TableCell>{r.propertyName || r.propertyId || '—'}</TableCell>
                        <TableCell className="text-right">{formatNgn(r.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            {canPost && (
              <Card>
                <CardHeader>
                  <CardTitle>Add operating expense (NGN)</CardTitle>
                  <CardDescription>
                    Maintenance, utilities, estate dues, VAT (7.5% / per your policy).
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Property</Label>
                    <Select
                      value={expForm.property_id}
                      onValueChange={(v) =>
                        setExpForm((s) => ({ ...s, property_id: v, maintenance_ticket_id: '' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={expForm.expense_type}
                      onValueChange={(v) => setExpForm((s) => ({ ...s, expense_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (NGN)</Label>
                    <Input
                      inputMode="decimal"
                      value={expForm.amount_ngn}
                      onChange={(e) => setExpForm((s) => ({ ...s, amount_ngn: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT (NGN)</Label>
                    <Input
                      inputMode="decimal"
                      value={expForm.vat_amount_ngn}
                      onChange={(e) =>
                        setExpForm((s) => ({ ...s, vat_amount_ngn: e.target.value }))
                      }
                    />
                  </div>
                  {ticketOptions.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Link maintenance ticket (optional)</Label>
                      <Select
                        value={expForm.maintenance_ticket_id || '_none'}
                        onValueChange={(v) => {
                          const id = v === '_none' ? '' : v;
                          const opt = ticketOptions.find((o) => o.id === id);
                          setExpForm((s) => ({
                            ...s,
                            maintenance_ticket_id: id,
                            amount_ngn:
                              !s.amount_ngn?.trim() && opt
                                ? String(opt.suggestedAmount)
                                : s.amount_ngn,
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
                          {ticketOptions.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={2}
                      value={expForm.description}
                      onChange={(e) => setExpForm((s) => ({ ...s, description: e.target.value }))}
                    />
                  </div>
                  <Button type="button" onClick={() => void onAddExpense()}>
                    Save expense
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>Recorded expenses</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportExpensesCsv(expenses, `expenses-${label.replace(/\s+/g, '-')}.csv`)
                  }
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.expense_date}</TableCell>
                        <TableCell>{e.expense_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {e.maintenance_ticket_number || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNgn(Number(e.amount_ngn))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNgn(Number(e.vat_amount_ngn || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Maintenance ticket costs</CardTitle>
                  <CardDescription>
                    <strong>Actuals</strong> require <code className="text-xs">resolved_at</code>{' '}
                    and use that date for the period (and for P&amp;L). <strong>Estimates</strong>{' '}
                    use last update date for this list only; P&amp;L ignores estimates. Post formal
                    expenses on the Expenses tab when you need ledger lines.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportMaintenanceCostsCsv(
                      maintenanceCosts,
                      `maintenance-costs-${label.replace(/\s+/g, '-')}.csv`
                    )
                  }
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attributed date</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceCosts.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.costDate}</TableCell>
                        <TableCell>{m.ticketNumber}</TableCell>
                        <TableCell>{m.propertyName || m.propertyId}</TableCell>
                        <TableCell>
                          <Badge variant={m.isActualCost ? 'default' : 'secondary'}>
                            {m.isActualCost ? 'actual' : 'estimate'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNgn(m.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {maintenanceCosts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          No ticket costs in this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Payment settlements (Flutterwave breakdowns)</CardTitle>
                  <CardDescription>
                    Per successful rent payment: platform fee, agent commission, tax, and owner pool
                    from <code className="text-xs">payment_breakdowns</code>.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportPaymentSettlementsCsv(
                      settlements,
                      `payment-settlements-${label.replace(/\s+/g, '-')}.csv`
                    )
                  }
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Platform</TableHead>
                      <TableHead className="text-right">Agent</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Owner pool</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((s) => (
                      <TableRow key={s.rentPaymentId}>
                        <TableCell>{s.paymentDate}</TableCell>
                        <TableCell>{s.propertyName || s.propertyId || '—'}</TableCell>
                        <TableCell className="text-right">{formatNgn(s.gross)}</TableCell>
                        <TableCell className="text-right">{formatNgn(s.platformFee)}</TableCell>
                        <TableCell className="text-right">{formatNgn(s.agentCommission)}</TableCell>
                        <TableCell className="text-right">{formatNgn(s.taxAmount)}</TableCell>
                        <TableCell className="text-right">{formatNgn(s.ownerAmount)}</TableCell>
                      </TableRow>
                    ))}
                    {settlements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-muted-foreground">
                          No settlements in this period (breakdowns may not exist yet for older
                          payments).
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commission from rent settlements</CardTitle>
                <CardDescription>
                  Read-only sum of <code className="text-xs">agent_commission</code> from payment
                  breakdowns for successful rent payments in <strong>{label}</strong>. Independent
                  of manual accrual lines below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total (period)</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatNgn(settlementCommissionSummary.total)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {settlementCommissionSummary.linesWithCommission} payment
                    {settlementCommissionSummary.linesWithCommission === 1 ? '' : 's'} with non-zero
                    agent commission
                  </p>
                </div>
                {settlementCommissionSummary.byProperty.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">By property</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead className="text-right">Agent commission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlementCommissionSummary.byProperty.map((row) => (
                          <TableRow key={row.propertyKey}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNgn(row.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {settlements.length > 0 && settlementCommissionSummary.total === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Settlements exist for this period but agent commission is zero on all breakdown
                    rows.
                  </p>
                )}
                {settlements.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No successful rent payments in this period for the current filters.
                  </p>
                )}
              </CardContent>
            </Card>

            {canPost && (
              <Card>
                <CardHeader>
                  <CardTitle>Record commission accrual</CardTitle>
                  <CardDescription>
                    Manual accruals for letting / management. Compare with settlement totals above
                    to avoid duplicate accrual for the same deal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Property</Label>
                    <Select
                      value={comForm.property_id}
                      onValueChange={(v) => setComForm((s) => ({ ...s, property_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Agent (profile)</Label>
                    <Select
                      value={comForm.agent_id}
                      onValueChange={(v) => setComForm((s) => ({ ...s, agent_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Basis (NGN)</Label>
                    <Input
                      inputMode="decimal"
                      value={comForm.basis_amount_ngn}
                      onChange={(e) =>
                        setComForm((s) => ({ ...s, basis_amount_ngn: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission %</Label>
                    <Input
                      inputMode="decimal"
                      value={comForm.commission_pct}
                      onChange={(e) =>
                        setComForm((s) => ({ ...s, commission_pct: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      rows={2}
                      value={comForm.notes}
                      onChange={(e) => setComForm((s) => ({ ...s, notes: e.target.value }))}
                    />
                  </div>
                  <Button type="button" onClick={() => void onAddCommission()}>
                    Save commission line
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>Manual commission lines</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportCommissionsCsv(
                      commissions,
                      `commissions-${label.replace(/\s+/g, '-')}.csv`
                    )
                  }
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.period_month}</TableCell>
                        <TableCell className="text-right">
                          {formatNgn(c.commission_amount_ngn)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statements">
            <Card>
              <CardHeader>
                <CardTitle>Owner statement</CardTitle>
                <CardDescription>
                  PDF summary for {label} — income, expenses, maintenance tickets, payment
                  settlements, and manual commissions in NGN.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    exportOwnerStatementPdf({
                      ownerName: ownerDisplay,
                      periodLabel: label,
                      income,
                      expenses,
                      commissions,
                      maintenance: maintenanceCosts,
                      settlements,
                    })
                  }
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <CardTitle>Journal entries (read-only)</CardTitle>
                <CardDescription>
                  Lines visible per RLS: admins always; accountants read all; owners/agents see rows
                  tied to their properties when `property_id` is populated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journal.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell>{j.account || '—'}</TableCell>
                        <TableCell className="text-right">
                          {formatNgn(Number(j.debit || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNgn(Number(j.credit || 0))}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {j.description || j.reference || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {journal.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No journal rows for this period or insufficient access.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Monthly financial exports</CardTitle>
                <CardDescription>CSV for spreadsheets; PDF for filing / owners.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => exportPlCsv(pl, `pl-summary-${label.replace(/\s+/g, '-')}.csv`)}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  P&amp;L CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    exportPlCsv(pl, `monthly-summary-${label.replace(/\s+/g, '-')}.csv`)
                  }
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Monthly summary CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    exportMonthlyReportPdf(pl, `DamianixPro — Monthly financial report (${label})`)
                  }
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  P&amp;L PDF
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default AccountingModulePage;
