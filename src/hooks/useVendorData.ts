import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { VendorJob } from '@/components/vendor/vendor-job-data';

export function useVendorData() {
  const { user } = useAuthSession();
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorJobs = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 1. Get the vendor profile for the current user
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (vendorError || !vendorData) {
          throw new Error(
            'Could not find a vendor profile associated with this user. Please contact an administrator.'
          );
        }

        const vendorId = vendorData.id;

        // 2. Fetch jobs for this vendor from the vendor_jobs table
        const { data: jobsData, error: jobsError } = await supabase
          .from('vendor_jobs')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        if (jobsError) {
          throw jobsError;
        }

        setJobs(jobsData || []);
      } catch (err: any) {
        console.error('Error fetching vendor data:', err);
        setError(err.message || 'An unexpected error occurred while fetching your jobs.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorJobs();
  }, [user]);

  return { jobs, isLoading, error };
}
