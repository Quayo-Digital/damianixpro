
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { MilestoneFilterType } from './types';

interface EmptyStateProps {
  filter: MilestoneFilterType;
}

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No {filter !== 'all' ? filter : ''} milestones found</h3>
        <p className="text-center text-muted-foreground mt-2">
          {filter !== 'all' 
            ? `There are no ${filter} milestones to display.` 
            : 'There are no rental milestones to display.'}
        </p>
      </CardContent>
    </Card>
  );
}
