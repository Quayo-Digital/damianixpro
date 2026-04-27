import { useRentalMilestones } from './milestones/useRentalMilestones';
import { MilestoneCard } from './milestones/MilestoneCard';
import { MilestoneSkeleton } from './milestones/MilestoneSkeleton';
import { MilestoneFilter } from './milestones/MilestoneFilter';
import { EmptyState } from './milestones/EmptyState';
import { MilestonesHeader } from './milestones/MilestonesHeader';

export function RentalMilestones() {
  const {
    isLoading,
    filter,
    setFilter,
    handleCheckMilestones,
    handleSendNotification,
    filteredMilestones,
  } = useRentalMilestones();

  return (
    <div className="space-y-6">
      <MilestonesHeader onCheckMilestones={handleCheckMilestones} />

      <MilestoneFilter filter={filter} setFilter={setFilter} />

      {isLoading ? (
        <MilestoneSkeleton />
      ) : filteredMilestones.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onSendNotification={handleSendNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
