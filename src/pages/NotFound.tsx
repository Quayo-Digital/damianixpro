import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';
import { Home, ArrowLeft } from 'lucide-react';

// Changed from named export to default export
const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuthSession();

  // Determine the appropriate dashboard based on user role
  const getDashboardPath = () => {
    if (!user) return '/auth';
    return getDefaultDashboardPathForRole(userRole as UserRole);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-8 text-center shadow-lg">
        <h1 className="mb-4 text-3xl font-bold">404 - Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        {location.pathname && (
          <p className="mb-4 text-sm text-muted-foreground">
            Attempted path: <code className="rounded bg-muted px-2 py-1">{location.pathname}</code>
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate('/')} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
          {user && (
            <Button
              variant="outline"
              onClick={() => navigate(getDashboardPath())}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(-1)} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export the component as default
export default NotFound;

// Keep the named export for backward compatibility
export { NotFound };
