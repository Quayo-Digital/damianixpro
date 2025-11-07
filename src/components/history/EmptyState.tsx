
import { Calendar } from 'lucide-react';

interface EmptyStateProps {
  isAuthenticated: boolean;
}

export const EmptyState = ({ isAuthenticated }: EmptyStateProps) => {
  return (
    <div className="text-center py-10">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium">No Activities Yet</h3>
      <p className="text-muted-foreground mt-2 mb-6">
        {!isAuthenticated 
          ? 'Please log in to view your activities.' 
          : 'Your activity history will appear here once you start recording activities.'}
      </p>
    </div>
  );
};
