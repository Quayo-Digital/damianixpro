import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DashboardActionItem } from './DashboardActionItem';

export function UserManagementCard({
  pendingApplicationsCount,
  pendingScreeningsCount,
}: {
  pendingApplicationsCount?: number;
  pendingScreeningsCount?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage platform users and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <DashboardActionItem
            title="Pending Rental Applications"
            description={`${pendingApplicationsCount || 0} pending approval`}
            buttonText="Review"
            linkTo="/admin/users"
          />
          <DashboardActionItem
            title="Pending Tenant Screenings"
            description={`${pendingScreeningsCount || 0} pending screening`}
            buttonText="Review"
            linkTo="/tenant-management"
          />
          <DashboardActionItem
            title="Role assignments"
            description="3 requests pending"
            buttonText="Manage"
            linkTo="/admin/roles"
          />
        </div>
        <Button variant="outline" className="mt-4 w-full" asChild>
          <Link to="/admin/users">View All Users</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
