import { Badge } from '@/components/ui/badge';
import { MilestoneFilterType } from './types';

interface MilestoneFilterProps {
  filter: MilestoneFilterType;
  setFilter: (filter: MilestoneFilterType) => void;
}

const filters: { label: string; value: MilestoneFilterType; color: string; hoverColor: string }[] =
  [
    { label: 'All', value: 'all', color: 'bg-primary', hoverColor: '' },
    {
      label: 'Upcoming',
      value: 'upcoming',
      color: 'bg-accent text-accent-foreground',
      hoverColor: 'bg-accent/70 text-accent-foreground hover:bg-accent',
    },
    {
      label: 'Active',
      value: 'active',
      color: 'bg-primary text-primary-foreground',
      hoverColor: 'bg-primary/20 text-primary hover:bg-primary/25',
    },
    {
      label: 'Overdue',
      value: 'overdue',
      color: 'bg-destructive text-destructive-foreground',
      hoverColor: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
    },
    {
      label: 'Completed',
      value: 'completed',
      color: 'bg-secondary text-secondary-foreground',
      hoverColor: 'bg-secondary/70 text-secondary-foreground hover:bg-secondary',
    },
  ];

export function MilestoneFilter({ filter, setFilter }: MilestoneFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <Badge
          key={f.value}
          className={`cursor-pointer ${filter === f.value ? f.color : f.value === 'all' ? 'bg-secondary' : f.hoverColor}`}
          onClick={() => setFilter(f.value)}
        >
          {f.label}
        </Badge>
      ))}
    </div>
  );
}
