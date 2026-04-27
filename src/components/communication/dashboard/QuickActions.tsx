import { Card, CardContent } from '@/components/ui/card';
import { CalendarDaysIcon, MessageSquare, HomeIcon, ArrowRight } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (section: string) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <Card
        className="cursor-pointer transition-colors hover:bg-secondary/50"
        onClick={() => onNavigate('messages')}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-primary/10 p-2">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Contact Manager</p>
            <p className="text-sm text-muted-foreground">Send a message</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4" />
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer transition-colors hover:bg-secondary/50"
        onClick={() => onNavigate('maintenance')}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-primary/10 p-2">
            <HomeIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Report Issue</p>
            <p className="text-sm text-muted-foreground">Maintenance request</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4" />
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer transition-colors hover:bg-secondary/50"
        onClick={() => onNavigate('documents')}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-primary/10 p-2">
            <CalendarDaysIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">View Documents</p>
            <p className="text-sm text-muted-foreground">Lease and notices</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4" />
        </CardContent>
      </Card>
    </div>
  );
}
