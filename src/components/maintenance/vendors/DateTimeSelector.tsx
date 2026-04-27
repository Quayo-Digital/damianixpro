import { Label } from '@/components/ui/label';
import { DateSelector } from './DateSelector';
import { TimeSelector } from './TimeSelector';

interface DateTimeSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  time: string;
  onTimeChange: (time: string) => void;
}

export function DateTimeSelector({
  date,
  onDateChange,
  time,
  onTimeChange,
}: DateTimeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Date</Label>
        <DateSelector date={date} onSelect={onDateChange} />
      </div>

      <div className="space-y-2">
        <Label>Time</Label>
        <TimeSelector value={time} onChange={onTimeChange} />
      </div>
    </div>
  );
}
