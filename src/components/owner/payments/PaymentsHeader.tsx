
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface PaymentsHeaderProps {
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  loadPayments: () => void;
  loading: boolean;
}

export const PaymentsHeader = ({ dateRange, setDateRange, loadPayments, loading }: PaymentsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-3xl font-bold">Payment Management</h2>
        <p className="text-muted-foreground">Track and manage your property income</p>
      </div>
      
      <div className="flex items-center gap-2">
        <DateRangePicker
          value={dateRange}
          onValueChange={setDateRange}
          align="end"
          className="w-auto"
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={loadPayments}
          disabled={loading}
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};
