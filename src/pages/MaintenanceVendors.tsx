import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MaintenanceVendors = () => {
  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Maintenance Vendors</h1>
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No vendors found</p>
          <Button className="mt-4">Add Vendor</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceVendors;
