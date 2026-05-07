import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface ProtectedRouteProps {
  children?: ReactNode;
  requiredRole?: UserRole | string;
  allowedRoles?: UserRole[];
  /** RBAC: requires permission key from `config/rbac-permission-matrix.json`. `super_admin` passes via matrix. */
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, userRole, isLoading, hasPermission } = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const hasShownToast = useRef(false);

  const needsTenantOnboarding =
    !!user && userRole === 'tenant' && user.user_metadata?.onboarded !== true;

  useEffect(() => {
    // If tenant is authenticated but not explicitly onboarded, redirect to onboarding
    if (!isLoading && needsTenantOnboarding && location.pathname !== '/onboarding') {
      logger.debug('Tenant not onboarded, redirecting to onboarding');
      navigate('/onboarding', { replace: true });
    }
  }, [needsTenantOnboarding, isLoading, navigate, location.pathname]);

  // Handle unauthorized access with toast notifications
  useEffect(() => {
    if (isLoading || !user || !userRole || hasShownToast.current) {
      return;
    }

    // Check requiredRole
    if (requiredRole && userRole !== requiredRole && userRole !== 'super_admin') {
      hasShownToast.current = true;
      toast.error(`You need ${requiredRole} permissions to access this page`);
      return;
    }

    // Check allowedRoles
    if (allowedRoles && userRole !== 'super_admin' && !allowedRoles.includes(userRole)) {
      hasShownToast.current = true;
      toast.error(
        `You don't have permission to access this page. Required roles: ${allowedRoles.join(', ')}`
      );
      return;
    }

    if (requiredPermission && userRole && !hasPermission(requiredPermission)) {
      hasShownToast.current = true;
      toast.error('You do not have access to this area.');
      return;
    }
  }, [isLoading, user, userRole, requiredRole, allowedRoles, requiredPermission, hasPermission]);

  // Reset toast flag when route changes
  useEffect(() => {
    hasShownToast.current = false;
  }, [location.pathname]);

  // Show loading while checking auth or waiting for user role
  if (
    isLoading ||
    (requiredRole && !userRole) ||
    (allowedRoles && !userRole) ||
    (requiredPermission && user && !userRole)
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        <h2 className="mt-4 text-xl font-semibold">Verifying authentication...</h2>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    // Preserve the attempted URL to redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If tenant onboarding is required but not completed, redirect to onboarding
  if (needsTenantOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If a specific role is required and user doesn't have it
  // super_admin should have access to all protected routes
  if (requiredRole && userRole !== requiredRole && userRole !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // If allowedRoles is specified, check if user's role is in the allowed list
  // super_admin should have access to all protected routes
  if (allowedRoles && userRole && userRole !== 'super_admin') {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requiredPermission && userRole && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If we have children, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
}
