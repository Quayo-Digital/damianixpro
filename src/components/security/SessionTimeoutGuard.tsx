import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuthSession, useAuthActions } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Renders nothing. Enforces session timeout on inactivity and signs out when expired.
 */
export function SessionTimeoutGuard() {
  const { isAuthenticated } = useAuthSession();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  useSessionTimeout(authenticated, () => {
    navigate('/', { replace: true });
    signOut();
    toast.info('You have been signed out due to inactivity.');
  });

  return null;
}
