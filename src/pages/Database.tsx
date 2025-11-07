
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Search, RefreshCw, Plus } from 'lucide-react';

const Database = () => {
  const tables = [
    { id: 1, name: 'Properties', records: 24, lastUpdated: '12 May 2025' },
    { id: 2, name: 'Tenants', records: 48, lastUpdated: '10 May 2025' },
    { id: 3, name: 'Maintenance', records: 87, lastUpdated: '11 May 2025' },
    { id: 4, name: 'Payments', records: 156, lastUpdated: '12 May 2025' },
    { id: 5, name: 'Documents', records: 62, lastUpdated: '09 May 2025' },
    { id: 6, name: 'Users', records: 12, lastUpdated: '08 May 2025' },
  ];
  
  const backups = [
    { id: 1, date: '12 May 2025', time: '08:00 AM', size: '24.5 MB', status: 'success' },
    { id: 2, date: '11 May 2025', time: '08:00 AM', size: '24.2 MB', status: 'success' },
    { id: 3, date: '10 May 2025', time: '08:00 AM', size: '23.8 MB', status: 'success' },
    { id: 4, date: '09 May 2025', time: '08:00 AM', size: '23.5 MB', status: 'success' },
    { id: 5, date: '08 May 2025', time: '08:00 AM', size: '23.1 MB', status: 'success' },
  ];

  return (
    <PageLayout>
      <PageContent 
        title="Database Management" 
        description="Manage your application database"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5 MB</div>
              <p className="text-xs text-muted-foreground">+1.4 MB from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">389</div>
              <p className="text-xs text-muted-foreground">+27 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 May 2025</div>
              <p className="text-xs text-muted-foreground">08:00 AM</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tables">
          <TabsList>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
          </TabsList>
          <TabsContent value="tables" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tables..."
                  className="pl-8"
                />
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Table
                </Button>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.records}</TableCell>
                      <TableCell>{table.lastUpdated}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Export</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="backups" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Database Backups</CardTitle>
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>{backup.date}</TableCell>
                          <TableCell>{backup.time}</TableCell>
                          <TableCell>{backup.size}</TableCell>
                          <TableCell>
                            <Badge variant={backup.status === 'success' ? 'default' : 'destructive'}>
                              {backup.status === 'success' ? 'Success' : 'Failed'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Schedule Backups</Button>
                <Button variant="outline">Backup Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default Database;
