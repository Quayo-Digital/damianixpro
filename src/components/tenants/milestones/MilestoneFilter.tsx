
import { Badge } from '@/components/ui/badge';
import { MilestoneFilterType } from './types';

interface MilestoneFilterProps {
  filter: MilestoneFilterType;
  setFilter: (filter: MilestoneFilterType) => void;
}

const filters: { label: string; value: MilestoneFilterType; color: string; hoverColor: string; }[] = [
    { label: 'All', value: 'all', color: 'bg-primary', hoverColor: '' },
    { label: 'Upcoming', value: 'upcoming', color: 'bg-blue-500', hoverColor: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { label: 'Active', value: 'active', color: 'bg-green-500', hoverColor: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { label: 'Overdue', value: 'overdue', color: 'bg-red-500', hoverColor: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { label: 'Completed', value: 'completed', color: 'bg-gray-500', hoverColor: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
];

export function MilestoneFilter({ filter, setFilter }: MilestoneFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(f => (
        <Badge 
          key={f.value}
          className={`cursor-pointer ${filter === f.value ? f.color : (f.value === 'all' ? 'bg-secondary' : f.hoverColor)}`}
          onClick={() => setFilter(f.value)}
        >
          {f.label}
        </Badge>
      ))}
    </div>
  );
}
