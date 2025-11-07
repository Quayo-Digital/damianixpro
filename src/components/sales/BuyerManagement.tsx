import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  UserCheck,
  UserX,
  Building,
  CreditCard,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Buyer, BuyerFormValues, buyerFormSchema, FinancingMethod } from '@/services/property/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface BuyerManagementProps {
  userRole: 'admin' | 'owner' | 'agent';
  userId?: string;
}

interface BuyerPipeline {
  stage: string;
  count: number;
  buyers: Buyer[];
}

export const BuyerManagement: React.FC<BuyerManagementProps> = ({ userRole, userId }) => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);
  const [buyerPipeline, setBuyerPipeline] = useState<BuyerPipeline[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      state: 'Lagos',
      country: 'Nigeria'
    }
  });

  useEffect(() => {
    loadBuyers();
  }, [userId, userRole]);

  useEffect(() => {
    filterBuyers();
  }, [buyers, searchTerm, statusFilter]);

  const loadBuyers = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockBuyers: Buyer[] = [
        {
          id: '1',
          first_name: 'Michael',
          last_name: 'Adebayo',
          email: 'michael.adebayo@email.com',
          phone: '+234-801-234-5678',
          address: '15 Admiralty Way, Lekki Phase 1',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          occupation: 'Software Engineer',
          employer: 'TechCorp Nigeria',
          monthly_income: 850000,
          preferred_budget_min: 20000000,
          preferred_budget_max: 50000000,
          preferred_locations: ['Lekki', 'Victoria Island', 'Ikoyi'],
          preferred_property_types: ['Residential', 'Commercial'],
          financing_method: 'MORTGAGE',
          pre_approved_amount: 45000000,
          bank_name: 'First Bank Nigeria',
          identification_type: 'NIN',
          identification_number: '12345678901',
          status: 'QUALIFIED',
          lead_source: 'Website',
          assigned_agent_id: 'agent1',
          notes: 'High-value prospect, looking for luxury property',
          created_at: '2025-08-01T10:00:00Z'
        },
        {
          id: '2',
          first_name: 'Grace',
          last_name: 'Okonkwo',
          email: 'grace.okonkwo@email.com',
          phone: '+234-802-345-6789',
          address: '8 Banana Island Road',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          occupation: 'Business Owner',
          employer: 'Grace Enterprises',
          monthly_income: 1200000,
          preferred_budget_min: 15000000,
          preferred_budget_max: 35000000,
          preferred_locations: ['Banana Island', 'Parkview Estate'],
          preferred_property_types: ['Residential'],
          financing_method: 'CASH',
          identification_type: 'PASSPORT',
          identification_number: 'A12345678',
          status: 'ACTIVE',
          lead_source: 'Referral',
          assigned_agent_id: 'agent2',
          notes: 'Cash buyer, ready to close quickly',
          created_at: '2025-08-05T14:30:00Z'
        },
        {
          id: '3',
          first_name: 'David',
          last_name: 'Okafor',
          email: 'david.okafor@email.com',
          phone: '+234-803-456-7890',
          address: '22 Guzape District',
          city: 'Abuja',
          state: 'FCT',
          country: 'Nigeria',
          occupation: 'Government Official',
          employer: 'Federal Ministry',
          monthly_income: 650000,
          preferred_budget_min: 25000000,
          preferred_budget_max: 60000000,
          preferred_locations: ['Guzape', 'Maitama', 'Asokoro'],
          preferred_property_types: ['Residential', 'Land'],
          financing_method: 'INSTALLMENT',
          status: 'UNQUALIFIED',
          lead_source: 'Social Media',
          notes: 'Needs financing assistance',
          created_at: '2025-08-08T09:15:00Z'
        },
        {
          id: '4',
          first_name: 'Fatima',
          last_name: 'Mohammed',
          email: 'fatima.mohammed@email.com',
          phone: '+234-804-567-8901',
          address: '5 GRA Phase 2',
          city: 'Port Harcourt',
          state: 'Rivers',
          country: 'Nigeria',
          occupation: 'Oil & Gas Executive',
          employer: 'Shell Nigeria',
          monthly_income: 950000,
          preferred_budget_min: 30000000,
          preferred_budget_max: 80000000,
          preferred_locations: ['GRA', 'Old GRA', 'Trans Amadi'],
          preferred_property_types: ['Residential', 'Commercial'],
          financing_method: 'MIXED',
          pre_approved_amount: 60000000,
          bank_name: 'Zenith Bank',
          status: 'QUALIFIED',
          lead_source: 'Agent Network',
          assigned_agent_id: 'agent3',
          notes: 'Relocating from Lagos, urgent requirement',
          created_at: '2025-08-03T16:45:00Z'
        }
      ];

      setBuyers(mockBuyers);
      generateBuyerPipeline(mockBuyers);
    } catch (error) {
      console.error('Error loading buyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBuyerPipeline = (buyerData: Buyer[]) => {
    const pipeline: BuyerPipeline[] = [
      {
        stage: 'New Leads',
        count: buyerData.filter(b => b.status === 'ACTIVE' && !b.assigned_agent_id).length,
        buyers: buyerData.filter(b => b.status === 'ACTIVE' && !b.assigned_agent_id)
      },
      {
        stage: 'Contacted',
        count: buyerData.filter(b => b.status === 'ACTIVE' && b.assigned_agent_id).length,
        buyers: buyerData.filter(b => b.status === 'ACTIVE' && b.assigned_agent_id)
      },
      {
        stage: 'Qualified',
        count: buyerData.filter(b => b.status === 'QUALIFIED').length,
        buyers: buyerData.filter(b => b.status === 'QUALIFIED')
      },
      {
        stage: 'Unqualified',
        count: buyerData.filter(b => b.status === 'UNQUALIFIED').length,
        buyers: buyerData.filter(b => b.status === 'UNQUALIFIED')
      }
    ];
    setBuyerPipeline(pipeline);
  };

  const filterBuyers = () => {
    let filtered = buyers;

    if (searchTerm) {
      filtered = filtered.filter(buyer => 
        buyer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(buyer => buyer.status === statusFilter);
    }

    setFilteredBuyers(filtered);
  };

  const handleAddBuyer = async (data: BuyerFormValues) => {
    try {
      // Mock API call - replace with actual implementation
      const newBuyer: Buyer = {
        id: Date.now().toString(),
        ...data,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : undefined,
        preferred_budget_min: data.preferred_budget_min ? parseFloat(data.preferred_budget_min) : undefined,
        preferred_budget_max: data.preferred_budget_max ? parseFloat(data.preferred_budget_max) : undefined,
        pre_approved_amount: data.pre_approved_amount ? parseFloat(data.pre_approved_amount) : undefined,
      };

      setBuyers(prev => [...prev, newBuyer]);
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error adding buyer:', error);
    }
  };

  const handleEditBuyer = async (data: BuyerFormValues) => {
    if (!selectedBuyer) return;

    try {
      // Mock API call - replace with actual implementation
      const updatedBuyer: Buyer = {
        ...selectedBuyer,
        ...data,
        updated_at: new Date().toISOString(),
        monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : undefined,
        preferred_budget_min: data.preferred_budget_min ? parseFloat(data.preferred_budget_min) : undefined,
        preferred_budget_max: data.preferred_budget_max ? parseFloat(data.preferred_budget_max) : undefined,
        pre_approved_amount: data.pre_approved_amount ? parseFloat(data.pre_approved_amount) : undefined,
      };

      setBuyers(prev => prev.map(buyer => 
        buyer.id === selectedBuyer.id ? updatedBuyer : buyer
      ));
      setIsEditDialogOpen(false);
      setSelectedBuyer(null);
      form.reset();
    } catch (error) {
      console.error('Error updating buyer:', error);
    }
  };

  const updateBuyerStatus = async (buyerId: string, newStatus: Buyer['status']) => {
    try {
      setBuyers(prev => prev.map(buyer => 
        buyer.id === buyerId 
          ? { ...buyer, status: newStatus, updated_at: new Date().toISOString() }
          : buyer
      ));
    } catch (error) {
      console.error('Error updating buyer status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: Buyer['status']) => {
    const statusConfig = {
      'ACTIVE': { variant: 'default' as const, icon: <Clock className="h-3 w-3" /> },
      'QUALIFIED': { variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
      'UNQUALIFIED': { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> },
      'INACTIVE': { variant: 'secondary' as const, icon: <UserX className="h-3 w-3" /> }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getFinancingBadge = (method?: FinancingMethod) => {
    if (!method) return null;
    
    const colors = {
      'CASH': 'bg-green-100 text-green-800',
      'MORTGAGE': 'bg-blue-100 text-blue-800',
      'INSTALLMENT': 'bg-yellow-100 text-yellow-800',
      'MIXED': 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[method]}`}>
        {method}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading buyer management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Buyer Management</h2>
          <p className="text-gray-600">Manage buyer leads and sales pipeline</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Buyer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Buyer</DialogTitle>
              <DialogDescription>
                Create a new buyer profile for sales pipeline management
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleAddBuyer)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input {...form.register('first_name')} />
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-red-600">{form.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input {...form.register('last_name')} />
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-red-600">{form.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input {...form.register('phone')} />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input {...form.register('address')} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input {...form.register('city')} />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input {...form.register('state')} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input {...form.register('country')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input {...form.register('occupation')} />
                </div>
                <div>
                  <Label htmlFor="employer">Employer</Label>
                  <Input {...form.register('employer')} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthly_income">Monthly Income (₦)</Label>
                  <Input type="number" {...form.register('monthly_income')} />
                </div>
                <div>
                  <Label htmlFor="preferred_budget_min">Min Budget (₦)</Label>
                  <Input type="number" {...form.register('preferred_budget_min')} />
                </div>
                <div>
                  <Label htmlFor="preferred_budget_max">Max Budget (₦)</Label>
                  <Input type="number" {...form.register('preferred_budget_max')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financing_method">Financing Method</Label>
                  <Select onValueChange={(value) => form.setValue('financing_method', value as FinancingMethod)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select financing method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="MORTGAGE">Mortgage</SelectItem>
                      <SelectItem value="INSTALLMENT">Installment</SelectItem>
                      <SelectItem value="MIXED">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pre_approved_amount">Pre-approved Amount (₦)</Label>
                  <Input type="number" {...form.register('pre_approved_amount')} />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea {...form.register('notes')} rows={3} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Buyer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {buyerPipeline.map((stage) => (
          <Card key={stage.stage}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stage.stage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stage.count}</div>
              <p className="text-xs text-muted-foreground">
                {stage.count === 1 ? 'buyer' : 'buyers'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search buyers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="QUALIFIED">Qualified</SelectItem>
            <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Buyers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBuyers.map((buyer) => (
          <Card key={buyer.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{buyer.first_name} {buyer.last_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-3 w-3" />
                    {buyer.email}
                  </CardDescription>
                </div>
                {getStatusBadge(buyer.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span>{buyer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span>{buyer.city}, {buyer.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3 text-gray-500" />
                  <span>{buyer.occupation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-gray-500" />
                  <span>{buyer.monthly_income ? formatCurrency(buyer.monthly_income) : 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Budget Range:</span>
                  <span className="text-sm font-medium">
                    {buyer.preferred_budget_min && buyer.preferred_budget_max 
                      ? `${formatCurrency(buyer.preferred_budget_min)} - ${formatCurrency(buyer.preferred_budget_max)}`
                      : 'Not specified'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Financing:</span>
                  {getFinancingBadge(buyer.financing_method)}
                </div>
                {buyer.pre_approved_amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pre-approved:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(buyer.pre_approved_amount)}
                    </span>
                  </div>
                )}
              </div>

              {buyer.preferred_locations && buyer.preferred_locations.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Preferred Locations:</p>
                  <div className="flex flex-wrap gap-1">
                    {buyer.preferred_locations.map((location, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {buyer.notes && (
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <p className="text-gray-600 font-medium mb-1">Notes:</p>
                  <p>{buyer.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBuyer(buyer);
                      form.reset(buyer as any);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
                <div className="flex gap-1">
                  {buyer.status !== 'QUALIFIED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBuyerStatus(buyer.id, 'QUALIFIED')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <UserCheck className="h-3 w-3" />
                    </Button>
                  )}
                  {buyer.status !== 'UNQUALIFIED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBuyerStatus(buyer.id, 'UNQUALIFIED')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserX className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Buyer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Buyer</DialogTitle>
            <DialogDescription>
              Update buyer information and preferences
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleEditBuyer)} className="space-y-4">
            {/* Same form fields as Add Buyer - truncated for brevity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input {...form.register('first_name')} />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input {...form.register('last_name')} />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Buyer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {filteredBuyers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No buyers found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first buyer'
              }
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Buyer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
