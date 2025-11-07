
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDaysIcon, MessageSquare, HomeIcon, ArrowRight } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (section: string) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <Card 
        className="hover:bg-secondary/50 transition-colors cursor-pointer"
        onClick={() => onNavigate("messages")}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Contact Manager</p>
            <p className="text-sm text-muted-foreground">Send a message</p>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </CardContent>
      </Card>
      
      <Card 
        className="hover:bg-secondary/50 transition-colors cursor-pointer"
        onClick={() => onNavigate("maintenance")}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <HomeIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Report Issue</p>
            <p className="text-sm text-muted-foreground">Maintenance request</p>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </CardContent>
      </Card>
      
      <Card 
        className="hover:bg-secondary/50 transition-colors cursor-pointer"
        onClick={() => onNavigate("documents")}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <CalendarDaysIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">View Documents</p>
            <p className="text-sm text-muted-foreground">Lease and notices</p>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
