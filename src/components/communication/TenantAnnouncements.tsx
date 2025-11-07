
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, Plus, Users, User, Megaphone, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTemplatesByCategory } from '@/utils/communicationTemplates';

export function TenantAnnouncements() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState('all');
  
  // Initial announcements
  const [announcements, setAnnouncements] = useState([
    { 
      id: 1, 
      title: 'Scheduled Maintenance', 
      message: 'We will be conducting routine maintenance on the building plumbing system on Saturday, June 15th from 10 AM to 2 PM. Water service may be temporarily disrupted during this time.', 
      date: 'Jun 10, 2025',
      audience: 'all', 
    },
    { 
      id: 2, 
      title: 'Rent Due Reminder', 
      message: 'This is a friendly reminder that rent payments are due on the 1st of each month. Please ensure your payments are made on time to avoid late fees.', 
      date: 'Jun 1, 2025',
      audience: 'all', 
    },
    { 
      id: 3, 
      title: 'Property Inspection Notice', 
      message: 'The annual property inspection will take place next week. A representative will visit your unit between 9 AM and 4 PM on Tuesday, June 18th. Your presence is not required but appreciated.', 
      date: 'May 25, 2025',
      audience: 'residential', 
    },
  ]);
  
  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : announcements.filter(a => a.audience === filter);
  
  const handleCreateAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) return;
    
    // Add new announcement
    const newAnnouncement = {
      id: Date.now(),
      title: announcementTitle,
      message: announcementMessage,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      audience: announcementAudience,
    };
    
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    
    toast({
      title: "Announcement Created",
      description: "Your announcement has been published to tenants."
    });
    
    // Reset form and close dialog
    setDialogOpen(false);
    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setAnnouncementAudience('all');
  };
  
  const applyTemplate = (templateId: string) => {
    const templates = getTemplatesByCategory('announcement');
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      setAnnouncementTitle(template.subject || template.title);
      setAnnouncementMessage(template.body
        .replace("[Tenant Name]", "All Tenants")
        .replace("[Property Manager]", "Property Manager")
      );
      
      toast({
        title: "Template Applied",
        description: `${template.title} template has been applied.`,
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Announcements</SelectItem>
            <SelectItem value="residential">Residential Only</SelectItem>
            <SelectItem value="commercial">Commercial Only</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" /> Use Template
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <div className="p-3 border-b">
                      <h4 className="text-sm font-medium">Announcement Templates</h4>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {getTemplatesByCategory('announcement').map(template => (
                        <div 
                          key={template.id} 
                          className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                          onClick={() => applyTemplate(template.id)}
                        >
                          <p className="font-medium">{template.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {template.body.substring(0, 60)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="Enter announcement title"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  placeholder="Enter announcement message" 
                  className="min-h-[120px]"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Audience</label>
                <Select 
                  value={announcementAudience}
                  onValueChange={setAnnouncementAudience}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="residential">Residential Only</SelectItem>
                    <SelectItem value="commercial">Commercial Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAnnouncement}
                disabled={!announcementTitle.trim() || !announcementMessage.trim()}
              >
                Publish Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{announcement.title}</CardTitle>
              <Badge variant="outline">
                {announcement.audience === 'all' ? 'All Tenants' : 
                  announcement.audience === 'residential' ? 'Residential' : 'Commercial'}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">{announcement.date}</p>
              <p>{announcement.message}</p>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Megaphone className="h-4 w-4 mr-2" />
                <span>Published by Admin</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
