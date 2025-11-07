
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from "recharts";

interface UserTypeDatum {
  name: string;
  value: number;
  color: string;
}

interface UserDistributionCardProps {
  data: UserTypeDatum[];
}

export function UserDistributionCard({ data }: UserDistributionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Distribution</CardTitle>
        <CardDescription>Breakdown by user role</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
          </RechartsPie>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
