import { Navigate } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';
import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Resolves bare `/payments` to the correct surface (owner portal, tenant portal, admin, etc.).
 */
export default function PaymentsRedirectPage() {
  const {
    loading,
    isLoading,
    isOwner,
    isTenant,
    isAdmin,
    isSuperAdmin,
    isAgent,
    isManager,
    isVendor,
  } = useAuthSession();

  if (loading || isLoading) {
    return <PageLoader />;
  }

  if (isTenant()) {
    return <Navigate to="/tenant/dashboard?tab=payments" replace />;
  }
  if (isOwner()) {
    return <Navigate to="/owner/payments" replace />;
  }
  if (isSuperAdmin() || isAdmin()) {
    return <Navigate to="/admin/accounting" replace />;
  }
  if (isAgent()) {
    return <Navigate to="/agent/dashboard" replace />;
  }
  if (isManager()) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isVendor()) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
