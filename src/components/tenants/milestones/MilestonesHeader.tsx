import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MilestonesHeaderProps {
  onCheckMilestones: () => void;
}

export function MilestonesHeader({ onCheckMilestones }: MilestonesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Rental Milestones</h2>
        <p className="text-muted-foreground">Track important dates and events for your tenants</p>
      </div>

      <Button onClick={onCheckMilestones}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Check Milestones
      </Button>
    </div>
  );
}
