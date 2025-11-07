import { useState, useEffect } from 'react';
import { RentalApplication } from '@/services/applications/types';
import { 
  getAllApplications, 
  getUserApplications,
  getApplicationsByPropertyId 
} from '@/services/applications/applicationApi';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

export function useApplications(propertyId?: string) {
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'more_info'>('all');
  const { isAgent, isOwner } = useAuth();
  
  useEffect(() => {
    fetchApplications();
  }, [propertyId]);
  
  const fetchApplications = async () => {
    setLoading(true);
    try {
      let fetchedApplications: RentalApplication[] = [];
      
      // If propertyId is provided, fetch applications for that property
      if (propertyId) {
        fetchedApplications = await getApplicationsByPropertyId(propertyId);
      } else if (isAgent() || isOwner()) {
        // If user is an agent/owner, fetch all applications they have access to
        fetchedApplications = await getAllApplications();
      } else {
        // Otherwise, fetch applications submitted by the current user
        fetchedApplications = await getUserApplications();
      }
      
      setApplications(fetchedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);
  
  return {
    applications: filteredApplications,
    allApplications: applications,
    loading,
    filter,
    setFilter,
    refresh: fetchApplications
  };
}
