
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart,
  Bar, 
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
        ((item.profit / item.revenue) * 100).toFixed(1)
      ]
    });
  };

  const hasData = !isLoading && !error && propertyData && propertyData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Performance</CardTitle>
        <CardDescription>Revenue, expenses and profit by property</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartStatusIndicator isLoading={isLoading} error={error} data={propertyData}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={propertyData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => `₦${value/1000000}M`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ width: 100, textAnchor: 'end' }}/>
                <Tooltip formatter={(value) => formatAmount(Number(value))} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill={chartColors.revenue} />
                <Bar dataKey="expenses" name="Expenses" fill={chartColors.expenses} />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatusIndicator>
        </div>
        
        {hasData && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Property</th>
                  <th className="text-right py-2 px-4">Revenue</th>
                  <th className="text-right py-2 px-4">Expenses</th>
                  <th className="text-right py-2 px-4">Profit</th>
                  <th className="text-right py-2 px-4">Margin</th>
                </tr>
              </thead>
              <tbody>
                {propertyData.map((property) => (
                  <tr key={property.name} className="border-b">
                    <td className="py-2 px-4">{property.name}</td>
                    <td className="text-right py-2 px-4">{formatAmount(property.revenue)}</td>
                    <td className="text-right py-2 px-4">{formatAmount(property.expenses)}</td>
                    <td className="text-right py-2 px-4">{formatAmount(property.profit)}</td>
                    <td className="text-right py-2 px-4">
                      {property.revenue > 0 ? `${((property.profit / property.revenue) * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDownloadProperties} disabled={!hasData}>
          <Download className="mr-2 h-4 w-4" />
          Download Property Report
        </Button>
        <Button onClick={onViewDetails} disabled={!hasData}>View All Properties</Button>
      </CardFooter>
    </Card>
  );
}
