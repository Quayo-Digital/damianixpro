import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { getScreeningForTenant } from '@/services/tenants/screening';

// Types for the screening results
type ScreeningStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
type VerificationType = 'background' | 'credit' | 'criminal' | 'employment' | 'rental_history';

interface ScreeningResult {
  type: VerificationType;
  status: ScreeningStatus;
  score?: number;
  notes?: string;
  verified: boolean;
}

interface TenantScreeningProps {
  tenantId: string;
  tenantName?: string;
}

export function TenantScreening({ tenantId, tenantName = 'Applicant' }: TenantScreeningProps) {
  const { data: screening, isLoading: isLoadingScreening } = useQuery({
    queryKey: ['tenantScreening', tenantId],
    queryFn: () => getScreeningForTenant(tenantId),
    enabled: !!tenantId,
  });

  const screeningResults: ScreeningResult[] = screening?.results ? (screening.results as any) : [];

  const getStatusBadge = (status: ScreeningStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-amber-500" />
    );
  };

  const getVerificationTypeLabel = (type: VerificationType) => {
    switch (type) {
      case 'background':
        return 'Background Check';
      case 'credit':
        return 'Credit Score';
      case 'criminal':
        return 'Criminal History';
      case 'employment':
        return 'Employment Verification';
      case 'rental_history':
        return 'Rental History';
      default:
        return type;
    }
  };

  const overallVerificationStatus = screeningResults.every((r) => r.verified)
    ? 'verified'
    : screeningResults.length > 0
      ? 'failed'
      : 'pending';

  if (isLoadingScreening) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tenant Screening</CardTitle>
          <CardDescription>Verify applicant background and credentials</CardDescription>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!screening || !screening.results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tenant Screening</CardTitle>
          <CardDescription>Screening for {tenantName}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Screening results are not yet available.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Current status:</span>
            <Badge variant="outline">{screening?.status || 'Not initiated'}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Screening Results</CardTitle>
          <CardDescription>Applicant: {tenantName}</CardDescription>
        </div>

        {overallVerificationStatus === 'verified' ? (
          <Badge className="bg-green-500">All Verified</Badge>
        ) : screeningResults.length > 0 ? (
          <Badge variant="destructive">Issues Found</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {screeningResults.map((result, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.verified)}
                <span>{getVerificationTypeLabel(result.type)}</span>
                {result.score && (
                  <span className="text-sm text-muted-foreground">({result.score})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(result.status)}

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{getVerificationTypeLabel(result.type)} Details</SheetTitle>
                      <SheetDescription>
                        Detailed information about {tenantName}'s {result.type} verification
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <div>
                        <h4 className="font-medium">Status</h4>
                        <p className="text-sm text-muted-foreground">{result.status}</p>
                      </div>
                      {result.score && (
                        <div>
                          <h4 className="font-medium">Score</h4>
                          <p className="text-sm text-muted-foreground">{result.score}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">Verification Method</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.type === 'credit'
                            ? 'TransUnion Credit Check'
                            : result.type === 'criminal'
                              ? 'National Criminal Database'
                              : result.type === 'background'
                                ? 'Background Check Service'
                                : result.type === 'employment'
                                  ? 'Employer Verification'
                                  : 'Previous Landlord Contact'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Notes</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.notes || 'No additional notes available.'}
                        </p>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
