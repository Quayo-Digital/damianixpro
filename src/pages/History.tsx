
import { AlertCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/hooks/useActivities';
import { SearchControls } from '@/components/history/SearchControls';
import { ErrorState } from '@/components/history/ErrorState';
import { LoadingIndicator } from '@/components/history/LoadingState';
import { ActivitiesTable } from '@/components/history/ActivitiesTable';
import { PaginationControls } from '@/components/history/PaginationControls';

const History = () => {
  const { session } = useAuth();
  const { 
    filteredActivities,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    page,
    searchQuery,
    hasActivities,
    checkingActivities,
    totalCount,
    totalPages,
    isRefreshing,
    handleSearch,
    clearSearch,
    handleRefresh,
    handlePageChange
  } = useActivities();

  return (
    <PageLayout>
      <PageContent 
        title="Activity History" 
        description="View all activities and transactions"
      >
        {/* Search and Filter Controls */}
        <SearchControls
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          clearSearch={clearSearch}
          handleRefresh={handleRefresh}
          isLoading={isLoading}
          isFetching={isFetching}
          isRefreshing={isRefreshing}
          hasActivities={hasActivities}
        />

        {/* Authentication Alert */}
        {!session && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please log in to view your activity history.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Loading Indicator */}
        {(isLoading && !isError) && <LoadingIndicator isRefetching={isRefetching} />}

        {/* Error State */}
        {isError && <ErrorState error={error} refetch={refetch} />}

        {/* Activities Table */}
        {!isError && (
          <ActivitiesTable
            isLoading={isLoading}
            isFetching={isFetching}
            filteredActivities={filteredActivities}
            searchQuery={searchQuery}
            checkingActivities={checkingActivities}
            hasActivities={hasActivities}
            isAuthenticated={!!session}
          />
        )}
        
        {/* Pagination */}
        {totalPages > 0 && !isError && !isLoading && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            handlePageChange={handlePageChange}
            isFetching={isFetching}
          />
        )}
      </PageContent>
    </PageLayout>
  );
};

export default History;
