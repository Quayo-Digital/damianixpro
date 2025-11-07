
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { GenerateReportDialog } from '@/components/reports/GenerateReportDialog';
import { FinancialSummaryReport } from '@/components/reports/FinancialSummaryReport';
import { RentRollReport } from '@/components/reports/RentRollReport';
import { DateRange } from 'react-day-picker';
import { RentRoll } from '@/components/reports/types';

interface AccountingSummary {
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  ownerPayouts: number;
  taxes: number;
  pendingPayouts: number;
}

const Reports = () => {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<string | null>(null);
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>();

  const handleReportGenerated = (type: string, data: any, dateRange: DateRange) => {
    setReportType(type);
    setReportData(data);
    setReportDateRange(dateRange);
  };

  const renderReport = () => {
    if (!reportData || !reportType || !reportDateRange?.from || !reportDateRange?.to) {
      return (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          <p>Your generated reports will appear here.</p>
          <p className="text-sm mt-2">Click "Generate Report" to get started.</p>
        </div>
      );
    }

    const reportProps = {
      dateRange: { from: reportDateRange.from, to: reportDateRange.to },
    };

    switch (reportType) {
      case 'financial_summary':
        return (
          <FinancialSummaryReport
            summary={reportData as AccountingSummary}
            {...reportProps}
          />
        );
      case 'rent_roll':
        return (
          <RentRollReport
            data={reportData as RentRoll}
            {...reportProps}
          />
        );
      default:
        return (
          <div className="border rounded-md p-8 text-center text-muted-foreground">
            <p>Report type "{reportType}" generated, but no view is available.</p>
          </div>
        );
    }
  };

  return (
    <PageLayout>
      <PageContent
        title="Reports"
        description="Generate and view financial and operational reports."
        actions={
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        }
      >
        {renderReport()}
        <GenerateReportDialog
          open={isGenerateDialogOpen}
          onOpenChange={setIsGenerateDialogOpen}
          onReportGenerated={handleReportGenerated}
        />
      </PageContent>
    </PageLayout>
  );
};

export default Reports;
