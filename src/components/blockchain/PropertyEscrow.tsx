// Property Escrow Component
// UI component for creating and managing blockchain-based property escrow transactions

import React, { useState } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home,
  DollarSign,
  FileText,
  Users,
  Calendar,
  ExternalLink,
  Copy,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EscrowTransaction, EscrowCondition, EscrowMilestone } from '@/types/blockchain';

interface PropertyEscrowProps {
  propertyId?: string;
  propertyTitle?: string;
  className?: string;
  onEscrowCreated?: (escrow: EscrowTransaction) => void;
}

interface EscrowFormData {
  propertyId: string;
  propertyTitle: string;
  sellerAddress: string;
  escrowAmount: string;
  conditions: EscrowCondition[];
  milestones: EscrowMilestone[];
  expiryDays: number;
}

const defaultConditions: Omit<
  EscrowCondition,
  'id' | 'completed' | 'completedBy' | 'completedAt'
>[] = [
  {
    description: 'Property inspection completed and approved',
    type: 'inspection',
    required: true,
  },
  {
    description: 'Financing approval obtained',
    type: 'financing',
    required: true,
  },
  {
    description: 'Legal documentation verified',
    type: 'legal',
    required: true,
  },
  {
    description: 'Title search completed',
    type: 'legal',
    required: true,
  },
];

const defaultMilestones: Omit<
  EscrowMilestone,
  'id' | 'completed' | 'completedAt' | 'transactionHash'
>[] = [
  {
    title: 'Initial Deposit',
    description: 'Release 10% upon contract signing',
    percentage: 10,
    conditions: [],
  },
  {
    title: 'Inspection Complete',
    description: 'Release 40% after successful inspection',
    percentage: 40,
    conditions: ['inspection'],
  },
  {
    title: 'Final Payment',
    description: 'Release remaining 50% upon completion',
    percentage: 50,
    conditions: ['financing', 'legal'],
  },
];

export const PropertyEscrow: React.FC<PropertyEscrowProps> = ({
  propertyId = '',
  propertyTitle = '',
  className,
  onEscrowCreated,
}) => {
  const {
    walletConnection,
    isConnected,
    canUseBlockchain,
    createEscrow,
    fundEscrow,
    formatAddress,
    validateAddress,
    getExplorerUrl,
    createEscrowLoading,
    fundEscrowLoading,
  } = useBlockchain();

  const [formData, setFormData] = useState<EscrowFormData>({
    propertyId: propertyId,
    propertyTitle: propertyTitle,
    sellerAddress: '',
    escrowAmount: '',
    conditions: defaultConditions.map((condition, index) => ({
      id: `condition_${index}`,
      ...condition,
      completed: false,
    })),
    milestones: defaultMilestones.map((milestone, index) => ({
      id: `milestone_${index}`,
      ...milestone,
      completed: false,
    })),
    expiryDays: 30,
  });

  const [activeEscrows, setActiveEscrows] = useState<EscrowTransaction[]>([]);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null);

  // Handle form input changes
  const handleInputChange = (field: keyof EscrowFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add custom condition
  const addCustomCondition = () => {
    const newCondition: EscrowCondition = {
      id: `condition_${Date.now()}`,
      description: '',
      type: 'custom',
      required: false,
      completed: false,
    };

    setFormData((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCondition],
    }));
  };

  // Update condition
  const updateCondition = (id: string, updates: Partial<EscrowCondition>) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...updates } : condition
      ),
    }));
  };

  // Remove condition
  const removeCondition = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((condition) => condition.id !== id),
    }));
  };

  // Calculate total escrow percentage
  const totalPercentage = formData.milestones.reduce(
    (sum, milestone) => sum + milestone.percentage,
    0
  );

  // Validate form
  const isFormValid = () => {
    return (
      formData.propertyId &&
      formData.sellerAddress &&
      validateAddress(formData.sellerAddress) &&
      formData.escrowAmount &&
      parseFloat(formData.escrowAmount) > 0 &&
      totalPercentage === 100 &&
      formData.conditions.every((condition) => condition.description.trim())
    );
  };

  // Handle escrow creation
  const handleCreateEscrow = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    try {
      const escrow = await createEscrow({
        propertyId: formData.propertyId,
        seller: formData.sellerAddress,
        amount: formData.escrowAmount,
      });

      // Add conditions and milestones to the escrow
      const fullEscrow: EscrowTransaction = {
        ...escrow,
        conditions: formData.conditions,
        milestones: formData.milestones,
        expiresAt: new Date(Date.now() + formData.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
      };

      setActiveEscrows((prev) => [...prev, fullEscrow]);

      if (onEscrowCreated) {
        onEscrowCreated(fullEscrow);
      }

      toast.success('Escrow contract created successfully!');

      // Reset form
      setFormData((prev) => ({
        ...prev,
        sellerAddress: '',
        escrowAmount: '',
      }));
    } catch (error) {
      console.error('Failed to create escrow:', error);
    }
  };

  // Handle escrow funding
  const handleFundEscrow = async (escrow: EscrowTransaction) => {
    try {
      await fundEscrow({
        escrowAddress: escrow.contractAddress,
        amount: escrow.amount,
      });

      // Update escrow status
      setActiveEscrows((prev) =>
        prev.map((e) => (e.id === escrow.id ? { ...e, status: 'funded' } : e))
      );

      toast.success('Escrow funded successfully!');
    } catch (error) {
      console.error('Failed to fund escrow:', error);
    }
  };

  // Copy address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-blue-500';
      case 'funded':
        return 'bg-green-500';
      case 'pending_release':
        return 'bg-yellow-500';
      case 'released':
        return 'bg-emerald-500';
      case 'refunded':
        return 'bg-orange-500';
      case 'disputed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <Clock className="h-4 w-4" />;
      case 'funded':
        return <Lock className="h-4 w-4" />;
      case 'pending_release':
        return <AlertTriangle className="h-4 w-4" />;
      case 'released':
        return <CheckCircle className="h-4 w-4" />;
      case 'refunded':
        return <XCircle className="h-4 w-4" />;
      case 'disputed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Subscription gate check
  if (!canUseBlockchain.allowed) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Property Escrow</span>
          </CardTitle>
          <CardDescription>
            Secure blockchain-based escrow for property transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Blockchain escrow features are available with premium subscriptions. Upgrade to access
              secure smart contract escrow services.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Property Escrow</span>
          </CardTitle>
          <CardDescription>
            Secure blockchain-based escrow for property transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to create and manage property escrow contracts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Create New Escrow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Create Property Escrow</span>
          </CardTitle>
          <CardDescription>
            Set up a secure smart contract escrow for property transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Information */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="property-id">Property ID</Label>
              <Input
                id="property-id"
                placeholder="Enter property ID"
                value={formData.propertyId}
                onChange={(e) => handleInputChange('propertyId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-title">Property Title</Label>
              <Input
                id="property-title"
                placeholder="Enter property title"
                value={formData.propertyTitle}
                onChange={(e) => handleInputChange('propertyTitle', e.target.value)}
              />
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seller-address">Seller Wallet Address</Label>
              <Input
                id="seller-address"
                placeholder="0x..."
                value={formData.sellerAddress}
                onChange={(e) => handleInputChange('sellerAddress', e.target.value)}
                className={cn(
                  formData.sellerAddress &&
                    !validateAddress(formData.sellerAddress) &&
                    'border-red-500'
                )}
              />
              {formData.sellerAddress && !validateAddress(formData.sellerAddress) && (
                <p className="text-sm text-red-500">Invalid address format</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="escrow-amount">Escrow Amount (ETH)</Label>
              <Input
                id="escrow-amount"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={formData.escrowAmount}
                onChange={(e) => handleInputChange('escrowAmount', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Escrow Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Escrow Conditions</h4>
              <Button variant="outline" size="sm" onClick={addCustomCondition}>
                Add Custom Condition
              </Button>
            </div>

            <div className="space-y-3">
              {formData.conditions.map((condition) => (
                <div key={condition.id} className="flex items-center space-x-3 rounded border p-3">
                  <Checkbox
                    checked={condition.required}
                    onCheckedChange={(checked) =>
                      updateCondition(condition.id, { required: checked as boolean })
                    }
                  />
                  <div className="flex-1">
                    {condition.type === 'custom' ? (
                      <Input
                        placeholder="Enter custom condition"
                        value={condition.description}
                        onChange={(e) =>
                          updateCondition(condition.id, { description: e.target.value })
                        }
                      />
                    ) : (
                      <span className="text-sm">{condition.description}</span>
                    )}
                  </div>
                  <Badge variant={condition.required ? 'default' : 'secondary'}>
                    {condition.required ? 'Required' : 'Optional'}
                  </Badge>
                  {condition.type === 'custom' && (
                    <Button variant="ghost" size="sm" onClick={() => removeCondition(condition.id)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Release Milestones */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Release Milestones</h4>

            <div className="space-y-3">
              {formData.milestones.map((milestone, index) => (
                <div key={milestone.id} className="space-y-2 rounded border p-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">{milestone.title}</h5>
                    <Badge variant="outline">{milestone.percentage}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  {milestone.conditions.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Requires: {milestone.conditions.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded bg-muted p-3">
              <span className="font-medium">Total Release Percentage</span>
              <Badge variant={totalPercentage === 100 ? 'default' : 'destructive'}>
                {totalPercentage}%
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleCreateEscrow}
            disabled={!isFormValid() || createEscrowLoading}
            className="w-full"
          >
            {createEscrowLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Creating Escrow...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Create Escrow Contract
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Escrows */}
      {activeEscrows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Active Escrows</span>
            </CardTitle>
            <CardDescription>Manage your active property escrow contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeEscrows.map((escrow) => (
                <Card key={escrow.id} className="p-4">
                  <div className="space-y-4">
                    {/* Escrow Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn('h-3 w-3 rounded-full', getStatusColor(escrow.status))}
                        />
                        <div>
                          <h4 className="font-medium">Property: {escrow.propertyId}</h4>
                          <p className="text-sm text-muted-foreground">
                            Contract: {formatAddress(escrow.contractAddress)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {escrow.amount} {escrow.currency}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {getStatusIcon(escrow.status)}
                          <span className="ml-1">{escrow.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Escrow Details */}
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                      <div>
                        <span className="font-medium">Buyer:</span>
                        <div className="flex items-center space-x-1">
                          <code>{formatAddress(escrow.buyer)}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyAddress(escrow.buyer)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Seller:</span>
                        <div className="flex items-center space-x-1">
                          <code>{formatAddress(escrow.seller)}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyAddress(escrow.seller)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <div>{new Date(escrow.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Conditions Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Conditions Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {escrow.conditions.filter((c) => c.completed).length} /{' '}
                          {escrow.conditions.length}
                        </span>
                      </div>
                      <Progress
                        value={
                          (escrow.conditions.filter((c) => c.completed).length /
                            escrow.conditions.length) *
                          100
                        }
                        className="h-2"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {escrow.status === 'created' && (
                        <Button
                          onClick={() => handleFundEscrow(escrow)}
                          disabled={fundEscrowLoading}
                          size="sm"
                        >
                          {fundEscrowLoading ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Funding...
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Fund Escrow
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(getExplorerUrl(escrow.contractAddress, 'address'), '_blank')
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Contract
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
