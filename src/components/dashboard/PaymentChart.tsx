
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Sample data for the payment chart
const data = [
  { month: 'Jan', collected: 5200000, expected: 6000000 },
  { month: 'Feb', collected: 5450000, expected: 6000000 },
  { month: 'Mar', collected: 5800000, expected: 6000000 },
  { month: 'Apr', collected: 5950000, expected: 6000000 },
  { month: 'May', collected: 5780000, expected: 6000000 },
  { month: 'Jun', collected: 5950000, expected: 6000000 },
];

// Format numbers to Naira currency (₦)
const formatToNaira = (value: number) => {
  return `₦${(value / 1000000).toFixed(1)}M`;
};

export function PaymentChart() {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">Rental Income</CardTitle>
        <Select defaultValue="6months">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatToNaira} />
            <Tooltip 
              formatter={(value: number) => [`${formatToNaira(value)}`, '']} 
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Bar dataKey="collected" name="Collected" fill="#4CAF50" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expected" name="Expected" fill="#E8F5E9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
