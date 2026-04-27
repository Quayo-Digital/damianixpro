import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts';

interface RevenueDatum {
  month: string;
  revenue: number;
}

interface PlatformRevenueCardProps {
  data: RevenueDatum[];
}

export function PlatformRevenueCard({ data }: PlatformRevenueCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Revenue</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
            <Tooltip
              formatter={(value) => [`₦${(Number(value) / 1000000).toFixed(2)}M`, 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
