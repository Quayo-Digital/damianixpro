
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { InspectionList } from '@/components/inspections/InspectionList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Inspections = () => {
  return (
    <PageLayout>
      <PageContent 
        title="Property Inspections" 
        description="Manage move-in and move-out property inspections"
      >
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Inspections</TabsTrigger>
            <TabsTrigger value="move-in">Move-In</TabsTrigger>
            <TabsTrigger value="move-out">Move-Out</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <InspectionList />
          </TabsContent>
          
          <TabsContent value="move-in" className="mt-0">
            {/* This would be filtered for move-in inspections only */}
            <InspectionList />
          </TabsContent>
          
          <TabsContent value="move-out" className="mt-0">
            {/* This would be filtered for move-out inspections only */}
            <InspectionList />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default Inspections;
