
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const maintenanceData = {
  total: 28,
  completed: 17,
  inProgress: 8,
  pending: 3,
};

export function MaintenanceStatus() {
  const completedPercentage = (maintenanceData.completed / maintenanceData.total) * 100;
  const inProgressPercentage = (maintenanceData.inProgress / maintenanceData.total) * 100;
  const pendingPercentage = (maintenanceData.pending / maintenanceData.total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Maintenance Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed</span>
              <span className="text-sm font-medium">{maintenanceData.completed}</span>
            </div>
            <Progress
              value={completedPercentage}
              className="h-2 bg-gray-100"
              indicatorClassName="bg-green-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">In Progress</span>
              <span className="text-sm font-medium">{maintenanceData.inProgress}</span>
            </div>
            <Progress
              value={inProgressPercentage}
              className="h-2 bg-gray-100"
              indicatorClassName="bg-blue-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending</span>
              <span className="text-sm font-medium">{maintenanceData.pending}</span>
            </div>
            <Progress
              value={pendingPercentage}
              className="h-2 bg-gray-100"
              indicatorClassName="bg-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <span className="text-sm font-medium">Total Requests</span>
          <span className="text-sm font-medium">{maintenanceData.total}</span>
        </div>
      </CardContent>
    </Card>
  );
}
