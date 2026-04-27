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
  BarChart,
  Bar,
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

interface PropertyPerformance {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface PropertyChartProps {
  propertyData: PropertyPerformance[];
  chartColors: {
    revenue: string;
    expenses: string;
  };
  formatAmount: (amount: number) => string;
  onViewDetails: () => void;
  isLoading: boolean;
  error: any;
}

export function PropertyChart({
  propertyData,
  chartColors,
  formatAmount,
  onViewDetails,
  isLoading,
  error,
}: PropertyChartProps) {
  const axisTickStyle = { fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 };
  const legendStyle = { fontSize: '12px', fontWeight: 600 };

  const handleDownloadProperties = () => {
    exportToCsv({
      filename: 'Property_Performance',
      headers: ['Property', 'Revenue', 'Expenses', 'Profit', 'Profit Margin (%)'],
      data: propertyData,
      mapper: (item) => [
        item.name,
        formatAmountForCsv(item.revenue),
        formatAmountForCsv(item.expenses),
        formatAmountForCsv(item.profit),
        ((item.profit / item.revenue) * 100).toFixed(1),
      ],
    });
  };

  const hasData = !isLoading && !error && propertyData && propertyData.length > 0;

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <CardTitle className="premium-title">Property Performance</CardTitle>
        <CardDescription>Revenue, expenses and profit by property</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartStatusIndicator isLoading={isLoading} error={error} data={propertyData}>
            <ChartContainer
              config={{
                revenue: { label: 'Revenue', color: chartColors.revenue },
                expenses: { label: 'Expenses', color: chartColors.expenses },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={propertyData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    strokeOpacity={0.45}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `₦${value / 1000000}M`}
                    tick={axisTickStyle}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ ...axisTickStyle, width: 100, textAnchor: 'end' }}
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
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill={chartColors.revenue}
                    radius={[6, 6, 6, 6]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill={chartColors.expenses}
                    radius={[6, 6, 6, 6]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartStatusIndicator>
        </div>

        {hasData && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card/90 dark:bg-card">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-primary/5">
                  <th className="px-4 py-2 text-left">Property</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">Expenses</th>
                  <th className="px-4 py-2 text-right">Profit</th>
                  <th className="px-4 py-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {propertyData.map((property) => (
                  <tr key={property.name} className="border-b">
                    <td className="px-4 py-2">{property.name}</td>
                    <td className="px-4 py-2 text-right">{formatAmount(property.revenue)}</td>
                    <td className="px-4 py-2 text-right">{formatAmount(property.expenses)}</td>
                    <td className="px-4 py-2 text-right">{formatAmount(property.profit)}</td>
                    <td className="px-4 py-2 text-right">
                      {property.revenue > 0
                        ? `${((property.profit / property.revenue) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="rounded-full border-primary/30 bg-background dark:bg-muted/30"
          onClick={handleDownloadProperties}
          disabled={!hasData}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Property Report
        </Button>
        <Button className="rounded-full" onClick={onViewDetails} disabled={!hasData}>
          View All Properties
        </Button>
      </CardFooter>
    </Card>
  );
}
