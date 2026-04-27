import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';
import { exportToCsv, formatAmountForCsv } from '@/services/documents/exportUtils';
import { ChartStatusIndicator } from './ChartStatusIndicator';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

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
  error,
}: CashFlowChartProps) {
  const axisTickStyle = { fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 };
  const legendStyle = { fontSize: '12px', fontWeight: 600 };

  const handleDownloadCashFlow = () => {
    exportToCsv({
      filename: 'Cash_Flow_Report',
      headers: ['Month', 'Cash Inflow', 'Cash Outflow', 'Net Cash Flow'],
      data: cashFlowData,
      mapper: (item) => [
        item.month,
        formatAmountForCsv(item.inflow),
        formatAmountForCsv(item.outflow),
        formatAmountForCsv(item.inflow - item.outflow),
      ],
    });
  };

  const hasData = !isLoading && !error && cashFlowData && cashFlowData.length > 0;

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <CardTitle className="premium-title">Cash Flow</CardTitle>
        <CardDescription>Monthly cash inflow vs. outflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartStatusIndicator isLoading={isLoading} error={error} data={cashFlowData}>
            <ChartContainer
              config={{
                inflow: { label: 'Cash Inflow', color: chartColors.inflow },
                outflow: { label: 'Cash Outflow', color: chartColors.outflow },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.45} />
                  <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => `₦${value / 1000000}M`}
                    tick={axisTickStyle}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <ChartTooltipContent
                          payload={payload}
                          label={label}
                          className="border-primary/15"
                          formatter={(value) => formatAmount(Number(value))}
                        />
                      ) : null
                    }
                  />
                  <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
                  <Line
                    type="monotone"
                    dataKey="inflow"
                    name="Cash Inflow"
                    stroke={chartColors.inflow}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 0, fill: chartColors.inflow }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outflow"
                    name="Cash Outflow"
                    stroke={chartColors.outflow}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 0, fill: chartColors.outflow }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartStatusIndicator>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="rounded-full border-primary/30 bg-background dark:bg-muted/30"
          onClick={handleDownloadCashFlow}
          disabled={!hasData}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        <Button className="rounded-full" onClick={onViewDetails} disabled={!hasData}>
          View Cash Flow Details
        </Button>
      </CardFooter>
    </Card>
  );
}
