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
        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">
          No {filter !== 'all' ? filter : ''} milestones found
        </h3>
        <p className="mt-2 text-center text-muted-foreground">
          {filter !== 'all'
            ? `There are no ${filter} milestones to display.`
            : 'There are no rental milestones to display.'}
        </p>
      </CardContent>
    </Card>
  );
}
