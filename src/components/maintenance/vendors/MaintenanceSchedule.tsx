import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddScheduleDialog } from './AddScheduleDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceSchedule {
  id: string;
  title: string;
  description: string | null;
  property_id: string;
  vendor_id: string;
  scheduled_date: string;
  status: string;
}

export function MaintenanceSchedule() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch maintenance schedules and vendors from Supabase
  const fetchMaintenanceSchedules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) {
        throw error;
      }

      setMaintenanceSchedules(data || []);

      // Also fetch vendors data
      const { data: vendorData, error: vendorError } = await supabase.from('vendors').select('*');

      if (vendorError) {
        throw vendorError;
      }

      // Transform vendor data to expected format
      const transformedVendors = vendorData.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        specialization: vendor.category,
        contactName: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        rating: vendor.rating,
      }));

      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load maintenance schedules',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceSchedules();
  }, []);

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get property name by ID
  const getPropertyName = (propertyId: string) => {
    const properties = [
      { id: '1', name: 'Oak Residence' },
      { id: '2', name: 'Maple Apartments' },
      { id: '3', name: 'Cedar Heights' },
      { id: '4', name: 'Pine Valley Estate' },
    ];

    const property = properties.find((p) => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  // Get vendor name by ID
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  };

  // Handler for adding a new maintenance schedule
  const handleAddSchedule = () => {
    setIsDialogOpen(true);
  };

  // Handle successful schedule creation
  const handleScheduleCreated = () => {
    setIsDialogOpen(false);
    fetchMaintenanceSchedules();
    toast({
      title: 'Success',
      description: 'New maintenance schedule created',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Maintenance Schedule</CardTitle>
        <Button onClick={handleAddSchedule} className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading maintenance schedules...
          </div>
        ) : maintenanceSchedules.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No upcoming maintenance tasks scheduled
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    {formatDate(schedule.scheduled_date)}
                  </TableCell>
                  <TableCell>
                    <div>{schedule.title}</div>
                    <div className="text-xs text-muted-foreground">{schedule.description}</div>
                  </TableCell>
                  <TableCell>{getPropertyName(schedule.property_id)}</TableCell>
                  <TableCell>{getVendorName(schedule.vendor_id)}</TableCell>
                  <TableCell>
                    {schedule.status === 'scheduled' ? (
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        Scheduled
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700"
                      >
                        In Progress
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add Schedule Dialog */}
      <AddScheduleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onScheduleCreated={handleScheduleCreated}
        vendors={vendors}
      />
    </Card>
  );
}
