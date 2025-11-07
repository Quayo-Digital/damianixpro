
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MaintenanceRequests = () => {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Maintenance Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No maintenance requests found</p>
          <Button className="mt-4">Create New Request</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceRequests;
