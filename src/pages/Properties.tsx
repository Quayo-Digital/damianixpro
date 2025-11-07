
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { AddPropertyDialog } from '@/components/properties/AddPropertyDialog';
import { PropertyFilters } from '@/components/properties/PropertyFilters';
import { PropertyGrid } from '@/components/properties/PropertyGrid';
import { Property } from '@/services/property';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { EditPropertyDialog } from '@/components/properties/EditPropertyDialog';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { PropertyList } from '@/components/properties/PropertyList';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { useProperties } from '@/hooks/useProperties';

const Properties = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('grid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { isOwner } = useAuth();
  const { properties, isLoading, refreshProperties } = useProperties();
  
  const filteredProperties = activeFilter === 'all' 
    ? properties 
    : properties.filter(property => property.type === activeFilter);
  
  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsEditDialogOpen(true);
  };
  
  const handlePropertyAdded = () => {
    refreshProperties();
  };
  
  const exportProperties = () => {
    // This would generate a CSV or Excel file of properties
    toast.info('Exporting properties...');
  };

  return (
    <PageLayout>
      <PageContent 
        title="Properties" 
        description="Manage your real estate portfolio"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2 self-end md:self-auto">
              <Button variant="outline" size="sm" onClick={exportProperties}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              {isOwner() && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              )}
            </div>
          </div>
          
          <Card className="p-4">
            <PropertyFilters 
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />
          </Card>

          <TabsContent value="grid" className="mt-4">
            <PropertyGrid 
              properties={filteredProperties} 
              isLoading={isLoading} 
              onEdit={handleEditProperty}
              onRefresh={refreshProperties}
            />
          </TabsContent>
          
          <TabsContent value="list" className="mt-4">
            <PropertyList 
              properties={filteredProperties} 
              isLoading={isLoading} 
              onEdit={handleEditProperty}
              onRefresh={refreshProperties}
            />
          </TabsContent>
          
          <TabsContent value="map" className="mt-4">
            <PropertyMap properties={filteredProperties} />
          </TabsContent>
        </Tabs>
        
        <AddPropertyDialog 
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onPropertyAdded={handlePropertyAdded}
        />
        
        {selectedProperty && (
          <EditPropertyDialog 
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            property={selectedProperty}
            onPropertyUpdated={refreshProperties}
          />
        )}
      </PageContent>
    </PageLayout>
  );
};

export default Properties;
