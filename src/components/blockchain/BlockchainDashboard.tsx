// Blockchain Dashboard Component
// Comprehensive dashboard for blockchain integration features

import React, { useState } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { BlockchainWallet } from './BlockchainWallet';
import { PropertyEscrow } from './PropertyEscrow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Shield, 
  Home, 
  FileText, 
  TrendingUp, 
  Users,
  Lock,
  CheckCircle,
  Clock,
  DollarSign,
  Network,
  Zap,
  AlertTriangle,
  ExternalLink,
  Copy,
  BarChart3,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EscrowTransaction, PropertyOnChain, BlockchainPayment } from '@/types/blockchain';

interface BlockchainDashboardProps {
  className?: string;
  compact?: boolean;
}

export const BlockchainDashboard: React.FC<BlockchainDashboardProps> = ({
  className,
  compact = false
}) => {
  const {
    walletConnection,
    currentNetwork,
    isConnected,
    canUseBlockchain,
    walletBalance,
    transactionHistory,
    recentTransactions,
    formatAddress,
    getExplorerUrl,
    getNetworkConfig
  } = useBlockchain();

  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const [propertyTokens] = useState<PropertyOnChain[]>([
    {
      tokenId: '1',
      propertyId: 'PROP001',
      owner: walletConnection?.address || '0x0000000000000000000000000000000000000000',
      title: '3 Bedroom Apartment in Victoria Island',
      location: {
        latitude: 6.4281,
        longitude: 3.4219,
        address: 'Victoria Island, Lagos, Nigeria'
      },
      metadata: {
        size: 120,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'apartment',
        yearBuilt: 2020
      },
      documents: [
        {
          hash: '0xabc123...',
          type: 'deed',
          ipfsHash: 'QmXYZ789...'
        }
      ],
      price: '0.5',
      currency: 'ETH',
      verified: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ]);

  const [escrowContracts] = useState<EscrowTransaction[]>([
    {
      id: 'escrow_1',
      propertyId: 'PROP001',
      contractAddress: '0x1234567890123456789012345678901234567890',
      buyer: walletConnection?.address || '0x0000000000000000000000000000000000000000',
      seller: '0x9876543210987654321098765432109876543210',
      amount: '0.5',
      currency: 'ETH',
      status: 'funded',
      conditions: [
        {
          id: 'cond_1',
          description: 'Property inspection completed',
          type: 'inspection',
          required: true,
          completed: true,
          completedAt: '2024-01-20T14:00:00Z'
        },
        {
          id: 'cond_2',
          description: 'Financing approved',
          type: 'financing',
          required: true,
          completed: false
        }
      ],
      milestones: [
        {
          id: 'mile_1',
          title: 'Initial Deposit',
          description: 'Release 10% upon contract signing',
          percentage: 10,
          conditions: [],
          completed: true,
          completedAt: '2024-01-18T12:00:00Z'
        },
        {
          id: 'mile_2',
          title: 'Inspection Complete',
          description: 'Release 40% after successful inspection',
          percentage: 40,
          conditions: ['cond_1'],
          completed: true,
          completedAt: '2024-01-20T15:00:00Z'
        }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:00:00Z'
    }
  ]);

  const [blockchainPayments] = useState<BlockchainPayment[]>([
    {
      id: 'pay_1',
      type: 'rent',
      amount: '0.1',
      currency: 'ETH',
      from: walletConnection?.address || '0x0000000000000000000000000000000000000000',
      to: '0x9876543210987654321098765432109876543210',
      propertyId: 'PROP001',
      description: 'Monthly rent payment',
      status: 'confirmed',
      transactionHash: '0xdef456...',
      blockNumber: 12345678,
      createdAt: '2024-01-01T10:00:00Z',
      confirmedAt: '2024-01-01T10:05:00Z'
    }
  ]);

  // Calculate statistics
  const totalPropertyValue = propertyTokens.reduce((sum, property) => sum + parseFloat(property.price), 0);
  const totalEscrowValue = escrowContracts.reduce((sum, escrow) => sum + parseFloat(escrow.amount), 0);
  const completedTransactions = recentTransactions.filter(tx => tx.status === 'confirmed').length;
  const activeEscrows = escrowContracts.filter(escrow => ['created', 'funded', 'pending_release'].includes(escrow.status)).length;

  // Copy address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'verified':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'funded':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'disputed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Subscription gate check
  if (!canUseBlockchain.allowed) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Blockchain Integration</span>
          </CardTitle>
          <CardDescription>
            Secure blockchain transactions and smart contracts for property management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Blockchain features are available with premium subscriptions. 
              Upgrade to access wallet connections, smart contracts, property tokenization, and secure escrow services.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Blockchain</span>
            </div>
            {isConnected && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Connected</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{walletBalance?.slice(0, 6)}</div>
                  <div className="text-sm text-muted-foreground">{getNetworkConfig().nativeCurrency.symbol}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{recentTransactions.length}</div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setActiveTab('wallet')}>
                <Wallet className="mr-2 h-4 w-4" />
                Open Wallet
              </Button>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Connect your wallet to access blockchain features
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Blockchain Dashboard</span>
            </div>
            {isConnected && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Connected to {getNetworkConfig().name}</span>
                </Badge>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Manage your blockchain transactions, property tokens, and smart contracts
          </CardDescription>
        </CardHeader>

        {isConnected && (
          <CardContent>
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{walletBalance?.slice(0, 8)}</div>
                    <div className="text-sm text-muted-foreground">Wallet Balance ({getNetworkConfig().nativeCurrency.symbol})</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Home className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{propertyTokens.length}</div>
                    <div className="text-sm text-muted-foreground">Property Tokens</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{activeEscrows}</div>
                    <div className="text-sm text-muted-foreground">Active Escrows</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{completedTransactions}</div>
                    <div className="text-sm text-muted-foreground">Completed Transactions</div>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.hash} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className={cn('w-2 h-2 rounded-full', 
                        tx.status === 'confirmed' ? 'bg-green-500' : 
                        tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                      <div>
                        <div className="font-medium">Transaction</div>
                        <div className="text-sm text-muted-foreground">
                          To: {formatAddress(tx.to)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{tx.value} {getNetworkConfig().nativeCurrency.symbol}</div>
                      <div className="text-sm text-muted-foreground capitalize">{tx.status}</div>
                    </div>
                  </div>
                ))}
                
                {recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Home className="h-6 w-6 mb-2" />
                  <span>Register Property</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Create Escrow</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Send Payment</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <BlockchainWallet showTransactionHistory={true} />
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          {/* Property Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Property Tokens</span>
              </CardTitle>
              <CardDescription>
                Your tokenized properties on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyTokens.map((property) => (
                  <Card key={property.tokenId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Home className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">{property.title}</h4>
                          <p className="text-sm text-muted-foreground">{property.location.address}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">Token #{property.tokenId}</Badge>
                            {property.verified && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{property.price} {property.currency}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.metadata.bedrooms} bed, {property.metadata.bathrooms} bath
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {propertyTokens.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No property tokens found</p>
                    <Button variant="outline" className="mt-4">
                      <Home className="mr-2 h-4 w-4" />
                      Register First Property
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrow">
          <PropertyEscrow />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Payment History</span>
              </CardTitle>
              <CardDescription>
                Your blockchain payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blockchainPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium capitalize">{payment.type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">{payment.description}</div>
                        {payment.propertyId && (
                          <div className="text-xs text-muted-foreground">Property: {payment.propertyId}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{payment.amount} {payment.currency}</div>
                      <Badge variant="outline" className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      {payment.transactionHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getExplorerUrl(payment.transactionHash!), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {blockchainPayments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No payment history</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
