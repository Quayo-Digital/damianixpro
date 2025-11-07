
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';

interface Activity {
  id: number;
  type: 'payment' | 'maintenance' | 'message';
  description: string;
  date: string;
  status: 'completed' | 'in-progress' | 'unread';
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
              {activity.type === 'payment' && (
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              )}
              {activity.type === 'maintenance' && (
                <div className="bg-amber-100 p-2 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
              )}
              {activity.type === 'message' && (
                <div className="bg-blue-100 p-2 rounded-full">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
              )}
              
              <div className="flex-1">
                <p className="font-medium">{activity.description}</p>
                <p className="text-sm text-muted-foreground">{activity.date}</p>
              </div>
              
              {activity.status === 'unread' && (
                <Badge variant="secondary">Unread</Badge>
              )}
              {activity.status === 'in-progress' && (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">In Progress</Badge>
              )}
              {activity.status === 'completed' && (
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Completed</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
