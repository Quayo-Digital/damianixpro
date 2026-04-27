import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthSession, useAuthActions } from '@/contexts/auth';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';
import { ShieldAlert, Home, ArrowLeft, AlertCircle } from 'lucide-react';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 dark:bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center text-card-foreground shadow-md">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-950/50">
            <ShieldAlert size={36} className="text-yellow-500 dark:text-yellow-400" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-foreground">Access Denied</h1>

        <p className="mb-4 text-lg text-muted-foreground">
          You don't have sufficient permissions to access this page.
        </p>

        <div className="text-md mb-6 flex items-start rounded-md bg-blue-50 p-4 text-blue-800">
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
          <Button
            onClick={() => navigate(getDashboardPath())}
            className="h-auto w-full bg-green-500 py-3 text-white hover:bg-green-600"
          >
            <Home size={20} className="mr-2" />
            Go to Your Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={handleRefreshAndRetry}
            className="h-auto w-full border border-border bg-background py-3 text-foreground hover:bg-muted/50"
          >
            <AlertCircle size={20} className="mr-2" />
            Refresh Role & Retry
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-auto w-full border border-border bg-background py-3 text-foreground hover:bg-muted/50"
          >
            <ArrowLeft size={20} className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
