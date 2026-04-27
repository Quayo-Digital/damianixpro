import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  AlertCircle,
} from 'lucide-react';
import {
  Buyer,
  BuyerFormValues,
  buyerFormSchema,
  FinancingMethod,
} from '@/services/property/types';
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
      country: 'Nigeria',
    },
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
      const mockBuyers: Buyer[] = [];
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
        count: buyerData.filter((b) => b.status === 'ACTIVE' && !b.assigned_agent_id).length,
        buyers: buyerData.filter((b) => b.status === 'ACTIVE' && !b.assigned_agent_id),
      },
      {
        stage: 'Contacted',
        count: buyerData.filter((b) => b.status === 'ACTIVE' && b.assigned_agent_id).length,
        buyers: buyerData.filter((b) => b.status === 'ACTIVE' && b.assigned_agent_id),
      },
      {
        stage: 'Qualified',
        count: buyerData.filter((b) => b.status === 'QUALIFIED').length,
        buyers: buyerData.filter((b) => b.status === 'QUALIFIED'),
      },
      {
        stage: 'Unqualified',
        count: buyerData.filter((b) => b.status === 'UNQUALIFIED').length,
        buyers: buyerData.filter((b) => b.status === 'UNQUALIFIED'),
      },
    ];
    setBuyerPipeline(pipeline);
  };

  const filterBuyers = () => {
    let filtered = buyers;

    if (searchTerm) {
      filtered = filtered.filter(
        (buyer) =>
          buyer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          buyer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          buyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          buyer.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((buyer) => buyer.status === statusFilter);
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
        preferred_budget_min: data.preferred_budget_min
          ? parseFloat(data.preferred_budget_min)
          : undefined,
        preferred_budget_max: data.preferred_budget_max
          ? parseFloat(data.preferred_budget_max)
          : undefined,
        pre_approved_amount: data.pre_approved_amount
          ? parseFloat(data.pre_approved_amount)
          : undefined,
      };

      setBuyers((prev) => [...prev, newBuyer]);
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
        preferred_budget_min: data.preferred_budget_min
          ? parseFloat(data.preferred_budget_min)
          : undefined,
        preferred_budget_max: data.preferred_budget_max
          ? parseFloat(data.preferred_budget_max)
          : undefined,
        pre_approved_amount: data.pre_approved_amount
          ? parseFloat(data.pre_approved_amount)
          : undefined,
      };

      setBuyers((prev) =>
        prev.map((buyer) => (buyer.id === selectedBuyer.id ? updatedBuyer : buyer))
      );
      setIsEditDialogOpen(false);
      setSelectedBuyer(null);
      form.reset();
    } catch (error) {
      console.error('Error updating buyer:', error);
    }
  };

  const updateBuyerStatus = async (buyerId: string, newStatus: Buyer['status']) => {
    try {
      setBuyers((prev) =>
        prev.map((buyer) =>
          buyer.id === buyerId
            ? { ...buyer, status: newStatus, updated_at: new Date().toISOString() }
            : buyer
        )
      );
    } catch (error) {
      console.error('Error updating buyer status:', error);
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

  const getStatusBadge = (status: Buyer['status']) => {
    const statusConfig = {
      ACTIVE: { variant: 'default' as const, icon: <Clock className="h-3 w-3" /> },
      QUALIFIED: { variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
      UNQUALIFIED: { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> },
      INACTIVE: { variant: 'secondary' as const, icon: <UserX className="h-3 w-3" /> },
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
      CASH: 'bg-green-100 text-green-800',
      MORTGAGE: 'bg-blue-100 text-blue-800',
      INSTALLMENT: 'bg-yellow-100 text-yellow-800',
      MIXED: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[method]}`}>
        {method}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
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
              <Plus className="mr-2 h-4 w-4" />
              Add Buyer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
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
                    <p className="text-sm text-red-600">
                      {form.formState.errors.first_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input {...form.register('last_name')} />
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.last_name.message}
                    </p>
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
                  <Select
                    onValueChange={(value) =>
                      form.setValue('financing_method', value as FinancingMethod)
                    }
                  >
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredBuyers.map((buyer) => (
          <Card key={buyer.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {buyer.first_name} {buyer.last_name}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
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
                  <span>
                    {buyer.city}, {buyer.state}
                  </span>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Budget Range:</span>
                  <span className="text-sm font-medium">
                    {buyer.preferred_budget_min && buyer.preferred_budget_max
                      ? `${formatCurrency(buyer.preferred_budget_min)} - ${formatCurrency(buyer.preferred_budget_max)}`
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Financing:</span>
                  {getFinancingBadge(buyer.financing_method)}
                </div>
                {buyer.pre_approved_amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pre-approved:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(buyer.pre_approved_amount)}
                    </span>
                  </div>
                )}
              </div>

              {buyer.preferred_locations && buyer.preferred_locations.length > 0 && (
                <div>
                  <p className="mb-1 text-sm text-gray-600">Preferred Locations:</p>
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
                <div className="rounded bg-gray-50 p-3 text-sm">
                  <p className="mb-1 font-medium text-gray-600">Notes:</p>
                  <p>{buyer.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-2">
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
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="mr-1 h-3 w-3" />
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
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Buyer</DialogTitle>
            <DialogDescription>Update buyer information and preferences</DialogDescription>
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
          <CardContent className="py-8 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No buyers found</h3>
            <p className="mb-4 text-gray-600">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first buyer'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Buyer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
