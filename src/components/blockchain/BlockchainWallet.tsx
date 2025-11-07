// Blockchain Wallet Component
// UI component for wallet connection, network switching, and transaction management

import React, { useState } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Network, 
  Send, 
  History, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  Coins,
  TrendingUp,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BlockchainNetwork, WalletType, GasSpeed } from '@/types/blockchain';

interface BlockchainWalletProps {
  className?: string;
  compact?: boolean;
  showTransactionHistory?: boolean;
}

const networkIcons: Record<BlockchainNetwork, React.ComponentType<any>> = {
  ethereum: Coins,
  polygon: Shield,
  bsc: Zap,
  arbitrum: TrendingUp,
  optimism: Network
};

const networkColors: Record<BlockchainNetwork, string> = {
  ethereum: 'bg-blue-500',
  polygon: 'bg-purple-500',
  bsc: 'bg-yellow-500',
  arbitrum: 'bg-blue-400',
  optimism: 'bg-red-500'
};

const walletTypes: { value: WalletType; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'metamask', label: 'MetaMask', icon: Wallet },
  { value: 'walletconnect', label: 'WalletConnect', icon: Network },
  { value: 'coinbase', label: 'Coinbase Wallet', icon: Coins },
  { value: 'trustwallet', label: 'Trust Wallet', icon: Shield }
];

const networks: { value: BlockchainNetwork; label: string; testnet?: boolean }[] = [
  { value: 'polygon', label: 'Polygon (MATIC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'bsc', label: 'BNB Smart Chain' },
  { value: 'arbitrum', label: 'Arbitrum One' },
  { value: 'optimism', label: 'Optimism' }
];

export const BlockchainWallet: React.FC<BlockchainWalletProps> = ({
  className,
  compact = false,
  showTransactionHistory = true
}) => {
  const {
    walletConnection,
    currentNetwork,
    isConnected,
    canUseBlockchain,
    isConnecting,
    isTransacting,
    walletBalance,
    transactionHistory,
    recentTransactions,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    formatAddress,
    getExplorerUrl,
    validateAddress,
    estimateGasCost,
    getNetworkConfig
  } = useBlockchain();

  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>('metamask');
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [gasSpeed, setGasSpeed] = useState<GasSpeed>('standard');
  const [estimatedGas, setEstimatedGas] = useState<string>('');

  // Handle wallet connection
  const handleConnectWallet = () => {
    if (!canUseBlockchain.allowed) {
      toast.error('Blockchain features require a premium subscription');
      return;
    }
    connectWallet(selectedWalletType);
  };

  // Handle network switch
  const handleSwitchNetwork = (network: BlockchainNetwork) => {
    switchNetwork(network);
  };

  // Handle send transaction
  const handleSendTransaction = async () => {
    if (!validateAddress(sendToAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast.error('Invalid amount');
      return;
    }

    try {
      await sendTransaction({
        to: sendToAddress,
        value: sendAmount,
        gasSpeed
      });
      
      // Reset form
      setSendToAddress('');
      setSendAmount('');
      setEstimatedGas('');
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  // Estimate gas cost when form changes
  React.useEffect(() => {
    if (sendToAddress && sendAmount && validateAddress(sendToAddress)) {
      estimateGasCost(sendToAddress, sendAmount).then(setEstimatedGas);
    }
  }, [sendToAddress, sendAmount, estimateGasCost]);

  // Copy address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  // Get status icon for transaction
  const getTransactionStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Subscription gate check
  if (!canUseBlockchain.allowed) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Blockchain Integration</span>
          </CardTitle>
          <CardDescription>
            Secure blockchain transactions and smart contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Blockchain features are available with premium subscriptions. 
              Upgrade to access wallet connections, smart contracts, and secure transactions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Blockchain Wallet</span>
          </div>
          {isConnected && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <div className={cn('w-2 h-2 rounded-full', networkColors[currentNetwork])} />
              <span>{getNetworkConfig().name}</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your wallet for secure blockchain transactions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isConnected ? (
          // Wallet Connection Section
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-type">Select Wallet</Label>
              <Select 
                value={selectedWalletType} 
                onValueChange={(value: WalletType) => setSelectedWalletType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose wallet type" />
                </SelectTrigger>
                <SelectContent>
                  {walletTypes.map((wallet) => {
                    const Icon = wallet.icon;
                    return (
                      <SelectItem key={wallet.value} value={wallet.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{wallet.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your wallet connection is secure and encrypted. We never store your private keys.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Connected Wallet Interface
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="send">Send</TabsTrigger>
              {showTransactionHistory && (
                <TabsTrigger value="history">History</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Wallet Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Address</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {formatAddress(walletConnection.address)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyAddress(walletConnection.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getExplorerUrl(walletConnection.address, 'address'), '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Balance</span>
                  <span className="text-lg font-bold">
                    {walletBalance} {getNetworkConfig().nativeCurrency.symbol}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network</span>
                  <Select 
                    value={currentNetwork} 
                    onValueChange={handleSwitchNetwork}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((network) => {
                        const Icon = networkIcons[network.value];
                        return (
                          <SelectItem key={network.value} value={network.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{network.label}</span>
                              {network.testnet && (
                                <Badge variant="secondary" className="text-xs">
                                  Testnet
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Recent Transactions</h4>
                  <div className="space-y-2">
                    {recentTransactions.slice(0, 3).map((tx) => (
                      <div key={tx.hash} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-2">
                          {getTransactionStatusIcon(tx.status)}
                          <code className="text-xs">{formatAddress(tx.hash)}</code>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{tx.value} {getNetworkConfig().nativeCurrency.symbol}</div>
                          <div className="text-xs text-muted-foreground">To: {formatAddress(tx.to)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={disconnectWallet}
                className="w-full"
              >
                <Unlock className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </Button>
            </TabsContent>

            <TabsContent value="send" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="0x..."
                    value={sendToAddress}
                    onChange={(e) => setSendToAddress(e.target.value)}
                    className={cn(
                      sendToAddress && !validateAddress(sendToAddress) && 'border-red-500'
                    )}
                  />
                  {sendToAddress && !validateAddress(sendToAddress) && (
                    <p className="text-sm text-red-500">Invalid address format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({getNetworkConfig().nativeCurrency.symbol})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.000001"
                    placeholder="0.0"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gas-speed">Gas Speed</Label>
                  <Select value={gasSpeed} onValueChange={(value: GasSpeed) => setGasSpeed(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Slow (Lower fee)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>Standard</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fast">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>Fast (Higher fee)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {estimatedGas && (
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Estimated gas fee: {estimatedGas} {getNetworkConfig().nativeCurrency.symbol}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleSendTransaction}
                  disabled={isTransacting || !sendToAddress || !sendAmount || !validateAddress(sendToAddress)}
                  className="w-full"
                >
                  {isTransacting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Transaction
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {showTransactionHistory && (
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Transaction History</h4>
                  
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentTransactions.map((tx) => (
                        <Card key={tx.hash} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getTransactionStatusIcon(tx.status)}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm">{formatAddress(tx.hash)}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  To: {formatAddress(tx.to)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{tx.value} {getNetworkConfig().nativeCurrency.symbol}</div>
                              <div className="text-xs text-muted-foreground capitalize">{tx.status}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
