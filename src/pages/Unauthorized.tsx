import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthSession, useAuthActions } from '@/contexts/auth';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';
import { ShieldAlert, Home, ArrowLeft, AlertCircle } from 'lucide-react';
import { BodyText, PageTitle } from '@/components/ui/typography';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { userRole } = useAuthSession();
  const { refreshUserRole } = useAuthActions();

  // Only log in development mode
  if (import.meta.env.DEV) {
    console.debug('Unauthorized page - Current user role:', userRole);
  }

  // Try to refresh user role to ensure we have the latest
  const handleRefreshAndRetry = async () => {
    await refreshUserRole();
    navigate(-1); // Go back to previous page after refreshing role
  };

  // Determine the correct dashboard based on user role
  const getDashboardPath = () => getDefaultDashboardPathForRole(userRole as UserRole);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 dark:bg-background">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center text-card-foreground shadow-card sm:p-8">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-950/50">
            <ShieldAlert size={36} className="text-yellow-500 dark:text-yellow-400" />
          </div>
        </div>

        <PageTitle className="mb-4">Access Denied</PageTitle>

        <BodyText className="mb-4">
          You don't have sufficient permissions to access this page.
        </BodyText>

        <div className="text-md mb-6 flex items-start rounded-md border border-border bg-accent/40 p-4 text-foreground">
          <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="font-medium">
              Your current role: <span className="font-bold">{userRole || 'unknown'}</span>
            </p>
            <p className="mt-2">
              Different features are available based on your role. If you believe this is an error,
              please contact support.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={() => navigate(getDashboardPath())} className="h-11 w-full">
            <Home size={20} className="mr-2" />
            Go to Your Dashboard
          </Button>

          <Button variant="outline" onClick={handleRefreshAndRetry} className="h-11 w-full">
            <AlertCircle size={20} className="mr-2" />
            Refresh Role & Retry
          </Button>

          <Button variant="outline" onClick={() => navigate(-1)} className="h-11 w-full">
            <ArrowLeft size={20} className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
