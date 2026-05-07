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
            <div
              key={activity.id}
              className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              {activity.type === 'payment' && (
                <div className="rounded-full bg-primary/15 p-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
              )}
              {activity.type === 'maintenance' && (
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              )}
              {activity.type === 'message' && (
                <div className="rounded-full bg-accent p-2">
                  <MessageSquare className="h-4 w-4 text-accent-foreground" />
                </div>
              )}

              <div className="flex-1">
                <p className="font-medium">{activity.description}</p>
                <p className="text-sm text-muted-foreground">{activity.date}</p>
              </div>

              {activity.status === 'unread' && <Badge variant="secondary">Unread</Badge>}
              {activity.status === 'in-progress' && (
                <Badge variant="outline" className="border-border bg-accent/40 text-foreground">
                  In Progress
                </Badge>
              )}
              {activity.status === 'completed' && (
                <Badge variant="outline" className="border-border bg-primary/15 text-primary">
                  Completed
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
