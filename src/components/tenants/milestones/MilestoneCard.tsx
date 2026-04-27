import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Milestone } from './types';
import { getMilestoneStatusColor, getMilestoneTypeIcon, getDaysLabel } from './milestoneUtils';

interface MilestoneCardProps {
  milestone: Milestone;
  onSendNotification: (id: string) => void;
}

export function MilestoneCard({ milestone, onSendNotification }: MilestoneCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg">
              {getMilestoneTypeIcon(milestone.milestone_type)}
              <span className="ml-2">
                {milestone.milestone_type
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </CardTitle>
            <CardDescription>
              {milestone.tenant_name} - {milestone.property_name}
            </CardDescription>
          </div>
          <Badge className={getMilestoneStatusColor(milestone.status)}>
            {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">{milestone.description}</p>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(milestone.date), 'PPP')} ({getDaysLabel(milestone.date)})
            </p>
          </div>

          <div className="flex justify-end">
            {!milestone.notification_sent && milestone.status !== 'completed' ? (
              <Button size="sm" onClick={() => onSendNotification(milestone.id)}>
                Send Notification
              </Button>
            ) : milestone.notification_sent ? (
              <p className="text-xs text-muted-foreground">
                Notification sent on {format(new Date(), 'PP')}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
