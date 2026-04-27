// Database Cleanup Tests Component
// Provides UI to clean up duplicate tenant records and fix console errors

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { cleanupDuplicateTenants, checkForDuplicateTenants } from '@/utils/cleanupDuplicateTenants';

interface CleanupResult {
  success: boolean;
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: string[];
  message: string;
}

export function DatabaseCleanupTests() {
  const [isChecking, setIsChecking] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [duplicateStatus, setDuplicateStatus] = useState<{
    hasDuplicates: boolean;
    duplicateCount: number;
    totalTenants: number;
  } | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

  const handleCheckDuplicates = async () => {
    setIsChecking(true);
    setDuplicateStatus(null);

    try {
      const result = await checkForDuplicateTenants();
      setDuplicateStatus(result);
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaning(true);
    setCleanupResult(null);

    try {
      const result = await cleanupDuplicateTenants();
      setCleanupResult(result);

      // Refresh duplicate status after cleanup
      if (result.success) {
        const newStatus = await checkForDuplicateTenants();
        setDuplicateStatus(newStatus);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      setCleanupResult({
        success: false,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        message: 'Cleanup failed due to unexpected error',
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Cleanup Tests
          </CardTitle>
          <CardDescription>
            Fix console errors by cleaning up duplicate tenant records that cause PGRST116 errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Check for Duplicates Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">1. Check for Duplicate Records</h3>
              <Button onClick={handleCheckDuplicates} disabled={isChecking} variant="outline">
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Duplicates'
                )}
              </Button>
            </div>

            {duplicateStatus && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span>Total tenant records:</span>
                      <Badge variant="secondary">{duplicateStatus.totalTenants}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>User IDs with duplicates:</span>
                      <Badge variant={duplicateStatus.hasDuplicates ? 'destructive' : 'default'}>
                        {duplicateStatus.duplicateCount}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Status:</span>
                      {duplicateStatus.hasDuplicates ? (
                        <Badge variant="destructive">Duplicates Found - Cleanup Needed</Badge>
                      ) : (
                        <Badge variant="default">No Duplicates - Database Clean</Badge>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Cleanup Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">2. Clean Up Duplicate Records</h3>
              <Button
                onClick={handleCleanupDuplicates}
                disabled={isCleaning || !duplicateStatus?.hasDuplicates}
                variant={duplicateStatus?.hasDuplicates ? 'default' : 'secondary'}
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  'Clean Up Duplicates'
                )}
              </Button>
            </div>

            {!duplicateStatus?.hasDuplicates && duplicateStatus && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No duplicate records found. Database is clean and console errors should be
                  resolved.
                </AlertDescription>
              </Alert>
            )}

            {cleanupResult && (
              <Alert variant={cleanupResult.success ? 'default' : 'destructive'}>
                {cleanupResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{cleanupResult.message}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Duplicates found: {cleanupResult.duplicatesFound}</span>
                      <span>Records removed: {cleanupResult.duplicatesRemoved}</span>
                    </div>
                    {cleanupResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-600">Errors:</p>
                        <ul className="list-inside list-disc text-sm">
                          {cleanupResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">How This Fixes Console Errors:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>
                • <strong>PGRST116 Error:</strong> Caused by multiple tenant records for the same
                user_id
              </li>
              <li>
                • <strong>Smart Recommendations Error:</strong> AI service fails when tenant queries
                return multiple rows
              </li>
              <li>
                • <strong>Database Query Issues:</strong> .single() queries expect exactly one row
                but get multiple
              </li>
              <li>
                • <strong>Solution:</strong> Remove duplicate records, keeping the most recent one
                for each user
              </li>
            </ul>
          </div>

          {/* Post-Cleanup Instructions */}
          {cleanupResult?.success && (
            <div className="mt-4 rounded-lg bg-green-50 p-4">
              <h4 className="mb-2 font-medium text-green-900">✅ Cleanup Successful!</h4>
              <p className="text-sm text-green-800">
                Duplicate tenant records have been removed. Console errors should now be resolved.
                You may need to refresh the browser to see the changes take effect.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
