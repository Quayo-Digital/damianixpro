import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, Loader2 } from 'lucide-react';
import { useOwnerSubscriptionAccess } from '@/hooks/useOwnerSubscriptionAccess';

export function OwnerSubscriptionGateBanner() {
  const { hasPaidOwnerAccess, isCheckingAccess } = useOwnerSubscriptionAccess();

  if (isCheckingAccess) {
    return (
      <Alert className="mb-6 border-muted bg-muted/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking subscription</AlertTitle>
        <AlertDescription>Verifying your plan…</AlertDescription>
      </Alert>
    );
  }

  if (hasPaidOwnerAccess) return null;

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
      <Crown className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Choose a plan to list properties
      </AlertTitle>
      <AlertDescription className="mt-2 text-amber-900/90 dark:text-amber-100/90">
        You can use your dashboard, but adding properties and short-let listings requires an active
        subscription or trial. Pick a plan to unlock listing tools.
        <div className="mt-3">
          <Button asChild size="sm" className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600">
            <Link to="/owner/subscription">View plans & subscribe</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
