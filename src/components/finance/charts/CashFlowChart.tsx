
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { Download } from 'lucide-react';
import { exportToCsv, formatAmountForCsv } from '@/services/documents/exportUtils';
import { ChartStatusIndicator } from './ChartStatusIndicator';

interface CashFlowItem {
  month: string;
  inflow: number;
  outflow: number;
  projected?: boolean;
}

interface CashFlowChartProps {
  cashFlowData: CashFlowItem[];
  chartColors: {
    inflow: string;
    outflow: string;
  };
  formatAmount: (amount: number) => string;
  onViewDetails: () => void;
  isLoading: boolean;
  error: any;
}

export function CashFlowChart({ 
  cashFlowData, 
  chartColors, 
  formatAmount,
  onViewDetails,
  isLoading,
  error
}: CashFlowChartProps) {
  const handleDownloadCashFlow = () => {
    exportToCsv({
      filename: 'Cash_Flow_Report',
      headers: ['Month', 'Cash Inflow', 'Cash Outflow', 'Net Cash Flow'],
      data: cashFlowData,
      mapper: (item) => [
        item.month,
        formatAmountForCsv(item.inflow),
        formatAmountForCsv(item.outflow),
        formatAmountForCsv(item.inflow - item.outflow)
      ]
    });
  };

  const hasData = !isLoading && !error && cashFlowData && cashFlowData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Monthly cash inflow vs. outflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartStatusIndicator isLoading={isLoading} error={error} data={cashFlowData}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cashFlowData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₦${value/1000000}M`} />
                <Tooltip formatter={(value) => formatAmount(Number(value))} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="inflow" 
                  name="Cash Inflow" 
                  stroke={chartColors.inflow} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="outflow" 
                  name="Cash Outflow" 
                  stroke={chartColors.outflow} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartStatusIndicator>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDownloadCashFlow} disabled={!hasData}>
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        <Button onClick={onViewDetails} disabled={!hasData}>View Cash Flow Details</Button>
      </CardFooter>
    </Card>
  );
}
