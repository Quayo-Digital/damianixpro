import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock3, RefreshCw, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchActivationFunnelReport } from '@/services/onboarding/activationFunnelService';
import { fetchOwnerPlanDiagnostics } from '@/services/subscription/planEnforcement';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

function fmtDurationMinutes(mins: number | null) {
  if (mins == null) return '—';
  if (mins < 60) return `${mins.toFixed(1)} min`;
  const hours = mins / 60;
  return `${hours.toFixed(1)} h`;
}

export default function AdminActivationFunnelPage() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['adminActivationFunnel'],
    queryFn: fetchActivationFunnelReport,
  });
  const {
    data: diagnostics = [],
    isLoading: diagnosticsLoading,
    isFetching: diagnosticsFetching,
    refetch: refetchDiagnostics,
  } = useQuery({
    queryKey: ['adminOwnerPlanDiagnostics'],
    queryFn: fetchOwnerPlanDiagnostics,
  });

  const dropOff = useMemo(() => {
    const started = data?.usersWithStep1Started || 0;
    const completed = data?.usersWithStep5Completed || 0;
    return Math.max(started - completed, 0);
  }, [data]);

  return (
    <PageLayout>
      <PageContent
        title="Activation Funnel"
        description="Step-1 to step-5 onboarding conversion across all users."
      >
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={() => void refetchDiagnostics()}
              disabled={diagnosticsFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${diagnosticsFetching ? 'animate-spin' : ''}`} />
              Refresh diagnostics
            </Button>
          </div>

          {error instanceof Error ? (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle>Could not load activation funnel</CardTitle>
                <CardDescription>{error.message}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Users started step 1</CardDescription>
                    <CardTitle className="text-2xl">
                      {isLoading ? '…' : (data?.usersWithStep1Started ?? 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    Create company started
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Users completed step 5</CardDescription>
                    <CardTitle className="text-2xl">
                      {isLoading ? '…' : (data?.usersWithStep5Completed ?? 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <BarChart3 className="mr-1 inline h-3.5 w-3.5" />
                    Activate payments completed
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Conversion rate</CardDescription>
                    <CardTitle className="text-2xl">
                      {isLoading ? '…' : `${data?.conversionRatePct ?? 0}%`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Step 1 starters who reached step 5
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Avg. time step1 → step5</CardDescription>
                    <CardTitle className="text-2xl">
                      {isLoading ? '…' : fmtDurationMinutes(data?.avgMinutesStep1ToStep5 ?? null)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                    Converted users only
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funnel summary</CardTitle>
                  <CardDescription>Quick health read for onboarding activation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Step 1 started: <strong>{data?.usersWithStep1Started ?? 0}</strong>
                  </p>
                  <p>
                    Step 5 completed: <strong>{data?.usersWithStep5Completed ?? 0}</strong>
                  </p>
                  <p>
                    Drop-off before completion: <strong>{isLoading ? '…' : dropOff}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Snapshot: {data?.snapshotAt ? new Date(data.snapshotAt).toLocaleString() : '—'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Owner plan enforcement diagnostics</CardTitle>
                  <CardDescription>
                    Effective plan, property cap, and current property count for owner accounts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosticsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading diagnostics…</p>
                  ) : diagnostics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No owner accounts found.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Owner</TableHead>
                          <TableHead>Effective plan</TableHead>
                          <TableHead className="text-right">Property limit</TableHead>
                          <TableHead className="text-right">Current properties</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diagnostics.slice(0, 120).map((row) =>
                          (() => {
                            const limit =
                              row.propertyLimit === 'unlimited' ? null : Number(row.propertyLimit);
                            const overLimit =
                              limit != null &&
                              Number.isFinite(limit) &&
                              row.currentPropertyCount > limit;
                            return (
                              <TableRow
                                key={row.ownerId}
                                className={overLimit ? 'bg-destructive/5' : undefined}
                              >
                                <TableCell>
                                  <div className="font-medium">{row.ownerName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {row.ownerEmail}
                                  </div>
                                </TableCell>
                                <TableCell className="uppercase">{row.effectivePlan}</TableCell>
                                <TableCell className="text-right">
                                  {row.propertyLimit === 'unlimited'
                                    ? 'Unlimited'
                                    : row.propertyLimit}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.currentPropertyCount}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {overLimit && (
                                    <Badge variant="destructive" className="mr-2">
                                      Over limit
                                    </Badge>
                                  )}
                                  {row.grandfathered
                                    ? 'Legacy grandfathered'
                                    : `Source tier: ${row.sourceTier}`}
                                </TableCell>
                              </TableRow>
                            );
                          })()
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
