import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { TenantOnboarding } from '@/components/tenants/TenantOnboarding';
import { RentalMilestones } from '@/components/tenants/RentalMilestones';
import { Loader2, Search } from 'lucide-react';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  property_id?: string;
  property_name?: string;
}

const TenantOnboardingPage = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = tenants.filter(
        (tenant) =>
          tenant.first_name.toLowerCase().includes(lowerCaseQuery) ||
          tenant.last_name.toLowerCase().includes(lowerCaseQuery) ||
          tenant.email.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredTenants(filtered);
    } else {
      setFilteredTenants(tenants);
    }
  }, [searchQuery, tenants]);

  const fetchTenants = async () => {
    setIsLoading(true);

    try {
      // Get tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      // For each tenant, get their property information
      const tenantsWithProperties = await Promise.all(
        tenantsData.map(async (tenant) => {
          const { data: propertyTenant, error: ptError } = await supabase
            .from('property_tenants')
            .select('property_id')
            .eq('tenant_id', tenant.id)
            .single();

          if (ptError && ptError.code !== 'PGRST116') {
            console.error('Error fetching property tenant:', ptError);
            return tenant;
          }

          if (propertyTenant) {
            const { data: property, error: propError } = await supabase
              .from('properties')
              .select('name')
              .eq('id', propertyTenant.property_id)
              .single();

            if (!propError) {
              return {
                ...tenant,
                property_id: propertyTenant.property_id,
                property_name: property.name,
              };
            }
          }

          return tenant;
        })
      );

      setTenants(tenantsWithProperties);
      setFilteredTenants(tenantsWithProperties);

      // If there are tenants, select the first one
      if (tenantsWithProperties.length > 0) {
        setSelectedTenant(tenantsWithProperties[0]);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
    }
  };

  return (
    <PageLayout>
      <PageContent
        title="Tenant Onboarding"
        description="Manage tenant onboarding, lease signing, and rental milestones"
      >
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Onboarding Overview</TabsTrigger>
            <TabsTrigger value="milestones">Rental Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Tenants</CardTitle>
                    <CardDescription>Select a tenant to manage onboarding</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tenants..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1"
                        />
                      </div>

                      {isLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredTenants.length === 0 ? (
                        <p className="py-4 text-center text-muted-foreground">No tenants found</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredTenants.map((tenant) => (
                            <Button
                              key={tenant.id}
                              variant={selectedTenant?.id === tenant.id ? 'default' : 'outline'}
                              className="h-auto w-full justify-start px-4 py-2"
                              onClick={() => handleSelectTenant(tenant.id)}
                            >
                              <div className="flex flex-col items-start">
                                <span>
                                  {tenant.first_name} {tenant.last_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {tenant.property_name || 'No property assigned'}
                                </span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedTenant && selectedTenant.property_id ? (
                  <TenantOnboarding
                    tenantId={selectedTenant.id}
                    propertyId={selectedTenant.property_id}
                    tenantName={`${selectedTenant.first_name} ${selectedTenant.last_name}`}
                    propertyName={selectedTenant.property_name || 'Unknown Property'}
                  />
                ) : selectedTenant ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        This tenant does not have a property assigned.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Select a tenant to view their onboarding status.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="milestones">
            <RentalMilestones />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
};

export default TenantOnboardingPage;
