import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthActions } from '@/contexts/auth';
import {
  consumeAuthReturnTo,
  getDefaultDashboardPathForRole,
  getPostLoginRedirect,
  navigateToPostLoginTarget,
} from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';
import { PageLoader } from '@/components/ui/PageLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';

/**
 * OAuth Callback Handler
 * Handles the redirect from OAuth providers (Google, etc.)
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUserRole } = useAuthActions();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.debug('AuthCallback location', {
      href: window.location.href,
      origin: window.location.origin,
    });

    // Check if we're on Lovable.dev
    if (
      window.location.origin.includes('lovable.dev') ||
      window.location.origin.includes('lovable-dev')
    ) {
      logger.error(
        'Auth callback on Lovable.dev — update Supabase redirect URLs',
        new Error('Invalid OAuth callback host')
      );
      setError(
        'Configuration error: Supabase is redirecting to the wrong domain. Please update Supabase URL Configuration in the dashboard.'
      );
      setStatus('error');
      return;
    }

    const handleOAuthCallback = async () => {
      try {
        // Get the code and error from URL parameters
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          logger.error('OAuth error', undefined, { error, errorDescription });
          setError(errorDescription || error || 'Authentication failed');
          setStatus('error');
          return;
        }

        if (!code) {
          // Check if we already have a session (user might have been redirected back)
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            setStatus('success');
            const refreshedRole = await refreshUserRole();
            setTimeout(() => {
              const returnTo = consumeAuthReturnTo();
              const resolved = returnTo
                ? getPostLoginRedirect(
                    { pathname: returnTo.pathname, search: returnTo.search, hash: returnTo.hash },
                    refreshedRole
                  )
                : null;
              if (resolved && resolved !== '/dashboard') {
                navigateToPostLoginTarget(navigate, resolved, { replace: true });
              } else {
                navigate(getDefaultDashboardPathForRole(refreshedRole as UserRole), {
                  replace: true,
                });
              }
            }, 1500);
            return;
          }

          setError('No authorization code received');
          setStatus('error');
          return;
        }

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          logger.error('OAuth code exchange failed', exchangeError);
          setError(exchangeError.message || 'Failed to complete authentication');
          setStatus('error');
          return;
        }

        if (data.session && data.user) {
          logger.debug('OAuth authentication successful', { userId: data.user.id });

          // Check if this is a new user (no profile exists)
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', data.user.id)
            .maybeSingle();

          // If new user, they might need to complete onboarding
          if (!profile || !profile.role) {
            // Redirect to onboarding to select role
            setStatus('success');
            setTimeout(() => {
              navigate('/onboarding');
            }, 1500);
            return;
          }

          // Existing user - refresh role and redirect to role-specific dashboard
          const refreshedRole = await refreshUserRole();
          setStatus('success');
          setTimeout(() => {
            const returnTo = consumeAuthReturnTo();
            const resolved = returnTo
              ? getPostLoginRedirect(
                  { pathname: returnTo.pathname, search: returnTo.search, hash: returnTo.hash },
                  refreshedRole
                )
              : null;
            if (resolved && resolved !== '/dashboard') {
              navigateToPostLoginTarget(navigate, resolved, { replace: true });
            } else {
              navigate(getDefaultDashboardPathForRole(refreshedRole as UserRole), {
                replace: true,
              });
            }
          }, 1500);
        } else {
          setError('No session created');
          setStatus('error');
        }
      } catch (err: unknown) {
        logger.error('OAuth callback error', err instanceof Error ? err : undefined);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, refreshUserRole]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <PageLoader />
              <p className="text-sm text-muted-foreground">Completing authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>We couldn't complete your sign-in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'An error occurred during authentication'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <h2 className="text-xl font-semibold">Authentication Successful!</h2>
            <p className="text-sm text-muted-foreground">Redirecting you to your dashboard...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
