
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clipboard, FileCheck } from "lucide-react";
import { InspectionDialog } from "./InspectionDialog";

// Mock data for inspections
const mockInspections = [
  {
    id: '1',
    propertyId: '101',
    propertyName: 'Palm View Apartments #101',
    type: 'move-in',
    date: '2025-04-15',
    inspector: 'John Doe',
    status: 'pass',
  },
  {
    id: '2',
    propertyId: '102',
    propertyName: 'Sunlight Residences #304',
    type: 'move-out',
    date: '2025-04-02',
    inspector: 'Sarah Johnson',
    status: 'conditional',
  },
  {
    id: '3',
    propertyId: '103',
    propertyName: 'Green Acres #7B',
    type: 'move-in',
    date: '2025-03-28',
    inspector: 'Michael Brown',
    status: 'fail',
  },
];

export const InspectionList = () => {
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<{
    propertyId: string;
    type: 'move-in' | 'move-out';
  } | null>(null);

  const handleCreateInspection = (type: 'move-in' | 'move-out') => {
    setSelectedInspection({
      propertyId: '',  // This would typically be filled with the selected property
      type
    });
    setInspectionOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-500">Pass</Badge>;
      case 'conditional':
        return <Badge className="bg-amber-500">Conditional</Badge>;
      case 'fail':
        return <Badge className="bg-red-500 text-white">Fail</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-bold">
              <Clipboard className="inline mr-2 h-5 w-5" /> Inspection Records
            </CardTitle>
            <CardDescription>
              View and manage property inspection records
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => handleCreateInspection('move-in')}>
              <FileCheck className="mr-1 h-4 w-4" />
              Move-In Inspection
            </Button>
            <Button size="sm" onClick={() => handleCreateInspection('move-out')}>
              <FileCheck className="mr-1 h-4 w-4" />
              Move-Out Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInspections.length > 0 ? (
                mockInspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">{inspection.propertyName}</TableCell>
                    <TableCell>
                      {inspection.type === 'move-in' ? 'Move-In' : 'Move-Out'}
                    </TableCell>
                    <TableCell>{new Date(inspection.date).toLocaleDateString()}</TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No inspection records found. Create a new inspection to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedInspection && (
        <InspectionDialog
          open={inspectionOpen}
          onOpenChange={setInspectionOpen}
          propertyId={selectedInspection.propertyId}
          inspectionType={selectedInspection.type}
          onSuccess={() => {
            // In a real app, you would refresh the list of inspections here
            console.log("Inspection created successfully");
          }}
        />
      )}
    </>
  );
};
