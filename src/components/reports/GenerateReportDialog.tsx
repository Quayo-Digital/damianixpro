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
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { getAccountingSummary } from '@/services/payments/accounting';
import { getRentRoll } from '@/services/reports/rentRoll';
import { getOccupancyReport } from '@/services/reports/occupancy';
import { getMaintenanceCosts } from '@/services/reports/maintenanceCosts';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: (type: string, data: any, dateRange: DateRange) => void;
}

export const GenerateReportDialog = ({
  open,
  onOpenChange,
  onReportGenerated,
}: GenerateReportDialogProps) => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  const reportOptions = [
    { value: 'financial_report', label: 'Financial Report', implemented: true },
    { value: 'rent_roll', label: 'Rent Roll', implemented: true },
    { value: 'occupancy_report', label: 'Occupancy Report', implemented: true },
    { value: 'maintenance_costs', label: 'Maintenance Costs', implemented: true },
  ] as const;

  const isImplementedReport = (type: string) =>
    reportOptions.some((opt) => opt.value === type && opt.implemented);

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast.error('Please select a report type.');
      return;
    }
    if (!dateRange || !dateRange.from || !dateRange.to) {
      toast.error('Please select a date range.');
      return;
    }
    if (!isImplementedReport(reportType)) {
      toast.info('This report type is coming soon.');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating your report...');

    try {
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      if (reportType === 'financial_report') {
        const summary = await getAccountingSummary(fromDate, toDate);
        onReportGenerated(reportType, summary, dateRange);
        toast.success('Financial report generated successfully!');
      } else if (reportType === 'rent_roll') {
        const rentRollData = await getRentRoll(fromDate, toDate);
        onReportGenerated(reportType, rentRollData, dateRange);
        toast.success('Rent roll report generated successfully!');
      } else if (reportType === 'occupancy_report') {
        const occupancyData = await getOccupancyReport(fromDate, toDate);
        onReportGenerated(reportType, occupancyData, dateRange);
        toast.success('Occupancy report generated successfully!');
      } else if (reportType === 'maintenance_costs') {
        const maintenanceData = await getMaintenanceCosts(fromDate, toDate);
        onReportGenerated(reportType, maintenanceData, dateRange);
        toast.success('Maintenance costs report generated successfully!');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setReportType('');
          setDateRange(undefined);
        }
        onOpenChange(isOpen);
      }}
    >
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
                {reportOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={!option.implemented}
                  >
                    {option.label}
                    {!option.implemented ? ' (Coming soon)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date-range" className="text-right">
              Date Range
            </Label>
            <div className="col-span-3">
              <DateRangePicker value={dateRange} onValueChange={setDateRange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || (!!reportType && !isImplementedReport(reportType))}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
