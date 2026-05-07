import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, subDays, subMonths, startOfYear } from 'date-fns';
import {
  Building2,
  Coins,
  Hammer,
  LayoutDashboard,
  Percent,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchExecutiveAnalytics } from '@/services/analytics/executiveAnalyticsApi';
import { cn } from '@/lib/utils';

function formatNgn(n: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function presetRange(key: string): { from: Date; to: Date } {
  const to = new Date();
  switch (key) {
    case '30d':
      return { from: subDays(to, 30), to };
    case '90d':
      return { from: subDays(to, 90), to };
    case '12m':
      return { from: subMonths(to, 12), to };
    case 'ytd':
      return { from: startOfYear(to), to };
    default:
      return { from: subMonths(to, 12), to };
  }
}

export function ExecutiveAnalyticsDashboard() {
  const [preset, setPreset] = useState('12m');
  const [customFrom, setCustomFrom] = useState(() =>
    format(subMonths(new Date(), 12), 'yyyy-MM-dd')
  );
  const [customTo, setCustomTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [propertyId, setPropertyId] = useState<string>('');

  const range = useMemo(() => {
    if (preset === 'custom') {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
        return { from, to };
      }
      return presetRange('12m');
    }
    return presetRange(preset);
  }, [preset, customFrom, customTo]);

  const dateFromStr = format(range.from, 'yyyy-MM-dd');
  const dateToStr = format(range.to, 'yyyy-MM-dd');

  useEffect(() => {
    if (preset !== 'custom') {
      const pr = presetRange(preset);
      setCustomFrom(format(pr.from, 'yyyy-MM-dd'));
      setCustomTo(format(pr.to, 'yyyy-MM-dd'));
    }
  }, [preset]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['executiveAnalytics', dateFromStr, dateToStr, propertyId || 'all'],
    queryFn: () =>
      fetchExecutiveAnalytics({
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        propertyId: propertyId || undefined,
      }),
  });

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const chartData = useMemo(() => {
    const m = data?.series?.monthly || [];
    return m.map((row) => ({
      ...row,
      maintenance_ngn: row.maintenance_ngn ?? 0,
      label: row.month,
    }));
  }, [data]);

  const occupancyPct = Math.round(((data?.kpis.occupancy_rate ?? 0) * 1000) / 10);
  const arrearsDisplay = data?.kpis.arrears_ngn != null ? formatNgn(data.kpis.arrears_ngn) : '—';

  const propertyOptions = data?.filter_options?.properties ?? [];

  if (error instanceof Error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle>Unable to load analytics</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={onRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <span>Scoped to your portfolio and report permissions.</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Period</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="w-[200px] border-border/80 bg-background">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="12m">Last 12 months</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {preset === 'custom' && (
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="exec-analytics-from" className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <Input
                    id="exec-analytics-from"
                    type="date"
                    className="w-[160px] border-border/80 bg-background"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exec-analytics-to" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="exec-analytics-to"
                    type="date"
                    className="w-[160px] border-border/80 bg-background"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Property</Label>
              <Select
                value={propertyId || '__all__'}
                onValueChange={(v) => setPropertyId(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-[220px] border-border/80 bg-background">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All properties</SelectItem>
                  {propertyOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={onRefresh} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<Coins className="h-5 w-5 text-amber-600" />}
              label="Revenue"
              value={formatNgn(data?.kpis.rent_collected_ngn ?? 0)}
              hint="Successful rent by payment date"
              accent="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background"
            />
            <KpiCard
              icon={<Percent className="h-5 w-5 text-emerald-600" />}
              label="Occupancy rate"
              value={`${occupancyPct}%`}
              hint={`${data?.occupancy.occupied_properties ?? 0} / ${data?.occupancy.total_properties ?? 0} properties`}
              accent="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background"
            />
            <KpiCard
              icon={<Hammer className="h-5 w-5 text-rose-600" />}
              label="Arrears"
              value={arrearsDisplay}
              hint={
                data?.kpis.arrears_ngn != null
                  ? 'Outstanding balance snapshot (ledger)'
                  : 'Arrears snapshot unavailable'
              }
              accent="border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-background"
            />
            <KpiCard
              icon={<Wrench className="h-5 w-5 text-slate-600" />}
              label="Maintenance costs"
              value={formatNgn(data?.kpis.maintenance_costs_ngn ?? 0)}
              hint="Ticket actuals + maintenance & utilities expenses"
              accent="border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-background"
            />
          </div>

          {data?.meta?.scoped_empty && (
            <p className="text-sm text-muted-foreground">
              No properties are linked to your account for this view. Assign properties or contact
              an administrator.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/80 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Collections trend
                </CardTitle>
                <CardDescription>
                  Revenue and maintenance by calendar month (revenue uses payment date).
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {chartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No monthly series for this period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillCollected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillMaint" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(215 25% 45%)" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="hsl(215 25% 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        vertical={false}
                      />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => formatNgn(Number(v))}
                        width={88}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatNgn(v)}
                        labelFormatter={(l) => `Month: ${l}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="collected"
                        name="Revenue"
                        stroke="hsl(var(--primary))"
                        fill="url(#fillCollected)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="maintenance_ngn"
                        name="Maintenance"
                        stroke="hsl(215 25% 45%)"
                        fill="url(#fillMaint)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Occupancy
                </CardTitle>
                <CardDescription>Share of properties with an active lease.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-semibold tabular-nums">{occupancyPct}%</div>
                <Progress value={occupancyPct} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {data?.occupancy.occupied_properties ?? 0} occupied ·{' '}
                  {data?.occupancy.total_properties ?? 0} total in scope
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Revenue vs maintenance</CardTitle>
              <CardDescription>Monthly totals for the selected filters.</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No chart data.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) => formatNgn(Number(v))}
                      width={88}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(v: number) => formatNgn(v)} />
                    <Legend />
                    <Bar
                      dataKey="collected"
                      name="Revenue"
                      fill="hsl(142 76% 36%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="maintenance_ngn"
                      name="Maintenance"
                      fill="hsl(215 25% 45%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top performing properties</CardTitle>
              <CardDescription>
                By rent collected (successful payments) in the selected period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(data?.top_properties?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No property revenue in this window.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.top_properties ?? []).map((p) => (
                      <TableRow key={p.property_id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNgn(p.revenue_ngn)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Range {format(new Date(data?.range.from ?? dateFromStr), 'MMM d, yyyy')} —{' '}
            {format(new Date(data?.range.to ?? dateToStr), 'MMM d, yyyy')} · Revenue rows{' '}
            {data?.meta?.payment_rows_used ?? '—'}
            {data?.meta?.property_filter ? ` · Property filter` : ''}
          </p>
        </>
      )}
    </div>
  );
}

function KpiCard(props: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <Card className={cn('overflow-hidden border shadow-sm', props.accent)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{props.label}</CardTitle>
        {props.icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums tracking-tight">{props.value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{props.hint}</p>
      </CardContent>
    </Card>
  );
}
