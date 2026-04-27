import { Navigate, useLocation } from 'react-router-dom';
import { pathForTenantPortalHash } from '@/utils/tenantPortalRoutes';

/**
 * Permanent redirect from legacy `/tenant-portal#tab` to enhanced dashboard or dedicated routes.
 */
export default function TenantPortalRedirect() {
  const { hash } = useLocation();
  const to = pathForTenantPortalHash(hash);
  return <Navigate to={to} replace />;
}
