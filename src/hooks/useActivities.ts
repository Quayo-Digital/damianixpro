import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { ActivityItem, fetchActivities, checkActivitiesExist } from '@/services/activity';

export const useActivities = (initialPage = 1, initialPageSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasActivities, setHasActivities] = useState<boolean | null>(null);
  const [checkingActivities, setCheckingActivities] = useState(false);

  // Check if user has any activities
  useEffect(() => {
    const checkForActivities = async () => {
      setCheckingActivities(true);
      const exists = await checkActivitiesExist();
      setHasActivities(exists);
      setCheckingActivities(false);
    };

    checkForActivities();
  }, []);

  // Use react-query for data fetching with caching and error handling
  const {
    data: activitiesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
  } = useQuery({
    queryKey: ['activities', page, pageSize],
    queryFn: () => fetchActivities(page, pageSize),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Filter activities based on search query
  const filterActivities = useCallback((items: ActivityItem[], query: string) => {
    if (!query.trim()) return items;

    const lowerCaseQuery = query.toLowerCase();
    return items.filter(
      (activity) =>
        activity.description?.toLowerCase().includes(lowerCaseQuery) ||
        activity.type?.toLowerCase().includes(lowerCaseQuery) ||
        (activity.property && activity.property.toLowerCase().includes(lowerCaseQuery)) ||
        (activity.location && activity.location.toLowerCase().includes(lowerCaseQuery))
    );
  }, []);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset to first page when searching
    if (page !== 1) setPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    if (page !== 1) setPage(1);
  };

  // Handle refresh with debounce to prevent spam clicking
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    toast.promise(refetch(), {
      loading: 'Refreshing activities...',
      success: 'Activities refreshed successfully',
      error: 'Failed to refresh activities',
    });

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [refetch, isRefreshing]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil((activitiesData?.count || 0) / pageSize);
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate filtered activities
  const activities = activitiesData?.data || [];
  const filteredActivities = searchQuery.trim()
    ? filterActivities(activities, searchQuery)
    : activities;
  const totalCount = activitiesData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    activities,
    filteredActivities,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    page,
    pageSize,
    searchQuery,
    hasActivities,
    checkingActivities,
    totalCount,
    totalPages,
    isRefreshing,
    handleSearch,
    clearSearch,
    handleRefresh,
    handlePageChange,
    setPage,
  };
};
