import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { toast } from "sonner";
import { DateRange } from 'react-day-picker';
import { getAccountingSummary } from '@/services/payments/accounting';
import { getRentRoll } from '@/services/reports/rentRoll';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: (type: string, data: any, dateRange: DateRange) => void;
}

export const GenerateReportDialog = ({ open, onOpenChange, onReportGenerated }: GenerateReportDialogProps) => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast.error("Please select a report type.");
      return;
    }
    if (!dateRange || !dateRange.from || !dateRange.to) {
        toast.error("Please select a date range.");
        return;
    }

    setIsGenerating(true);
    toast.info("Generating your report...");

    try {
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      if (reportType === 'financial_summary') {
        const summary = await getAccountingSummary(fromDate, toDate);
        onReportGenerated(reportType, summary, dateRange);
        toast.success("Financial summary generated successfully!");
      } else if (reportType === 'rent_roll') {
        const rentRollData = await getRentRoll(fromDate, toDate);
        onReportGenerated(reportType, rentRollData, dateRange);
        toast.success("Rent roll report generated successfully!");
      } else {
        toast.info(`Report type "${reportType}" is not yet implemented.`);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setReportType('');
            setDateRange(undefined);
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate New Report</DialogTitle>
          <DialogDescription>
            Select the type of report and the date range you want to cover.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-type" className="text-right">
              Report Type
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="col-span-3">
                    <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="financial_summary">Financial Summary</SelectItem>
                    <SelectItem value="occupancy_report">Occupancy Report</SelectItem>
                    <SelectItem value="maintenance_costs">Maintenance Costs</SelectItem>
                    <SelectItem value="rent_roll">Rent Roll</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date-range" className="text-right">
              Date Range
            </Label>
            <div className="col-span-3">
              <DateRangePicker
                value={dateRange}
                onValueChange={setDateRange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
