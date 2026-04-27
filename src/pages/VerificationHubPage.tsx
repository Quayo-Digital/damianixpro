import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KYCVerificationDashboard } from '@/components/kyc/KYCVerificationDashboard';
import { TenantScreening } from '@/components/tenants/TenantScreening';
import { useAuthSession } from '@/contexts/auth';
import { useRoleScreening } from '@/hooks/useRoleScreening';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AccountVerificationCard } from '@/components/verification/AccountVerificationCard';

const VerificationHubPage = () => {
  const { user, userRole } = useAuthSession();
  const { data: screening, isLoading: screeningLoading } = useRoleScreening();

  const { data: tenantInfo } = useQuery({
    queryKey: ['verification-hub-tenant', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('tenants')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Tenant';
      return { id: row.id, name };
    },
    enabled: userRole === 'tenant' && !!user?.id,
    staleTime: 60_000,
  });

  return (
    <PageLayout>
      <PageContent
        title="Verification"
        description="Identity and screening for your account role. Complete each step to meet platform requirements."
      >
        <AccountVerificationCard />

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status</CardTitle>
            <CardDescription>
              Requirements depend on whether you are an owner, tenant, agent, vendor, or manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            {screeningLoading ? (
              <span className="text-sm text-muted-foreground">Loading…</span>
            ) : screening?.passed ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-100"
                >
                  Cleared for your current role
                </Badge>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-amber-600" />
                <div className="text-sm text-foreground">
                  <span className="font-medium text-amber-900 dark:text-amber-200">
                    Action needed
                  </span>
                  <ul className="mt-1 list-inside list-disc text-foreground/90 dark:text-amber-50/90">
                    {(screening?.missing ?? []).map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <KYCVerificationDashboard />

        {userRole === 'tenant' && tenantInfo ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tenant screening</CardTitle>
              <CardDescription>
                Landlords can initiate screening from tenant management. Your latest record is shown
                below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantScreening tenantId={tenantInfo.id} tenantName={tenantInfo.name} />
            </CardContent>
          </Card>
        ) : null}
      </PageContent>
    </PageLayout>
  );
};

export default VerificationHubPage;
