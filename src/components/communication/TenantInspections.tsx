
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Mock data for tenant inspections
const initialInspections = [
  {
    id: '1',
    type: 'move-in',
    date: '2025-01-15',
    status: 'completed',
    notes: 'All items in good condition'
  },
  {
    id: '2',
    type: 'routine',
    date: '2025-03-10',
    status: 'scheduled',
    notes: 'Quarterly inspection'
  },
  {
    id: '3',
    type: 'annual',
    date: '2025-06-15',
    status: 'pending',
    notes: 'Annual property inspection'
  }
];

export const TenantInspections = () => {
  const { toast } = useToast();
  const [inspections, setInspections] = useState(initialInspections);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  
  const formatInspectionType = (type: string) => {
    switch (type) {
      case 'move-in':
        return 'Move-In Inspection';
      case 'move-out':
        return 'Move-Out Inspection';
      case 'routine':
        return 'Routine Inspection';
      case 'annual':
        return 'Annual Inspection';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const viewInspectionDetails = (inspection) => {
    setSelectedInspection(inspection);
    setDetailsOpen(true);
  };
  
  const confirmInspection = (id) => {
    setInspections(prev => prev.map(inspection => 
      inspection.id === id 
        ? { ...inspection, status: 'scheduled' } 
        : inspection
    ));
    
    setDetailsOpen(false);
    
    toast({
      title: "Inspection Confirmed",
      description: "You've successfully confirmed the inspection time."
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Property Inspections</CardTitle>
          <CardDescription>
            View scheduled and completed property inspections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>{formatInspectionType(inspection.type)}</TableCell>
                  <TableCell>{new Date(inspection.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                  <TableCell>{inspection.notes}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => viewInspectionDetails(inspection)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {inspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No inspections found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
            <DialogDescription>
              Information about this property inspection
            </DialogDescription>
          </DialogHeader>
          
          {selectedInspection && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                  <p className="mt-1">{formatInspectionType(selectedInspection.type)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                  <p className="mt-1">{new Date(selectedInspection.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="mt-1">{getStatusBadge(selectedInspection.status)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <p className="mt-1">{selectedInspection.notes}</p>
              </div>
              
              {selectedInspection.status === 'pending' && (
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={() => confirmInspection(selectedInspection.id)}
                  >
                    Confirm Inspection
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
