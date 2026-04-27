import { useCallback, useEffect, useState } from 'react';
import { Shield, ShieldCheck, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthSession } from '@/contexts/auth';
import { roleRequiresMfa } from '@/contexts/auth/mfaPolicy';
import { pickVerifiedMfaFactor } from '@/components/security/mfaUtils';
import type { MfaFactorRow } from '@/components/security/mfaUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export function AuthenticatorMfaSection() {
  const { userRole } = useAuthSession();
  const [factor, setFactor] = useState<MfaFactorRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = (data?.totp ?? []) as MfaFactorRow[];
      const phone = (data?.phone ?? []) as MfaFactorRow[];
      setFactor(pickVerifiedMfaFactor({ totp, phone }));
    } catch (e) {
      logger.error('listFactors in settings', e);
      toast.error('Could not load MFA status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleUnenroll = async () => {
    if (!factor) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) throw error;
      toast.success('Authenticator removed');
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to remove authenticator';
      toast.error(msg);
    }
  };

  const required = roleRequiresMfa(userRole);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {factor ? (
            <ShieldCheck className="h-5 w-5 text-green-600" aria-hidden />
          ) : (
            <Shield className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
          <CardTitle>Two-factor authentication</CardTitle>
        </div>
        <CardDescription>
          {required
            ? 'Your account role requires an authenticator app (TOTP). You may be asked to verify when you sign in.'
            : 'Add an extra layer of security with a time-based code from an authenticator app.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : factor ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Authenticator active</p>
              <p className="text-xs text-muted-foreground">
                Type: {factor.factor_type === 'totp' ? 'Authenticator app' : 'SMS'}
                {factor.friendly_name ? ` · ${factor.friendly_name}` : ''}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove authenticator?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {required
                      ? 'You will need to set up two-factor authentication again before you can use privileged areas of the app.'
                      : 'You can add an authenticator again at any time.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleUnenroll()}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {required
              ? 'No authenticator is set up yet. Complete the setup prompt after sign-in, or refresh this page once you have enrolled.'
              : 'You do not have an authenticator linked. Optional MFA can be added from your account security flow when available.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
