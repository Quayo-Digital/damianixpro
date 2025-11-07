import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building, 
  BarChart3, 
  Users, 
  Settings,
  TrendingUp,
  DollarSign,
  Home,
  Plus,
  Bell,
  Calendar,
  MessageSquare,
  FileText,
  Shield,
  Target,
  ChevronDown,
  PlusCircle,
  UserPlus,
  FileBarChart,
  Wrench,
  CreditCard,
  MapPin,
  Search
} from 'lucide-react';
import { useEnhancedOwnerData } from '@/hooks/useEnhancedOwnerData';
import OwnerDashboardOverview from '@/components/owner/OwnerDashboardOverview';
import OwnerPropertyPortfolio from '@/components/owner/OwnerPropertyPortfolio';
import OwnerFinancialAnalytics from '@/components/owner/OwnerFinancialAnalytics';
import { useAuth } from '@/contexts/auth';
import { PageLayout } from '@/components/layout/PageLayout';
import { AddPropertyDialog } from '@/components/properties/AddPropertyDialog';
import { useNavigate } from 'react-router-dom';

const EnhancedOwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: '',
    rentAmount: '',
    depositAmount: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const {
    ownerProfile,
    stats,
    properties,
    tenants,
    finances,
    performanceMetrics,
    loading,
    error,
    refreshData,
    updateProperty,
    addTenant,
    updateTenant
  } = useEnhancedOwnerData();

  // Quick Actions handlers
  const handleAddProperty = () => {
    setIsAddPropertyOpen(true);
  };

  const handlePropertyAdded = () => {
    refreshData(); // Refresh the data to show the new property
  };

  const handleAddTenant = () => {
    setIsAddTenantOpen(true);
  };

  // Missing Quick Actions handlers
  const handleManageProperties = () => {
    setActiveTab('portfolio');
  };

  const handleManageTenants = () => {
    setActiveTab('tenants');
  };

  const handleViewReports = () => {
    setActiveTab('analytics');
  };

  const handleSubmitTenant = async () => {
    if (newTenantData.firstName && newTenantData.lastName && newTenantData.email) {
      try {
        await addTenant(newTenantData);
        setNewTenantData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          propertyId: '',
          rentAmount: '',
          depositAmount: '',
          startDate: new Date().toISOString().split('T')[0]
        });
        setIsAddTenantOpen(false);
      } catch (error) {
        console.error('Error adding tenant:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
          <Button onClick={refreshData} className="mt-4">
            Try Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Owner Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {ownerProfile?.name || 'Owner'}! Manage your property portfolio with advanced insights.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={refreshData}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Property Management</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleAddProperty}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Property
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManageProperties}>
                  <Building className="h-4 w-4 mr-2" />
                  Manage Properties
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tenant Management</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleAddTenant}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Tenant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManageTenants}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Tenants
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Analytics & Reports</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleViewReports}>
                  <FileBarChart className="h-4 w-4 mr-2" />
                  View Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Financial Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Short-Lets</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/owner/shortlets')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Short-Lets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/shortlets')}>
                  <Search className="h-4 w-4 mr-2" />
                  Browse All Short-Lets
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Quick Tools</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => window.open('/maintenance', '_blank')}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Maintenance Requests
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/payments', '_blank')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/properties/map', '_blank')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Property Map View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.portfolioValue || 0)}</p>
                  <p className="text-blue-100 text-xs mt-1">
                    +{((stats?.portfolioValue || 0) * 0.08 / 12).toFixed(1)}% this month
                  </p>
                </div>
                <Building className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Monthly Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.monthlyIncome || 0)}</p>
                  <p className="text-green-100 text-xs mt-1">
                    {stats?.occupancyRate || 0}% occupancy rate
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Properties</p>
                  <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
                  <p className="text-purple-100 text-xs mt-1">
                    {properties?.filter(p => p.status === 'occupied').length || 0} occupied
                  </p>
                </div>
                <Home className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Net Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.netIncome || 0)}</p>
                  <p className="text-orange-100 text-xs mt-1">
                    {((stats?.netIncome || 0) / (stats?.monthlyIncome || 1) * 100).toFixed(1)}% margin
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Tenants</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OwnerDashboardOverview
              ownerProfile={ownerProfile}
              stats={stats}
              properties={properties}
              tenants={tenants}
              finances={finances}
              performanceMetrics={performanceMetrics}
              onAddProperty={handleAddProperty}
              onAddTenant={handleAddTenant}
              onViewTenants={() => setActiveTab('tenants')}
              onViewFinances={() => setActiveTab('finances')}
            />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <OwnerPropertyPortfolio
              properties={properties}
              onAddProperty={handleAddProperty}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <OwnerFinancialAnalytics
              finances={finances}
              performanceMetrics={performanceMetrics}
            />
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants?.map((tenant) => (
                    <Card key={tenant.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{tenant.name}</h4>
                            <p className="text-sm text-gray-600">{tenant.email}</p>
                          </div>
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Property:</span>
                            <span className="font-medium">{tenant.propertyName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rent:</span>
                            <span className="font-medium">{formatCurrency(tenant.rentAmount || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lease End:</span>
                            <span className="font-medium">
                              {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString('en-NG') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Satisfaction:</span>
                            <span className="font-medium">{tenant.satisfactionScore || 0}/5</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {(tenants?.length || 0) > 6 && (
                  <div className="text-center">
                    <Button variant="outline">
                      View All {tenants?.length} Tenants
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Property Dialog - Using unified component */}
        <AddPropertyDialog
          open={isAddPropertyOpen}
          onOpenChange={setIsAddPropertyOpen}
          onPropertyAdded={handlePropertyAdded}
        />

        {/* Add Tenant Modal - Moved outside Tabs so it's always available */}
        <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant-firstName">First Name *</Label>
                  <Input
                    id="tenant-firstName"
                    value={newTenantData.firstName}
                    onChange={(e) => setNewTenantData({...newTenantData, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-lastName">Last Name *</Label>
                  <Input
                    id="tenant-lastName"
                    value={newTenantData.lastName}
                    onChange={(e) => setNewTenantData({...newTenantData, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tenant-email">Email *</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={newTenantData.email}
                  onChange={(e) => setNewTenantData({...newTenantData, email: e.target.value})}
                  placeholder="Enter tenant email"
                />
              </div>
              <div>
                <Label htmlFor="tenant-phone">Phone Number</Label>
                <Input
                  id="tenant-phone"
                  value={newTenantData.phone}
                  onChange={(e) => setNewTenantData({...newTenantData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="tenant-property">Assign to Property</Label>
                <Select value={newTenantData.propertyId} onValueChange={(value) => setNewTenantData({...newTenantData, propertyId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant-rent">Monthly Rent (₦)</Label>
                  <Input
                    id="tenant-rent"
                    value={newTenantData.rentAmount}
                    onChange={(e) => setNewTenantData({...newTenantData, rentAmount: e.target.value})}
                    placeholder="Enter monthly rent"
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-deposit">Security Deposit (₦)</Label>
                  <Input
                    id="tenant-deposit"
                    value={newTenantData.depositAmount}
                    onChange={(e) => setNewTenantData({...newTenantData, depositAmount: e.target.value})}
                    placeholder="Enter deposit amount"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tenant-startDate">Lease Start Date</Label>
                <Input
                  id="tenant-startDate"
                  type="date"
                  value={newTenantData.startDate}
                  onChange={(e) => setNewTenantData({...newTenantData, startDate: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddTenantOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitTenant}>Add Tenant</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </PageLayout>
  );
};

export default EnhancedOwnerDashboardPage;
