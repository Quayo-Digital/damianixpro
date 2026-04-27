import { useVendorData } from '@/hooks/useVendorData';
import { VendorJobList } from './VendorJobList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function VendorMaintenanceManagement() {
  const { jobs, isLoading, error } = useVendorData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Jobs</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job List</CardTitle>
        <CardDescription>A list of all your assigned maintenance jobs.</CardDescription>
      </CardHeader>
      <CardContent>
        <VendorJobList jobs={jobs} />
      </CardContent>
    </Card>
  );
}
