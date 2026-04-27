// Blockchain Integration React Hook
// Hook for managing blockchain connections, transactions, and smart contracts

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthSession } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import BlockchainService from '@/services/blockchain/blockchainService';
import { toast } from 'sonner';
import {
  BlockchainNetwork,
  WalletConnection,
  WalletTransaction,
  PropertyOnChain,
  EscrowTransaction,
  BlockchainPayment,
  DocumentOnChain,
  IdentityOnChain,
  BlockchainError,
  WalletType,
  GasSpeed,
  TransactionStatus,
} from '@/types/blockchain';

interface UseBlockchainOptions {
  autoConnect?: boolean;
  preferredNetwork?: BlockchainNetwork;
  enableNotifications?: boolean;
}

export const useBlockchain = (options: UseBlockchainOptions = {}) => {
  const { user } = useAuthSession();
  const { hasFeatureAccess } = useSubscription();
  const queryClient = useQueryClient();

  const { autoConnect = false, preferredNetwork = 'polygon', enableNotifications = true } = options;

  // State management
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<BlockchainNetwork>(preferredNetwork);
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([]);

  // Blockchain service instance
  const blockchainService = BlockchainService.getInstance();

  // Check if user can use blockchain features
  const canUseBlockchain = hasFeatureAccess('blockchain_integration');

  // ============================================================================
  // WALLET CONNECTION MANAGEMENT
  // ============================================================================

  const connectWallet = useMutation({
    mutationFn: async (walletType: WalletType = 'metamask') => {
      if (!canUseBlockchain.allowed) {
        throw new Error('Blockchain features require a premium subscription');
      }

      setIsConnecting(true);
      const connection = await blockchainService.connectWallet(walletType);
      return connection;
    },
    onSuccess: (connection) => {
      setWalletConnection(connection);
      setCurrentNetwork(getNetworkFromChainId(connection.chainId));

      if (enableNotifications) {
        toast.success(`Wallet connected: ${blockchainService.formatAddress(connection.address)}`);
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['blockchain-balance'] });
      queryClient.invalidateQueries({ queryKey: ['blockchain-transactions'] });
    },
    onError: (error: BlockchainError) => {
      console.error('Wallet connection failed:', error);

      if (enableNotifications) {
        toast.error(`Failed to connect wallet: ${error.message}`);
      }
    },
    onSettled: () => {
      setIsConnecting(false);
    },
  });

  const disconnectWallet = useCallback(async () => {
    try {
      await blockchainService.disconnectWallet();
      setWalletConnection(null);
      setRecentTransactions([]);

      if (enableNotifications) {
        toast.success('Wallet disconnected');
      }

      // Clear related queries
      queryClient.removeQueries({ queryKey: ['blockchain-balance'] });
      queryClient.removeQueries({ queryKey: ['blockchain-transactions'] });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);

      if (enableNotifications) {
        toast.error('Failed to disconnect wallet');
      }
    }
  }, [blockchainService, enableNotifications, queryClient]);

  const switchNetwork = useMutation({
    mutationFn: async (network: BlockchainNetwork) => {
      await blockchainService.switchNetwork(network);
      return network;
    },
    onSuccess: (network) => {
      setCurrentNetwork(network);

      if (enableNotifications) {
        toast.success(`Switched to ${network} network`);
      }

      // Refresh wallet connection info
      const connection = blockchainService.getWalletConnection();
      if (connection) {
        setWalletConnection(connection);
      }
    },
    onError: (error: BlockchainError) => {
      console.error('Network switch failed:', error);

      if (enableNotifications) {
        toast.error(`Failed to switch network: ${error.message}`);
      }
    },
  });

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  const sendTransaction = useMutation({
    mutationFn: async (params: {
      to: string;
      value: string;
      data?: string;
      gasSpeed?: GasSpeed;
    }) => {
      if (!walletConnection?.connected) {
        throw new Error('Wallet not connected');
      }

      setIsTransacting(true);
      const transaction = await blockchainService.sendTransaction(
        params.to,
        params.value,
        params.data,
        params.gasSpeed
      );

      return transaction;
    },
    onSuccess: (transaction) => {
      setRecentTransactions((prev) => [transaction, ...prev.slice(0, 9)]);

      if (enableNotifications) {
        toast.success(`Transaction sent: ${blockchainService.formatAddress(transaction.hash)}`);
      }

      // Refresh balance
      queryClient.invalidateQueries({ queryKey: ['blockchain-balance'] });
    },
    onError: (error: BlockchainError) => {
      console.error('Transaction failed:', error);

      if (enableNotifications) {
        toast.error(`Transaction failed: ${error.message}`);
      }
    },
    onSettled: () => {
      setIsTransacting(false);
    },
  });

  // ============================================================================
  // PROPERTY REGISTRY
  // ============================================================================

  const registerProperty = useMutation({
    mutationFn: async (property: Omit<PropertyOnChain, 'tokenId' | 'createdAt' | 'updatedAt'>) => {
      if (!walletConnection?.connected) {
        throw new Error('Wallet not connected');
      }

      const tokenId = await blockchainService.registerProperty(property);
      return { tokenId, property };
    },
    onSuccess: ({ tokenId, property }) => {
      if (enableNotifications) {
        toast.success(`Property registered on blockchain: Token ID ${tokenId}`);
      }

      // Invalidate properties queries
      queryClient.invalidateQueries({ queryKey: ['blockchain-properties'] });
    },
    onError: (error: BlockchainError) => {
      console.error('Property registration failed:', error);

      if (enableNotifications) {
        toast.error(`Failed to register property: ${error.message}`);
      }
    },
  });

  const { data: userProperties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['blockchain-properties', walletConnection?.address],
    queryFn: async () => {
      if (!walletConnection?.address) return [];

      // In a real implementation, this would query the blockchain for user's properties
      // For now, returning mock data
      return [];
    },
    enabled: !!walletConnection?.address && canUseBlockchain.allowed,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ============================================================================
  // ESCROW MANAGEMENT
  // ============================================================================

  const createEscrow = useMutation({
    mutationFn: async (params: { propertyId: string; seller: string; amount: string }) => {
      if (!walletConnection?.connected) {
        throw new Error('Wallet not connected');
      }

      const escrow = await blockchainService.createEscrow(
        params.propertyId,
        params.seller,
        params.amount
      );

      return escrow;
    },
    onSuccess: (escrow) => {
      if (enableNotifications) {
        toast.success(`Escrow created: ${blockchainService.formatAddress(escrow.contractAddress)}`);
      }

      // Invalidate escrows queries
      queryClient.invalidateQueries({ queryKey: ['blockchain-escrows'] });
    },
    onError: (error: BlockchainError) => {
      console.error('Escrow creation failed:', error);

      if (enableNotifications) {
        toast.error(`Failed to create escrow: ${error.message}`);
      }
    },
  });

  const fundEscrow = useMutation({
    mutationFn: async (params: { escrowAddress: string; amount: string }) => {
      if (!walletConnection?.connected) {
        throw new Error('Wallet not connected');
      }

      const txHash = await blockchainService.fundEscrow(params.escrowAddress, params.amount);

      return txHash;
    },
    onSuccess: (txHash) => {
      if (enableNotifications) {
        toast.success(`Escrow funded: ${blockchainService.formatAddress(txHash)}`);
      }

      // Refresh balance and escrows
      queryClient.invalidateQueries({ queryKey: ['blockchain-balance'] });
      queryClient.invalidateQueries({ queryKey: ['blockchain-escrows'] });
    },
    onError: (error: BlockchainError) => {
      console.error('Escrow funding failed:', error);

      if (enableNotifications) {
        toast.error(`Failed to fund escrow: ${error.message}`);
      }
    },
  });

  // ============================================================================
  // BALANCE AND TRANSACTION QUERIES
  // ============================================================================

  const { data: walletBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['blockchain-balance', walletConnection?.address, currentNetwork],
    queryFn: async () => {
      if (!walletConnection?.address) return '0';
      return await blockchainService.getBalance(walletConnection.address);
    },
    enabled: !!walletConnection?.address,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // 10 seconds
  });

  const { data: transactionHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['blockchain-transactions', walletConnection?.address, currentNetwork],
    queryFn: async () => {
      if (!walletConnection?.address) return [];

      // In a real implementation, this would fetch transaction history from blockchain
      // For now, returning recent transactions from state
      return recentTransactions;
    },
    enabled: !!walletConnection?.address,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getNetworkFromChainId = (chainId: number): BlockchainNetwork => {
    const networks: Record<number, BlockchainNetwork> = {
      1: 'ethereum',
      137: 'polygon',
      56: 'bsc',
      42161: 'arbitrum',
      10: 'optimism',
    };

    return networks[chainId] || 'polygon';
  };

  const formatAddress = useCallback((address: string) => {
    return blockchainService.formatAddress(address);
  }, []);

  const getExplorerUrl = useCallback(
    (hash: string, type: 'tx' | 'address' = 'tx') => {
      return blockchainService.getExplorerUrl(hash, type);
    },
    [currentNetwork]
  );

  const validateAddress = useCallback((address: string): boolean => {
    try {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    } catch {
      return false;
    }
  }, []);

  const estimateGasCost = useCallback(
    async (to: string, value: string, data?: string): Promise<string> => {
      try {
        if (!walletConnection?.connected) {
          throw new Error('Wallet not connected');
        }

        // In a real implementation, this would estimate gas costs
        // For now, returning a mock estimate
        return '0.001';
      } catch (error) {
        console.error('Gas estimation failed:', error);
        return '0.001';
      }
    },
    [walletConnection]
  );

  // ============================================================================
  // SUBSCRIPTION AND FEATURE GATING
  // ============================================================================

  const checkFeatureAccess = useCallback(
    (feature: string): boolean => {
      if (!canUseBlockchain.allowed) {
        if (enableNotifications) {
          toast.error('Blockchain features require a premium subscription');
        }
        return false;
      }
      return true;
    },
    [canUseBlockchain, enableNotifications]
  );

  // ============================================================================
  // AUTO-CONNECT ON MOUNT
  // ============================================================================

  useEffect(() => {
    if (autoConnect && !walletConnection && canUseBlockchain.allowed) {
      // Check if wallet was previously connected
      const wasConnected = localStorage.getItem('blockchain_wallet_connected');
      if (wasConnected === 'true') {
        connectWallet.mutate('metamask');
      }
    }
  }, [autoConnect, walletConnection, canUseBlockchain]);

  // Save connection state to localStorage
  useEffect(() => {
    if (walletConnection?.connected) {
      localStorage.setItem('blockchain_wallet_connected', 'true');
    } else {
      localStorage.removeItem('blockchain_wallet_connected');
    }
  }, [walletConnection?.connected]);

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // Connection state
    walletConnection,
    currentNetwork,
    isConnected: walletConnection?.connected || false,
    canUseBlockchain,

    // Loading states
    isConnecting,
    isTransacting,
    balanceLoading,
    historyLoading,
    propertiesLoading,

    // Data
    walletBalance,
    transactionHistory,
    userProperties,
    recentTransactions,

    // Wallet actions
    connectWallet: connectWallet.mutate,
    disconnectWallet,
    switchNetwork: switchNetwork.mutate,

    // Transaction actions
    sendTransaction: sendTransaction.mutate,
    estimateGasCost,

    // Property actions
    registerProperty: registerProperty.mutate,

    // Escrow actions
    createEscrow: createEscrow.mutate,
    fundEscrow: fundEscrow.mutate,

    // Utility functions
    formatAddress,
    getExplorerUrl,
    validateAddress,
    checkFeatureAccess,

    // Network info
    getNetworkConfig: () => blockchainService.getNetworkConfig(currentNetwork),

    // Mutation states
    connectWalletLoading: connectWallet.isPending,
    switchNetworkLoading: switchNetwork.isPending,
    sendTransactionLoading: sendTransaction.isPending,
    registerPropertyLoading: registerProperty.isPending,
    createEscrowLoading: createEscrow.isPending,
    fundEscrowLoading: fundEscrow.isPending,

    // Error states
    connectWalletError: connectWallet.error,
    switchNetworkError: switchNetwork.error,
    sendTransactionError: sendTransaction.error,
    registerPropertyError: registerProperty.error,
    createEscrowError: createEscrow.error,
    fundEscrowError: fundEscrow.error,
  };
};
