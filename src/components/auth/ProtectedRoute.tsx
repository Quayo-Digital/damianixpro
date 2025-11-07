
import { ReactNode, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';
import { toast } from 'sonner';

export interface ProtectedRouteProps {
  children?: ReactNode;
  requiredRole?: UserRole | string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If authenticated but not onboarded, redirect to onboarding
    if (user && !isLoading && user.user_metadata?.onboarded === false) {
      // Don't redirect if already on onboarding page
      if (location.pathname !== '/onboarding') {
        console.log('User not onboarded, redirecting to onboarding');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  // Show loading while checking auth or waiting for user role
  if (isLoading || (requiredRole && !userRole)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-primary border-solid rounded-full border-t-transparent animate-spin"></div>
        <h2 className="mt-4 text-xl font-semibold">Verifying authentication...</h2>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    // Preserve the attempted URL to redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If onboarding is required but not completed, redirect to onboarding
  if (user.user_metadata?.onboarded === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If a specific role is required and user doesn't have it
  // super_admin should have access to all protected routes
  if (requiredRole && userRole !== requiredRole && userRole !== 'super_admin') {
    toast.error(`You need ${requiredRole} permissions to access this page`);
    return <Navigate to="/unauthorized" replace />;
  }

  // If we have children, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
}
