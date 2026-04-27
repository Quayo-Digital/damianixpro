import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
} from 'lucide-react';
import { useEnhancedOwnerData } from '@/hooks/useEnhancedOwnerData';
import OwnerDashboardOverview from '@/components/owner/OwnerDashboardOverview';
import OwnerPropertyPortfolio from '@/components/owner/OwnerPropertyPortfolio';
import OwnerFinancialAnalytics from '@/components/owner/OwnerFinancialAnalytics';
import { PageLayout } from '@/components/layout/PageLayout';
import { AddPropertyDialog } from '@/components/properties/AddPropertyDialog';
import { AddShortletDialog } from '@/components/shortlet/AddShortletDialog';
import { VoiceAssistantWidget } from '@/components/voice/VoiceAssistantWidget';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OwnerSubscriptionGateBanner } from '@/components/owner/OwnerSubscriptionGateBanner';
import { RoleScreeningBanner } from '@/components/screening/RoleScreeningBanner';
import { useOwnerSubscriptionAccess } from '@/hooks/useOwnerSubscriptionAccess';

const EnhancedOwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPaidOwnerAccess, isCheckingAccess } = useOwnerSubscriptionAccess();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddShortletOpen, setIsAddShortletOpen] = useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: '',
    rentAmount: '',
    depositAmount: '',
    startDate: new Date().toISOString().split('T')[0],
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
    updateTenant,
  } = useEnhancedOwnerData();

  // Quick Actions handlers
  const handleAddProperty = () => {
    if (isCheckingAccess) return;
    if (!hasPaidOwnerAccess) {
      toast.error('Subscribe or start a trial to add properties.');
      navigate('/owner/subscription');
      return;
    }
    setIsAddPropertyOpen(true);
  };

  const handleAddShortlet = () => {
    if (isCheckingAccess) return;
    if (!hasPaidOwnerAccess) {
      toast.error('Subscribe or start a trial to create short-let listings.');
      navigate('/owner/subscription');
      return;
    }
    setIsAddShortletOpen(true);
  };

  const handlePropertyAdded = () => {
    refreshData(); // Refresh the data to show the new property
  };

  const handleShortletAdded = () => {
    refreshData(); // Refresh the data to show the new shortlet
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
          startDate: new Date().toISOString().split('T')[0],
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
            <div className="mb-4 h-8 w-1/4 rounded bg-muted"></div>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded bg-muted"></div>
              ))}
            </div>
            <div className="h-96 rounded bg-muted"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="py-12 text-center">
          <div className="mb-4 text-red-600">
            <Shield className="mx-auto mb-4 h-12 w-12" />
            <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
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
        <OwnerSubscriptionGateBanner />
        <RoleScreeningBanner />
        {/* Header */}
        <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Enhanced Owner Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back, {ownerProfile?.name || 'Owner'}! Manage your property portfolio with
              advanced insights.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={refreshData}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Quick Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Property Management</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleAddProperty}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Property
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManageProperties}>
                  <Building className="mr-2 h-4 w-4" />
                  Manage Properties
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tenant Management</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleAddTenant}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Tenant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManageTenants}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Tenants
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Analytics & Reports</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleViewReports}>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  View Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Financial Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Short-Lets</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleAddShortlet}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Short-Let
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/owner/shortlets')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Short-Lets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/shortlets')}>
                  <Search className="mr-2 h-4 w-4" />
                  Browse All Short-Lets
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Quick Tools</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => window.open('/maintenance', '_blank')}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Maintenance Requests
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/payments', '_blank')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/properties/map', '_blank')}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Property Map View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.portfolioValue || 0)}</p>
                  <p className="mt-1 text-xs text-blue-100">
                    +{(((stats?.portfolioValue || 0) * 0.08) / 12).toFixed(1)}% this month
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
                  <p className="text-sm font-medium text-green-100">Monthly Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.monthlyIncome || 0)}</p>
                  <p className="mt-1 text-xs text-green-100">
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
                  <p className="text-sm font-medium text-purple-100">Properties</p>
                  <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
                  <p className="mt-1 text-xs text-purple-100">
                    {properties?.filter((p) => p.status === 'occupied').length || 0} occupied
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
                  <p className="text-sm font-medium text-orange-100">Net Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.netIncome || 0)}</p>
                  <p className="mt-1 text-xs text-orange-100">
                    {(((stats?.netIncome || 0) / (stats?.monthlyIncome || 1)) * 100).toFixed(1)}%
                    margin
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <VoiceAssistantWidget
          className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 text-foreground dark:border-purple-800 dark:from-purple-950/40 dark:to-indigo-950/40"
          compact={false}
          showHistory={false}
        />

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
              onPropertyUpdated={handlePropertyAdded}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <OwnerFinancialAnalytics finances={finances} performanceMetrics={performanceMetrics} />
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tenants?.map((tenant) => (
                    <Card key={tenant.id}>
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{tenant.name}</h4>
                            <p className="text-sm text-muted-foreground">{tenant.email}</p>
                          </div>
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Property:</span>
                            <span className="font-medium text-foreground">
                              {tenant.propertyName || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rent:</span>
                            <span className="font-medium text-foreground">
                              {formatCurrency(tenant.rentAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lease End:</span>
                            <span className="font-medium text-foreground">
                              {tenant.leaseEndDate
                                ? new Date(tenant.leaseEndDate).toLocaleDateString('en-NG')
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Satisfaction:</span>
                            <span className="font-medium text-foreground">
                              {tenant.satisfactionScore || 0}/5
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <FileText className="mr-1 h-4 w-4" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {(tenants?.length || 0) > 6 && (
                  <div className="text-center">
                    <Button variant="outline">View All {tenants?.length} Tenants</Button>
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

        {/* Add Short-Let Dialog */}
        <AddShortletDialog
          open={isAddShortletOpen}
          onOpenChange={setIsAddShortletOpen}
          onShortletAdded={handleShortletAdded}
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
                    onChange={(e) =>
                      setNewTenantData({ ...newTenantData, firstName: e.target.value })
                    }
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-lastName">Last Name *</Label>
                  <Input
                    id="tenant-lastName"
                    value={newTenantData.lastName}
                    onChange={(e) =>
                      setNewTenantData({ ...newTenantData, lastName: e.target.value })
                    }
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
                  onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
                  placeholder="Enter tenant email"
                />
              </div>
              <div>
                <Label htmlFor="tenant-phone">Phone Number</Label>
                <Input
                  id="tenant-phone"
                  value={newTenantData.phone}
                  onChange={(e) => setNewTenantData({ ...newTenantData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="tenant-property">Assign to Property</Label>
                <Select
                  value={newTenantData.propertyId}
                  onValueChange={(value) =>
                    setNewTenantData({ ...newTenantData, propertyId: value })
                  }
                >
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
                  <Label htmlFor="tenant-rent">Annual Rent (₦)</Label>
                  <Input
                    id="tenant-rent"
                    value={newTenantData.rentAmount}
                    onChange={(e) =>
                      setNewTenantData({ ...newTenantData, rentAmount: e.target.value })
                    }
                    placeholder="Enter annual rent"
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-deposit">Security Deposit (₦)</Label>
                  <Input
                    id="tenant-deposit"
                    value={newTenantData.depositAmount}
                    onChange={(e) =>
                      setNewTenantData({ ...newTenantData, depositAmount: e.target.value })
                    }
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
                  onChange={(e) =>
                    setNewTenantData({ ...newTenantData, startDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddTenantOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitTenant}>Add Tenant</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default EnhancedOwnerDashboardPage;
