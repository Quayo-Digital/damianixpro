import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const VendorJobsRLSFix: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const showSQLInstructions = () => {
    const sqlScript = `-- Fix vendor_jobs RLS policy to allow vendors to create jobs
-- Run this SQL in Supabase Studio SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Vendor jobs management" ON public.vendor_jobs;

-- Create a new policy that allows vendors to create jobs for themselves
CREATE POLICY "Vendor jobs management"
ON public.vendor_jobs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'owner', 'agent')
    ) OR  -- Admins, owners, and agents can manage all jobs
    EXISTS (
        SELECT 1 FROM public.vendors v 
        WHERE v.id = vendor_id AND v.user_id = auth.uid()
    )  -- Vendors can create and manage their own jobs
);

-- Verification query
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'vendor_jobs' 
AND schemaname = 'public';`;

    setResult(sqlScript);
    setStatus('idle');
  };

  const applyRLSFix = async () => {
    setIsRunning(true);
    setResult('');
    setStatus('idle');

    try {
      console.log('Testing current RLS policy...');

      // Test if we can query the policies table to understand the current state
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'vendor_jobs')
        .eq('schemaname', 'public');

      if (policiesError) {
        console.log('Cannot query pg_policies directly, showing SQL instructions instead');
        showSQLInstructions();
        return;
      }

      console.log('Current vendor_jobs policies:', policies);

      setResult(`📋 MANUAL FIX REQUIRED:

Current vendor_jobs RLS policies found: ${policies?.length || 0}

To fix the RLS policy issue:

1. Open Supabase Studio at http://localhost:54323
2. Go to SQL Editor
3. Run the SQL script shown below
4. Then re-run the vendor onboarding tests

Click "Show SQL Script" to see the exact SQL to run.`);
      setStatus('success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('RLS fix failed:', errorMessage, error);
      setResult(`❌ ERROR: ${errorMessage}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const StatusIcon =
    status === 'success' ? CheckCircle : status === 'error' ? AlertCircle : Database;
  const statusColor =
    status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600';

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Vendor Jobs RLS Policy Fix
        </CardTitle>
        <CardDescription>
          Fix the Row-Level Security policy on vendor_jobs table to allow vendors to create their
          own jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={applyRLSFix} disabled={isRunning} className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {isRunning ? 'Applying Fix...' : 'Apply RLS Policy Fix'}
          </Button>
        </div>

        {result && (
          <div
            className={`rounded-lg border p-4 ${
              status === 'success'
                ? 'border-green-200 bg-green-50'
                : status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <StatusIcon className={`mt-0.5 h-5 w-5 ${statusColor}`} />
              <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Issue:</strong> Vendor onboarding tests fail with "new row violates row-level
            security policy for table vendor_jobs"
          </p>
          <p>
            <strong>Root Cause:</strong> Current RLS policy only allows admin/owner/agent roles to
            create jobs, but test runs as vendor user
          </p>
          <p>
            <strong>Solution:</strong> Update policy to allow vendors to create jobs for themselves
            while maintaining security
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
