import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Home, 
  Users, 
  Calendar,
  MapPin,
  FileText,
  PieChart,
  BarChart3,
  Eye,
  Plus,
  Filter,
  Download,
  Search,
  Building,
  Landmark,
  Factory,
  TreePine
} from 'lucide-react';
import { SalesTransaction, Property, Buyer, PropertyInquiry } from '@/services/property/types';

interface SalesDashboardProps {
  userRole: 'admin' | 'owner' | 'agent';
  userId?: string;
}

interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  averageSalePrice: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  pendingTransactions: number;
  activeBuyers: number;
  propertiesForSale: number;
  conversionRate: number;
  averageDaysToSale: number;
}

interface SalesAnalytics {
  salesByMonth: { month: string; sales: number; revenue: number }[];
  salesByPropertyType: { type: string; count: number; revenue: number }[];
  salesByLocation: { location: string; count: number; avgPrice: number }[];
  topPerformingAgents: { agentId: string; agentName: string; sales: number; revenue: number }[];
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ userRole, userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<SalesTransaction[]>([]);
  const [propertiesForSale, setPropertiesForSale] = useState<Property[]>([]);
  const [activeBuyers, setActiveBuyers] = useState<Buyer[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesDashboardData();
  }, [userId, userRole]);

  const loadSalesDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API integration
      await Promise.all([
        loadSalesMetrics(),
        loadSalesAnalytics(),
        loadRecentTransactions(),
        loadPropertiesForSale(),
        loadActiveBuyers(),
        loadRecentInquiries()
      ]);
    } catch (error) {
      console.error('Error loading sales dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesMetrics = async () => {
    // Mock data - replace with actual API call
    const metrics: SalesMetrics = {
      totalSales: 156,
      totalRevenue: 2450000000, // ₦2.45B
      averageSalePrice: 15705128,
      salesThisMonth: 23,
      revenueThisMonth: 380000000,
      pendingTransactions: 12,
      activeBuyers: 89,
      propertiesForSale: 234,
      conversionRate: 18.5,
      averageDaysToSale: 45
    };
    setSalesMetrics(metrics);
  };

  const loadSalesAnalytics = async () => {
    // Mock data - replace with actual API call
    const analytics: SalesAnalytics = {
      salesByMonth: [
        { month: 'Jan', sales: 18, revenue: 290000000 },
        { month: 'Feb', sales: 22, revenue: 340000000 },
        { month: 'Mar', sales: 19, revenue: 310000000 },
        { month: 'Apr', sales: 25, revenue: 420000000 },
        { month: 'May', sales: 21, revenue: 350000000 },
        { month: 'Jun', sales: 28, revenue: 480000000 },
      ],
      salesByPropertyType: [
        { type: 'Residential', count: 89, revenue: 1200000000 },
        { type: 'Commercial', count: 34, revenue: 890000000 },
        { type: 'Land', count: 23, revenue: 280000000 },
        { type: 'Industrial', count: 10, revenue: 180000000 }
      ],
      salesByLocation: [
        { location: 'Lagos Island', count: 45, avgPrice: 25000000 },
        { location: 'Victoria Island', count: 32, avgPrice: 35000000 },
        { location: 'Abuja Central', count: 28, avgPrice: 22000000 },
        { location: 'Port Harcourt GRA', count: 18, avgPrice: 18000000 },
        { location: 'Ikeja', count: 33, avgPrice: 15000000 }
      ],
      topPerformingAgents: [
        { agentId: '1', agentName: 'Adebayo Johnson', sales: 28, revenue: 450000000 },
        { agentId: '2', agentName: 'Fatima Abdullahi', sales: 24, revenue: 380000000 },
        { agentId: '3', agentName: 'Chinedu Okafor', sales: 22, revenue: 340000000 },
        { agentId: '4', agentName: 'Aisha Mohammed', sales: 19, revenue: 290000000 }
      ]
    };
    setSalesAnalytics(analytics);
  };

  const loadRecentTransactions = async () => {
    // Mock data - replace with actual API call
    const transactions: SalesTransaction[] = [
      {
        id: '1',
        property_id: 'prop1',
        buyer_id: 'buyer1',
        seller_id: 'seller1',
        agent_id: 'agent1',
        transaction_type: 'SALE',
        sale_price: 25000000,
        status: 'PAYMENT_PENDING',
        created_at: '2025-08-08T10:00:00Z',
        property: { id: 'prop1', name: '4BR Duplex - Lekki', address: 'Lekki Phase 1', transaction_type: 'SALE', property_category: 'RESIDENTIAL', price: '25000000', location: 'Lagos' } as Property,
        buyer: { id: 'buyer1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', status: 'QUALIFIED' } as Buyer
      },
      {
        id: '2',
        property_id: 'prop2',
        buyer_id: 'buyer2',
        seller_id: 'seller2',
        transaction_type: 'SALE',
        sale_price: 15000000,
        status: 'CONTRACT_SIGNED',
        created_at: '2025-08-07T14:30:00Z',
        property: { id: 'prop2', name: 'Commercial Plot - Ikeja', address: 'Ikeja Business District', transaction_type: 'SALE', property_category: 'COMMERCIAL', price: '15000000', location: 'Lagos' } as Property,
        buyer: { id: 'buyer2', first_name: 'Sarah', last_name: 'Williams', email: 'sarah@example.com', status: 'QUALIFIED' } as Buyer
      }
    ];
    setRecentTransactions(transactions);
  };

  const loadPropertiesForSale = async () => {
    // Mock data - replace with actual API call
    const properties: Property[] = [
      {
        id: 'prop1',
        name: '5BR Mansion - Victoria Island',
        address: 'Victoria Island, Lagos',
        transaction_type: 'SALE',
        property_category: 'RESIDENTIAL',
        price: '85000000',
        sale_price: 85000000,
        location: 'Lagos',
        status: 'Available',
        bedrooms: '5',
        bathrooms: '6',
        squareFeet: '4500'
      },
      {
        id: 'prop2',
        name: 'Commercial Land - Abuja',
        address: 'Central Business District, Abuja',
        transaction_type: 'SALE',
        property_category: 'LAND',
        price: '120000000',
        sale_price: 120000000,
        location: 'Abuja',
        status: 'Available',
        land_size_acres: 2.5,
        development_status: 'TITLED'
      }
    ];
    setPropertiesForSale(properties);
  };

  const loadActiveBuyers = async () => {
    // Mock data - replace with actual API call
    const buyers: Buyer[] = [
      {
        id: 'buyer1',
        first_name: 'Michael',
        last_name: 'Adebayo',
        email: 'michael@example.com',
        phone: '+234-801-234-5678',
        preferred_budget_max: 50000000,
        financing_method: 'MORTGAGE',
        status: 'QUALIFIED',
        assigned_agent_id: 'agent1'
      },
      {
        id: 'buyer2',
        first_name: 'Grace',
        last_name: 'Okonkwo',
        email: 'grace@example.com',
        phone: '+234-802-345-6789',
        preferred_budget_max: 25000000,
        financing_method: 'CASH',
        status: 'ACTIVE',
        assigned_agent_id: 'agent2'
      }
    ];
    setActiveBuyers(buyers);
  };

  const loadRecentInquiries = async () => {
    // Mock data - replace with actual API call
    const inquiries: PropertyInquiry[] = [
      {
        id: 'inq1',
        property_id: 'prop1',
        inquirer_type: 'BUYER',
        inquirer_name: 'David Okafor',
        inquirer_email: 'david@example.com',
        inquiry_type: 'VIEWING_REQUEST',
        message: 'Interested in viewing this property this weekend',
        status: 'NEW',
        created_at: '2025-08-10T09:00:00Z'
      }
    ];
    setRecentInquiries(inquiries);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPropertyCategoryIcon = (category: string) => {
    switch (category) {
      case 'RESIDENTIAL': return <Home className="h-4 w-4" />;
      case 'COMMERCIAL': return <Building className="h-4 w-4" />;
      case 'LAND': return <TreePine className="h-4 w-4" />;
      case 'INDUSTRIAL': return <Factory className="h-4 w-4" />;
      default: return <Landmark className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'INITIATED': { variant: 'secondary' as const, label: 'Initiated' },
      'UNDER_NEGOTIATION': { variant: 'default' as const, label: 'Negotiating' },
      'CONTRACT_SIGNED': { variant: 'default' as const, label: 'Contract Signed' },
      'PAYMENT_PENDING': { variant: 'destructive' as const, label: 'Payment Pending' },
      'PAYMENT_PARTIAL': { variant: 'destructive' as const, label: 'Partial Payment' },
      'PAYMENT_COMPLETE': { variant: 'default' as const, label: 'Payment Complete' },
      'COMPLETED': { variant: 'default' as const, label: 'Completed' },
      'CANCELLED': { variant: 'destructive' as const, label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading sales dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Dashboard</h2>
          <p className="text-gray-600">Comprehensive sales and lease management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {salesMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesMetrics.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                +{salesMetrics.salesThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesMetrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +{formatCurrency(salesMetrics.revenueThisMonth)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Sale Price</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesMetrics.averageSalePrice)}</div>
              <p className="text-xs text-muted-foreground">
                {salesMetrics.averageDaysToSale} days avg to sale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesMetrics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {salesMetrics.activeBuyers} active buyers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest sales and lease transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getPropertyCategoryIcon(transaction.property?.property_category || 'RESIDENTIAL')}
                        <div>
                          <p className="font-medium">{transaction.property?.name}</p>
                          <p className="text-sm text-gray-600">{transaction.buyer?.first_name} {transaction.buyer?.last_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.sale_price)}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Properties for Sale</CardTitle>
                <CardDescription>Available properties and land</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propertiesForSale.slice(0, 3).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getPropertyCategoryIcon(property.property_category)}
                        <div>
                          <p className="font-medium">{property.name}</p>
                          <p className="text-sm text-gray-600">{property.address}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(property.sale_price || 0)}</p>
                        <Badge variant="secondary">{property.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions</CardTitle>
              <CardDescription>Manage all sales and lease transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getPropertyCategoryIcon(transaction.property?.property_category || 'RESIDENTIAL')}
                        <div>
                          <h4 className="font-medium">{transaction.property?.name}</h4>
                          <p className="text-sm text-gray-600">{transaction.property?.address}</p>
                        </div>
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Buyer</p>
                        <p className="font-medium">{transaction.buyer?.first_name} {transaction.buyer?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sale Price</p>
                        <p className="font-medium">{formatCurrency(transaction.sale_price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Transaction Type</p>
                        <p className="font-medium">{transaction.transaction_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Created</p>
                        <p className="font-medium">{new Date(transaction.created_at || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Properties for Sale</CardTitle>
              <CardDescription>Manage properties available for sale and lease</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propertiesForSale.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {getPropertyCategoryIcon(property.property_category)}
                      <Badge variant="outline">{property.property_category}</Badge>
                      <Badge variant="secondary">{property.transaction_type}</Badge>
                    </div>
                    <h4 className="font-medium mb-2">{property.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{property.address}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">{formatCurrency(property.sale_price || 0)}</span>
                      </div>
                      {property.bedrooms && (
                        <div className="flex justify-between">
                          <span>Bedrooms:</span>
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.land_size_acres && (
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{property.land_size_acres} acres</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="secondary">{property.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Buyers</CardTitle>
              <CardDescription>Manage buyer leads and qualified prospects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeBuyers.map((buyer) => (
                  <div key={buyer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{buyer.first_name} {buyer.last_name}</h4>
                        <p className="text-sm text-gray-600">{buyer.email}</p>
                      </div>
                      <Badge variant={buyer.status === 'QUALIFIED' ? 'default' : 'secondary'}>
                        {buyer.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Budget</p>
                        <p className="font-medium">{formatCurrency(buyer.preferred_budget_max || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Financing</p>
                        <p className="font-medium">{buyer.financing_method}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium">{buyer.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Agent</p>
                        <p className="font-medium">{buyer.assigned_agent_id ? 'Assigned' : 'Unassigned'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Inquiries</CardTitle>
              <CardDescription>Manage leads and viewing requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{inquiry.inquirer_name}</h4>
                        <p className="text-sm text-gray-600">{inquiry.inquirer_email}</p>
                      </div>
                      <Badge variant="secondary">{inquiry.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Inquiry Type</p>
                        <p className="font-medium">{inquiry.inquiry_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Inquirer Type</p>
                        <p className="font-medium">{inquiry.inquirer_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">{new Date(inquiry.created_at || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                    {inquiry.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm">{inquiry.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                {salesAnalytics?.salesByPropertyType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {getPropertyCategoryIcon(item.type.toUpperCase())}
                      <span>{item.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.count} sales</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Locations</CardTitle>
              </CardHeader>
              <CardContent>
                {salesAnalytics?.salesByLocation.map((item) => (
                  <div key={item.location} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.count} sales</p>
                      <p className="text-sm text-gray-600">Avg: {formatCurrency(item.avgPrice)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
