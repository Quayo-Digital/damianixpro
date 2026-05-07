import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { AddPropertyDialog } from '@/components/properties/AddPropertyDialog';
import { AddShortletDialog } from '@/components/shortlet/AddShortletDialog';
import { PropertyFilters } from '@/components/properties/PropertyFilters';
import { PropertyGrid } from '@/components/properties/PropertyGrid';
import { Property } from '@/services/property/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { EditPropertyDialog } from '@/components/properties/EditPropertyDialog';
import { useAuthSession } from '@/contexts/auth';
import { notifyError } from '@/utils/notify';
import { PropertyList } from '@/components/properties/PropertyList';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { useProperties } from '@/hooks/useProperties';
import { PageLoader } from '@/components/ui/PageLoader';
import { OwnerSubscriptionGateBanner } from '@/components/owner/OwnerSubscriptionGateBanner';
import { useOwnerSubscriptionAccess } from '@/hooks/useOwnerSubscriptionAccess';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const Properties = () => {
  const navigate = useNavigate();
  const { userRole, isLoading: authLoading, isOwner, isAgent, hasPermission } = useAuthSession();
  const canWriteProperties = hasPermission('properties.write');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddShortletDialogOpen, setIsAddShortletDialogOpen] = useState(false);
  const [selectedPropertyForShortlet, setSelectedPropertyForShortlet] = useState<
    string | undefined
  >(undefined);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('grid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { properties, isLoading, refreshProperties } = useProperties();
  const { hasPaidOwnerAccess, isCheckingAccess } = useOwnerSubscriptionAccess();

  // Redirect tenants away from property management pages
  useEffect(() => {
    if (!authLoading && userRole === 'tenant') {
      navigate('/tenant/dashboard', { replace: true });
    }
  }, [userRole, authLoading, navigate]);

  // Show loader while checking auth
  if (authLoading) {
    return <PageLoader />;
  }

  // Don't render if tenant (will be redirected)
  if (userRole === 'tenant') {
    return <PageLoader />;
  }

  const filteredProperties =
    activeFilter === 'all'
      ? properties
      : properties.filter((property) => property.type === activeFilter);

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsEditDialogOpen(true);
  };

  const handlePropertyAdded = () => {
    refreshProperties();
  };

  const handleCreateShortlet = (propertyId?: string) => {
    if (isOwner() && (isCheckingAccess || !hasPaidOwnerAccess)) {
      if (!isCheckingAccess) {
        notifyError('Upgrade required', 'Subscribe or start a trial to create short-let listings.');
      }
      return;
    }
    setSelectedPropertyForShortlet(propertyId);
    setIsAddShortletDialogOpen(true);
  };

  const openAddPropertyDialog = () => {
    if (isCheckingAccess || !hasPaidOwnerAccess) {
      if (!isCheckingAccess) {
        notifyError('Upgrade required', 'Subscribe or start a trial to add properties.');
      }
      return;
    }
    setIsAddDialogOpen(true);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageContent title="My Properties" description="Loading your portfolio…">
          <TableSkeleton rows={8} cols={4} />
        </PageContent>
      </PageLayout>
    );
  }

  const handleShortletAdded = () => {
    refreshProperties();
    setSelectedPropertyForShortlet(undefined);
  };

  const exportProperties = () => {
    // This would generate a CSV or Excel file of properties
    toast.info('Exporting properties...');
  };

  return (
    <PageLayout>
      <PageContent
        title="Properties"
        description={
          canWriteProperties
            ? 'Manage your real estate portfolio'
            : 'View properties and units (read-only for your role)'
        }
      >
        {isOwner() && <OwnerSubscriptionGateBanner />}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col space-y-4 sm:space-y-5"
        >
          <div className="flex flex-col items-start justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:self-end md:self-auto">
              <Button variant="outline" size="sm" onClick={exportProperties}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              {(isOwner() || isAgent()) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateShortlet()}
                    disabled={isOwner() && isCheckingAccess}
                    title={
                      isOwner() && !hasPaidOwnerAccess && !isCheckingAccess
                        ? 'Requires an active subscription or trial'
                        : undefined
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Short-Let
                  </Button>
                  {isOwner() && (
                    <Button
                      onClick={openAddPropertyDialog}
                      disabled={isCheckingAccess}
                      title={
                        !hasPaidOwnerAccess && !isCheckingAccess
                          ? 'Requires an active subscription or trial'
                          : undefined
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Property
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <Card className="p-4">
            <PropertyFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          </Card>

          <TabsContent value="grid" className="mt-2 sm:mt-4">
            <PropertyGrid
              properties={filteredProperties}
              isLoading={isLoading}
              onEdit={isOwner() ? handleEditProperty : undefined}
              onCreateShortlet={isOwner() ? handleCreateShortlet : undefined}
              onRefresh={refreshProperties}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-2 sm:mt-4">
            <PropertyList
              properties={filteredProperties}
              isLoading={isLoading}
              onEdit={isOwner() ? handleEditProperty : undefined}
              onRefresh={refreshProperties}
            />
          </TabsContent>

          <TabsContent value="map" className="mt-2 sm:mt-4">
            <PropertyMap properties={filteredProperties} />
          </TabsContent>
        </Tabs>

        <AddPropertyDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onPropertyAdded={handlePropertyAdded}
        />

        <AddShortletDialog
          open={isAddShortletDialogOpen}
          onOpenChange={(open) => {
            setIsAddShortletDialogOpen(open);
            if (!open) setSelectedPropertyForShortlet(undefined);
          }}
          propertyId={selectedPropertyForShortlet}
          onShortletAdded={handleShortletAdded}
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
