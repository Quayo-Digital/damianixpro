import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';

type RequirePermissionProps = {
  /** Permission id from `config/rbac-permission-matrix.json` (e.g. `properties.read`). */
  permission: string;
  children: ReactNode;
};

/**
 * Declarative guard for feature sections. For full routes, prefer `ProtectedRoute` with `requiredPermission`.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { isLoading, user, hasPermission } = useAuthSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
