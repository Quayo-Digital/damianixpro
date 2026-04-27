import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useRoleScreening } from '@/hooks/useRoleScreening';

export function RoleScreeningBanner() {
  const { data, isLoading, isError } = useRoleScreening();

  if (isLoading || isError || !data || data.passed) return null;

  return (
    <Alert
      variant="destructive"
      className="mb-4 border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50"
    >
      <ShieldAlert className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">Verification required</AlertTitle>
      <AlertDescription className="mt-2 space-y-3 text-amber-900/90 dark:text-amber-100/90">
        <p>Finish the checks below to unlock all actions on the platform.</p>
        <ul className="list-inside list-disc space-y-1 text-sm">
          {data.missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Button asChild size="sm" variant="secondary" className="mt-1">
          <Link to="/verification">Open verification hub</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
