import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter, Calendar, RefreshCw, Loader2 } from 'lucide-react';

interface SearchControlsProps {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearSearch: () => void;
  handleRefresh: () => void;
  isLoading: boolean;
  isFetching: boolean;
  isRefreshing: boolean;
  hasActivities: boolean | null;
}

export const SearchControls = ({
  searchQuery,
  handleSearch,
  clearSearch,
  handleRefresh,
  isLoading,
  isFetching,
  isRefreshing,
  hasActivities,
}: SearchControlsProps) => {
  return (
    <div className="premium-toolbar mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search activities..."
          className="rounded-xl border-border bg-background pl-8 pr-8 dark:bg-muted/30"
          value={searchQuery}
          onChange={handleSearch}
          disabled={isLoading || !hasActivities}
        />
        {searchQuery && (
          <button
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
            aria-label="Clear search"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 rounded-full border-primary/30 bg-background dark:bg-muted/30"
          disabled={isLoading || isFetching}
        >
          <Calendar className="h-4 w-4" />
          Date Range
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 rounded-full border-primary/30 bg-background dark:bg-muted/30"
          disabled={isLoading || isFetching}
        >
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isFetching || isRefreshing}
          aria-label="Refresh activities"
          className="relative rounded-full border-primary/30 bg-background dark:bg-muted/30"
        >
          {isFetching || isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>
    </div>
  );
};
