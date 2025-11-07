// Blockchain Service
// Core service for blockchain integration, wallet management, and smart contracts

import { ethers } from 'ethers';
import {
  BlockchainNetwork,
  NetworkConfig,
  BlockchainProvider,
  WalletConnection,
  WalletTransaction,
  PropertyOnChain,
  EscrowTransaction,
  BlockchainPayment,
  DocumentOnChain,
  IdentityOnChain,
  BlockchainServiceConfig,
  BlockchainError,
  TransactionStatus,
  GasSpeed,
  WalletType
} from '@/types/blockchain';

class BlockchainService {
  private static instance: BlockchainService;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private currentNetwork: BlockchainNetwork = 'polygon';
  private walletConnection: WalletConnection | null = null;
  private config: BlockchainServiceConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeProvider();
  }

  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  private getDefaultConfig(): BlockchainServiceConfig {
    return {
      networks: {
        ethereum: {
          name: 'Ethereum Mainnet',
          chainId: 1,
          rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
          explorerUrl: 'https://etherscan.io',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          }
        },
        polygon: {
          name: 'Polygon Mainnet',
          chainId: 137,
          rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com',
          explorerUrl: 'https://polygonscan.com',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          }
        },
        bsc: {
          name: 'BNB Smart Chain',
          chainId: 56,
          rpcUrl: import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
          explorerUrl: 'https://bscscan.com',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          }
        },
        arbitrum: {
          name: 'Arbitrum One',
          chainId: 42161,
          rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
          explorerUrl: 'https://arbiscan.io',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          }
        },
        optimism: {
          name: 'Optimism',
          chainId: 10,
          rpcUrl: import.meta.env.VITE_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
          explorerUrl: 'https://optimistic.etherscan.io',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          }
        }
      },
      contracts: {
        propertyRegistry: {
          ethereum: import.meta.env.VITE_PROPERTY_REGISTRY_ETH || '',
          polygon: import.meta.env.VITE_PROPERTY_REGISTRY_POLYGON || '',
          bsc: import.meta.env.VITE_PROPERTY_REGISTRY_BSC || '',
          arbitrum: import.meta.env.VITE_PROPERTY_REGISTRY_ARB || '',
          optimism: import.meta.env.VITE_PROPERTY_REGISTRY_OP || ''
        },
        escrow: {
          ethereum: import.meta.env.VITE_ESCROW_ETH || '',
          polygon: import.meta.env.VITE_ESCROW_POLYGON || '',
          bsc: import.meta.env.VITE_ESCROW_BSC || '',
          arbitrum: import.meta.env.VITE_ESCROW_ARB || '',
          optimism: import.meta.env.VITE_ESCROW_OP || ''
        },
        payment: {
          ethereum: import.meta.env.VITE_PAYMENT_ETH || '',
          polygon: import.meta.env.VITE_PAYMENT_POLYGON || '',
          bsc: import.meta.env.VITE_PAYMENT_BSC || '',
          arbitrum: import.meta.env.VITE_PAYMENT_ARB || '',
          optimism: import.meta.env.VITE_PAYMENT_OP || ''
        },
        identity: {
          ethereum: import.meta.env.VITE_IDENTITY_ETH || '',
          polygon: import.meta.env.VITE_IDENTITY_POLYGON || '',
          bsc: import.meta.env.VITE_IDENTITY_BSC || '',
          arbitrum: import.meta.env.VITE_IDENTITY_ARB || '',
          optimism: import.meta.env.VITE_IDENTITY_OP || ''
        }
      },
      ipfs: {
        gateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
        apiKey: import.meta.env.VITE_IPFS_API_KEY
      },
      defaultNetwork: 'polygon',
      gasSettings: {
        slow: '20',
        standard: '30',
        fast: '50'
      }
    };
  }

  private async initializeProvider(): Promise<void> {
    try {
      const networkConfig = this.config.networks[this.currentNetwork];
      this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      
      // Test connection
      await this.provider.getNetwork();
      console.log(`Connected to ${networkConfig.name}`);
    } catch (error) {
      console.error('Failed to initialize blockchain provider:', error);
      throw new BlockchainError({
        code: 'PROVIDER_INIT_FAILED',
        message: 'Failed to initialize blockchain provider',
        details: error,
        network: this.currentNetwork,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // WALLET MANAGEMENT
  // ============================================================================

  public async connectWallet(walletType: WalletType = 'metamask'): Promise<WalletConnection> {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Get balance
      const balance = await this.provider.getBalance(accounts[0]);
      const balanceInEth = ethers.formatEther(balance);

      this.walletConnection = {
        type: walletType,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        connected: true,
        balance: balanceInEth
      };

      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      return this.walletConnection;
    } catch (error) {
      throw new BlockchainError({
        code: 'WALLET_CONNECTION_FAILED',
        message: 'Failed to connect wallet',
        details: error,
        timestamp: new Date().toISOString()
      });
    }
  }

  public async disconnectWallet(): Promise<void> {
    this.walletConnection = null;
    this.signer = null;
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else if (this.walletConnection) {
      this.walletConnection.address = accounts[0];
      // Refresh balance
      this.updateWalletBalance();
    }
  }

  private handleChainChanged(chainId: string): void {
    if (this.walletConnection) {
      this.walletConnection.chainId = parseInt(chainId, 16);
    }
    // Reinitialize provider for new chain
    this.initializeProvider();
  }

  private async updateWalletBalance(): Promise<void> {
    if (this.walletConnection && this.provider) {
      try {
        const balance = await this.provider.getBalance(this.walletConnection.address);
        this.walletConnection.balance = ethers.formatEther(balance);
      } catch (error) {
        console.error('Failed to update wallet balance:', error);
      }
    }
  }

  public async switchNetwork(network: BlockchainNetwork): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }

    const networkConfig = this.config.networks[network];
    const chainIdHex = `0x${networkConfig.chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      
      this.currentNetwork = network;
      await this.initializeProvider();
    } catch (error: any) {
      // Chain not added to wallet
      if (error.code === 4902) {
        await this.addNetwork(network);
      } else {
        throw error;
      }
    }
  }

  private async addNetwork(network: BlockchainNetwork): Promise<void> {
    const networkConfig = this.config.networks[network];
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${networkConfig.chainId.toString(16)}`,
        chainName: networkConfig.name,
        nativeCurrency: networkConfig.nativeCurrency,
        rpcUrls: [networkConfig.rpcUrl],
        blockExplorerUrls: [networkConfig.explorerUrl]
      }]
    });

    this.currentNetwork = network;
    await this.initializeProvider();
  }

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  public async sendTransaction(
    to: string,
    value: string,
    data?: string,
    gasSpeed: GasSpeed = 'standard'
  ): Promise<WalletTransaction> {
    if (!this.signer) {
      throw new BlockchainError('Wallet not connected', 'WALLET_NOT_CONNECTED');
    }

    try {
      const gasPrice = await this.getGasPrice(gasSpeed);
      const nonce = await this.signer.getNonce();

      const transaction = {
        to,
        value: ethers.parseEther(value),
        gasPrice,
        nonce,
        data: data || '0x'
      };

      // Estimate gas
      const gasLimit = await this.provider!.estimateGas(transaction);
      const fullTransaction = {
        ...transaction,
        gasLimit
      };

      const tx = await this.signer.sendTransaction(fullTransaction);

      const walletTransaction: WalletTransaction = {
        hash: tx.hash,
        from: await this.signer.getAddress(),
        to,
        value,
        gasPrice: gasPrice.toString(),
        gasLimit: gasLimit.toString(),
        nonce,
        data,
        status: 'pending'
      };

      // Wait for confirmation
      this.waitForTransaction(tx.hash).then((receipt) => {
        walletTransaction.status = receipt.status === 1 ? 'confirmed' : 'failed';
        walletTransaction.blockNumber = receipt.blockNumber;
        walletTransaction.timestamp = new Date().toISOString();
      });

      return walletTransaction;
    } catch (error) {
      throw new BlockchainError('Transaction failed', 'TRANSACTION_FAILED', error);
    }
  }

  public async waitForTransaction(hash: string): Promise<ethers.TransactionReceipt> {
    if (!this.provider) {
      throw new BlockchainError('Provider not initialized', 'PROVIDER_NOT_INITIALIZED');
    }

    try {
      const receipt = await this.provider.waitForTransaction(hash);
      if (!receipt) {
        throw new BlockchainError('Transaction receipt not found', 'TRANSACTION_RECEIPT_NOT_FOUND');
      }
      return receipt;
    } catch (error) {
      throw new BlockchainError('Transaction wait failed', 'TRANSACTION_WAIT_FAILED', error);
    }
  }

  private async getGasPrice(speed: GasSpeed): Promise<bigint> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const feeData = await this.provider.getFeeData();
    const baseGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    
    const multipliers = {
      slow: 0.8,
      standard: 1.0,
      fast: 1.5
    };

    return baseGasPrice * BigInt(Math.floor(multipliers[speed] * 100)) / BigInt(100);
  }

  // ============================================================================
  // SMART CONTRACT INTERACTIONS
  // ============================================================================

  public async getContract(contractType: string, network?: BlockchainNetwork): Promise<ethers.Contract> {
    const targetNetwork = network || this.currentNetwork;
    const contractAddress = this.getContractAddress(contractType, targetNetwork);
    
    if (!contractAddress) {
      throw new Error(`Contract ${contractType} not deployed on ${targetNetwork}`);
    }

    const abi = await this.getContractABI(contractType);
    const provider = this.signer || this.provider;
    
    if (!provider) {
      throw new Error('No provider available');
    }

    return new ethers.Contract(contractAddress, abi, provider);
  }

  private getContractAddress(contractType: string, network: BlockchainNetwork): string {
    const contracts = this.config.contracts as any;
    return contracts[contractType]?.[network] || '';
  }

  private async getContractABI(contractType: string): Promise<any[]> {
    // In a real implementation, these would be loaded from contract artifacts
    // For now, returning basic ABIs for demonstration
    const abis: Record<string, any[]> = {
      propertyRegistry: [
        'function registerProperty(string memory propertyId, string memory metadataURI) external returns (uint256)',
        'function transferProperty(uint256 tokenId, address to) external',
        'function getProperty(uint256 tokenId) external view returns (tuple(string propertyId, address owner, string metadataURI, bool verified))',
        'event PropertyRegistered(uint256 indexed tokenId, string propertyId, address indexed owner)',
        'event PropertyTransferred(uint256 indexed tokenId, address indexed from, address indexed to)'
      ],
      escrow: [
        'function createEscrow(string memory propertyId, address seller, uint256 amount) external returns (address)',
        'function fundEscrow(address escrowAddress) external payable',
        'function releaseEscrow(address escrowAddress) external',
        'function refundEscrow(address escrowAddress) external',
        'event EscrowCreated(address indexed escrowAddress, string propertyId, address indexed buyer, address indexed seller)',
        'event EscrowFunded(address indexed escrowAddress, uint256 amount)',
        'event EscrowReleased(address indexed escrowAddress, address indexed to)',
        'event EscrowRefunded(address indexed escrowAddress, address indexed to)'
      ],
      payment: [
        'function sendPayment(address to, string memory propertyId, string memory paymentType) external payable',
        'function setupRecurringPayment(address to, uint256 amount, uint256 interval) external',
        'function executeRecurringPayment(uint256 paymentId) external',
        'event PaymentSent(address indexed from, address indexed to, uint256 amount, string propertyId)',
        'event RecurringPaymentSetup(uint256 indexed paymentId, address indexed payer, address indexed payee)'
      ],
      identity: [
        'function registerIdentity(string memory did, bytes32 credentialHash) external',
        'function addCredential(string memory credentialType, bytes32 credentialHash) external',
        'function verifyCredential(address user, string memory credentialType) external view returns (bool)',
        'event IdentityRegistered(address indexed user, string did)',
        'event CredentialAdded(address indexed user, string credentialType, bytes32 credentialHash)'
      ]
    };

    return abis[contractType] || [];
  }

  // ============================================================================
  // PROPERTY REGISTRY
  // ============================================================================

  public async registerProperty(property: Omit<PropertyOnChain, 'tokenId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const contract = await this.getContract('propertyRegistry');
      const metadataURI = await this.uploadToIPFS(property);
      
      const tx = await contract.registerProperty(property.propertyId, metadataURI);
      const receipt = await this.waitForTransaction(tx.hash);
      
      // Extract token ID from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'PropertyRegistered';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        return parsed?.args.tokenId.toString() || '';
      }

      throw new Error('Failed to get token ID from transaction');
    } catch (error) {
      throw new BlockchainError({
        code: 'PROPERTY_REGISTRATION_FAILED',
        message: 'Failed to register property on blockchain',
        details: error,
        network: this.currentNetwork,
        timestamp: new Date().toISOString()
      });
    }
  }

  public async getProperty(tokenId: string): Promise<PropertyOnChain> {
    try {
      const contract = await this.getContract('propertyRegistry');
      const propertyData = await contract.getProperty(tokenId);
      
      // Fetch metadata from IPFS
      const metadata = await this.fetchFromIPFS(propertyData.metadataURI);
      
      return {
        tokenId,
        ...metadata,
        owner: propertyData.owner,
        verified: propertyData.verified
      };
    } catch (error) {
      throw new BlockchainError({
        code: 'PROPERTY_FETCH_FAILED',
        message: 'Failed to fetch property from blockchain',
        details: error,
        network: this.currentNetwork,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // ESCROW MANAGEMENT
  // ============================================================================

  public async createEscrow(
    propertyId: string,
    seller: string,
    amount: string
  ): Promise<EscrowTransaction> {
    try {
      const contract = await this.getContract('escrow');
      const amountWei = ethers.parseEther(amount);
      
      const tx = await contract.createEscrow(propertyId, seller, amountWei);
      const receipt = await this.waitForTransaction(tx.hash);
      
      // Extract escrow address from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('Failed to get escrow address from transaction');
      }

      const parsed = contract.interface.parseLog(event);
      const escrowAddress = parsed?.args.escrowAddress;

      const escrowTransaction: EscrowTransaction = {
        id: `escrow_${Date.now()}`,
        propertyId,
        contractAddress: escrowAddress,
        buyer: await this.signer!.getAddress(),
        seller,
        amount,
        currency: this.config.networks[this.currentNetwork].nativeCurrency.symbol,
        status: 'created',
        conditions: [],
        milestones: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return escrowTransaction;
    } catch (error) {
      throw new BlockchainError({
        code: 'ESCROW_CREATION_FAILED',
        message: 'Failed to create escrow contract',
        details: error,
        network: this.currentNetwork,
        timestamp: new Date().toISOString()
      });
    }
  }

  public async fundEscrow(escrowAddress: string, amount: string): Promise<string> {
    try {
      const contract = await this.getContract('escrow');
      const tx = await contract.fundEscrow(escrowAddress, {
        value: ethers.parseEther(amount)
      });
      
      await this.waitForTransaction(tx.hash);
      return tx.hash;
    } catch (error) {
      throw new BlockchainError({
        code: 'ESCROW_FUNDING_FAILED',
        message: 'Failed to fund escrow contract',
        details: error,
        network: this.currentNetwork,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // IPFS INTEGRATION
  // ============================================================================

  private async uploadToIPFS(data: any): Promise<string> {
    try {
      // In a real implementation, this would upload to IPFS
      // For now, returning a mock IPFS hash
      const jsonData = JSON.stringify(data);
      const hash = `Qm${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      // Store in localStorage for demo purposes
      localStorage.setItem(`ipfs_${hash}`, jsonData);
      
      return `ipfs://${hash}`;
    } catch (error) {
      throw new Error('Failed to upload to IPFS');
    }
  }

  private async fetchFromIPFS(uri: string): Promise<any> {
    try {
      const hash = uri.replace('ipfs://', '');
      
      // Fetch from localStorage for demo purposes
      const data = localStorage.getItem(`ipfs_${hash}`);
      if (data) {
        return JSON.parse(data);
      }
      
      // In a real implementation, this would fetch from IPFS gateway
      throw new Error('Data not found in IPFS');
    } catch (error) {
      throw new Error('Failed to fetch from IPFS');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  public getWalletConnection(): WalletConnection | null {
    return this.walletConnection;
  }

  public getCurrentNetwork(): BlockchainNetwork {
    return this.currentNetwork;
  }

  public getNetworkConfig(network?: BlockchainNetwork): NetworkConfig {
    return this.config.networks[network || this.currentNetwork];
  }

  public isConnected(): boolean {
    return this.walletConnection?.connected || false;
  }

  public async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const targetAddress = address || this.walletConnection?.address;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  public formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  public getExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
    const explorerUrl = this.config.networks[this.currentNetwork].explorerUrl;
    return `${explorerUrl}/${type}/${hash}`;
  }
}

export default BlockchainService;
