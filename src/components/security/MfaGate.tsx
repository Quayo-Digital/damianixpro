import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession, useAuthActions } from '@/contexts/auth';
import { roleRequiresMfa } from '@/contexts/auth/mfaPolicy';
import { pickVerifiedMfaFactor } from '@/components/security/mfaUtils';
import { MfaEnrollmentScreen } from '@/components/security/MfaEnrollmentScreen';
import { MfaChallengeScreen } from '@/components/security/MfaChallengeScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';
import type { MfaFactorRow } from '@/components/security/mfaUtils';

type MfaPhase = 'idle' | 'loading' | 'enroll' | 'challenge' | 'ready' | 'error';

type Props = {
  children: React.ReactNode;
};

export function MfaGate({ children }: Props) {
  const { user, userRole, isLoading: authLoading, session } = useAuthSession();
  const { signOut } = useAuthActions();
  const [phase, setPhase] = useState<MfaPhase>('idle');
  const [challengeFactor, setChallengeFactor] = useState<MfaFactorRow | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    if (!user || !userRole || !roleRequiresMfa(userRole)) {
      setPhase('ready');
      setChallengeFactor(null);
      setGateError(null);
      return;
    }

    setPhase('loading');
    setGateError(null);
    try {
      const listed = await supabase.auth.mfa.listFactors();
      if (listed.error) throw listed.error;

      const totp = (listed.data?.totp ?? []) as MfaFactorRow[];
      const phone = (listed.data?.phone ?? []) as MfaFactorRow[];
      const verified = pickVerifiedMfaFactor({ totp, phone });

      if (!verified) {
        setChallengeFactor(null);
        setPhase('enroll');
        return;
      }

      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.error) throw aal.error;

      const { currentLevel, nextLevel } = aal.data;
      if (nextLevel === 'aal2' && currentLevel !== 'aal2') {
        setChallengeFactor(verified);
        setPhase('challenge');
        return;
      }

      setChallengeFactor(null);
      setPhase('ready');
    } catch (e) {
      logger.error('MFA gate check failed', e);
      setGateError(e instanceof Error ? e.message : 'Security check failed');
      setPhase('error');
    }
  }, [user, userRole]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPhase('idle');
      setChallengeFactor(null);
      return;
    }
    if (!userRole) {
      setPhase('loading');
      return;
    }
    void runCheck();
  }, [authLoading, user, userRole, session?.expires_at, runCheck]);

  useEffect(() => {
    if (phase === 'challenge' && !challengeFactor) {
      const id = window.setTimeout(() => void runCheck(), 100);
      return () => window.clearTimeout(id);
    }
  }, [phase, challengeFactor, runCheck]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  if (!user || authLoading) {
    return <>{children}</>;
  }

  if (!userRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-muted-foreground">Loading your account…</p>
      </div>
    );
  }

  if (!roleRequiresMfa(userRole)) {
    return <>{children}</>;
  }

  if (phase === 'loading' || phase === 'idle') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-muted-foreground">Checking security settings…</p>
      </div>
    );
  }

  if (phase === 'enroll') {
    return <MfaEnrollmentScreen onEnrolled={() => void runCheck()} onSignOut={handleSignOut} />;
  }

  if (phase === 'challenge') {
    if (!challengeFactor) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          <p className="text-muted-foreground">Preparing verification…</p>
        </div>
      );
    }
    return (
      <MfaChallengeScreen
        factor={challengeFactor}
        onSuccess={() => void runCheck()}
        onSignOut={handleSignOut}
      />
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Security check unavailable</CardTitle>
            <CardDescription>
              We could not confirm two-factor status for your account. You cannot continue until
              this succeeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {gateError ? <p className="text-sm text-destructive">{gateError}</p> : null}
            <Button type="button" className="w-full" onClick={() => void runCheck()}>
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
