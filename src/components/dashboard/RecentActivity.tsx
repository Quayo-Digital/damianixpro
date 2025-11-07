
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const activities = [
  {
    id: 1,
    activity: 'Rent payment received',
    user: 'Chioma Okeke',
    property: 'Sunlight Residences, Unit 4B',
    time: '10 minutes ago',
    icon: '💰'
  },
  {
    id: 2,
    activity: 'New maintenance request',
    user: 'Tunde Bello',
    property: 'Palm View Apartments, Unit 7',
    time: '2 hours ago',
    icon: '🔧'
  },
  {
    id: 3,
    activity: 'Property viewing scheduled',
    user: 'Fatima Suleiman',
    property: 'Green Acres, Unit 2',
    time: '5 hours ago',
    icon: '👁️'
  },
  {
    id: 4,
    activity: 'Lease agreement sent',
    user: 'Emeka Nwosu',
    property: 'Victoria Garden Estate, Unit 12',
    time: 'Yesterday',
    icon: '📝'
  },
  {
    id: 5,
    activity: 'Property inspection completed',
    user: 'Adewale Balogun',
    property: 'Green Acres, Unit 1',
    time: 'Yesterday',
    icon: '✅'
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 px-6 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-brand-light flex items-center justify-center text-lg">
                {activity.icon}
              </div>
              <div>
                <p className="font-medium">{activity.activity}</p>
                <p className="text-sm text-muted-foreground">{activity.user} • {activity.property}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
