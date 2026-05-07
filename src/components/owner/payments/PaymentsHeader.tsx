import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface PaymentsHeaderProps {
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  loadPayments: () => void;
  loading: boolean;
}

export const PaymentsHeader = ({
  dateRange,
  setDateRange,
  loadPayments,
  loading,
}: PaymentsHeaderProps) => {
  return (
    <div className="flex flex-col items-stretch justify-end gap-4 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DateRangePicker
          value={dateRange}
          onValueChange={setDateRange}
          align="end"
          className="w-auto"
        />
        <Button variant="outline" size="icon" onClick={loadPayments} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};
