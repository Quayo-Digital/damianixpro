
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, CheckCircle } from "lucide-react"; // Changed from Tool to Bell

export default function Notifications() {
  const [notificationsTab, setNotificationsTab] = useState("all");
  
  // Mock notification data
  const notifications = [
    {
      id: "1",
      title: "Payment reminder",
      description: "Your rent payment of ₦120,000 is due in 7 days",
      timestamp: "2 hours ago",
      type: "payment",
      read: false
    },
    {
      id: "2",
      title: "Maintenance update",
      description: "Your request for 'AC Repair' has been completed",
      timestamp: "5 hours ago",
      type: "maintenance",
      read: false
    },
    {
      id: "3",
      title: "Lease expiry",
      description: "Your lease expires in 30 days",
      timestamp: "1 day ago",
      type: "lease",
      read: true
    },
    {
      id: "4",
      title: "Property inspection",
      description: "A property inspection is scheduled for May 15, 2025",
      timestamp: "2 days ago",
      type: "announcement",
      read: true
    }
  ];
  
  const filteredNotifications = notificationsTab === "all" 
    ? notifications 
    : notificationsTab === "unread"
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === notificationsTab);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Tabs defaultValue="all" value={notificationsTab} onValueChange={setNotificationsTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge variant="secondary" className="ml-2">{notifications.filter(n => !n.read).length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="lease">Lease</TabsTrigger>
              <TabsTrigger value="announcement">Announcements</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">Mark all as read</Button>
          </div>
          <TabsContent value={notificationsTab} className="mt-4">
            {filteredNotifications.length > 0 ? (
              <div className="grid gap-4">
                {filteredNotifications.map((notification) => (
                  <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          {!notification.read && (
                            <Badge variant="default" className="mr-2 h-2 w-2 rounded-full p-0" />
                          )}
                          {notification.title}
                        </CardTitle>
                        <CardDescription>{notification.timestamp}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{notification.description}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex justify-between w-full">
                        <Badge variant="outline">{notification.type}</Badge>
                        <Button variant="ghost" size="sm">Mark as read</Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
