import { Calendar } from 'lucide-react';

interface EmptyStateProps {
  isAuthenticated: boolean;
}

export const EmptyState = ({ isAuthenticated }: EmptyStateProps) => {
  return (
    <div className="py-10 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium">No Activities Yet</h3>
      <p className="mb-6 mt-2 text-muted-foreground">
        {!isAuthenticated
          ? 'Please log in to view your activities.'
          : 'Your activity history will appear here once you start recording activities.'}
      </p>
    </div>
  );
};
