// Blockchain Integration Types
// Types for secure blockchain transactions, smart contracts, and property registry

// ============================================================================
// BLOCKCHAIN NETWORK TYPES
// ============================================================================

export type BlockchainNetwork = 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'optimism';

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet?: boolean;
}

export interface BlockchainProvider {
  network: BlockchainNetwork;
  provider: any; // ethers.Provider
  signer?: any; // ethers.Signer
  connected: boolean;
  account?: string;
}

// ============================================================================
// WALLET INTEGRATION TYPES
// ============================================================================

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trustwallet';

export interface WalletConnection {
  type: WalletType;
  address: string;
  chainId: number;
  connected: boolean;
  balance?: string;
}

export interface WalletTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp?: string;
}

// ============================================================================
// SMART CONTRACT TYPES
// ============================================================================

export interface SmartContract {
  address: string;
  abi: any[];
  network: BlockchainNetwork;
  name: string;
  version: string;
}

export interface PropertyEscrowContract extends SmartContract {
  propertyId: string;
  buyer: string;
  seller: string;
  escrowAmount: string;
  releaseConditions: string[];
  status: 'created' | 'funded' | 'released' | 'refunded' | 'disputed';
}

export interface PropertyRegistryContract extends SmartContract {
  properties: PropertyOnChain[];
  totalProperties: number;
}

// ============================================================================
// PROPERTY ON-CHAIN TYPES
// ============================================================================

export interface PropertyOnChain {
  tokenId: string;
  propertyId: string;
  owner: string;
  title: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  metadata: {
    size: number;
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    yearBuilt?: number;
  };
  documents: {
    hash: string;
    type: 'deed' | 'survey' | 'certificate' | 'inspection';
    ipfsHash: string;
  }[];
  price: string;
  currency: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyTransfer {
  tokenId: string;
  from: string;
  to: string;
  price: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  escrowUsed: boolean;
  escrowAddress?: string;
}

// ============================================================================
// ESCROW TRANSACTION TYPES
// ============================================================================

export interface EscrowTransaction {
  id: string;
  propertyId: string;
  contractAddress: string;
  buyer: string;
  seller: string;
  escrowAgent?: string;
  amount: string;
  currency: string;
  status: 'created' | 'funded' | 'pending_release' | 'released' | 'refunded' | 'disputed';
  conditions: EscrowCondition[];
  milestones: EscrowMilestone[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface EscrowCondition {
  id: string;
  description: string;
  type: 'inspection' | 'financing' | 'legal' | 'custom';
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  evidence?: {
    type: 'document' | 'signature' | 'verification';
    hash: string;
    ipfsHash?: string;
  };
}

export interface EscrowMilestone {
  id: string;
  title: string;
  description: string;
  percentage: number; // Percentage of escrow to release
  conditions: string[]; // Condition IDs that must be met
  completed: boolean;
  completedAt?: string;
  transactionHash?: string;
}

// ============================================================================
// PAYMENT INTEGRATION TYPES
// ============================================================================

export interface BlockchainPayment {
  id: string;
  type: 'rent' | 'deposit' | 'purchase' | 'service_fee';
  amount: string;
  currency: string;
  tokenAddress?: string; // For ERC-20 tokens
  from: string;
  to: string;
  propertyId?: string;
  leaseId?: string;
  description: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  gasFee?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface RecurringPayment {
  id: string;
  paymentType: 'rent' | 'service_fee';
  amount: string;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  nextPaymentDate: string;
  autoExecute: boolean;
  contractAddress?: string;
  active: boolean;
  payments: BlockchainPayment[];
}

// ============================================================================
// DOCUMENT VERIFICATION TYPES
// ============================================================================

export interface DocumentOnChain {
  hash: string;
  ipfsHash: string;
  type: 'lease' | 'deed' | 'certificate' | 'inspection' | 'kyc' | 'identity';
  propertyId?: string;
  userId?: string;
  metadata: {
    filename: string;
    size: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  verification: {
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
    signature?: string;
  };
  access: {
    public: boolean;
    authorizedUsers: string[];
    expiresAt?: string;
  };
}

export interface DocumentVerification {
  documentHash: string;
  verifier: string;
  signature: string;
  timestamp: string;
  transactionHash: string;
  status: 'verified' | 'rejected' | 'pending';
  reason?: string;
}

// ============================================================================
// IDENTITY AND KYC ON-CHAIN TYPES
// ============================================================================

export interface IdentityOnChain {
  address: string;
  did: string; // Decentralized Identifier
  verifications: {
    bvn: boolean;
    nin: boolean;
    phone: boolean;
    email: boolean;
    address: boolean;
  };
  reputation: {
    score: number;
    transactions: number;
    disputes: number;
    resolutions: number;
  };
  credentials: {
    hash: string;
    issuer: string;
    type: string;
    expiresAt?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface KYCCredential {
  id: string;
  holder: string;
  issuer: string;
  type: 'bvn' | 'nin' | 'cac' | 'bank_account' | 'address_proof';
  data: {
    hash: string;
    encryptedData?: string;
    publicData?: any;
  };
  signature: string;
  issuedAt: string;
  expiresAt?: string;
  revoked: boolean;
  revokedAt?: string;
}

// ============================================================================
// TRANSACTION HISTORY TYPES
// ============================================================================

export interface BlockchainTransactionHistory {
  transactions: WalletTransaction[];
  escrows: EscrowTransaction[];
  payments: BlockchainPayment[];
  propertyTransfers: PropertyTransfer[];
  documentVerifications: DocumentVerification[];
  totalValue: string;
  totalTransactions: number;
  successRate: number;
}

export interface TransactionFilter {
  type?: 'payment' | 'escrow' | 'transfer' | 'verification';
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  propertyId?: string;
  address?: string;
}

// ============================================================================
// BLOCKCHAIN SERVICE TYPES
// ============================================================================

export interface BlockchainServiceConfig {
  networks: Record<BlockchainNetwork, NetworkConfig>;
  contracts: {
    propertyRegistry: Record<BlockchainNetwork, string>;
    escrow: Record<BlockchainNetwork, string>;
    payment: Record<BlockchainNetwork, string>;
    identity: Record<BlockchainNetwork, string>;
  };
  ipfs: {
    gateway: string;
    apiKey?: string;
  };
  defaultNetwork: BlockchainNetwork;
  gasSettings: {
    slow: string;
    standard: string;
    fast: string;
  };
}

export class BlockchainError extends Error {
  public code: string;
  public details?: any;
  public network?: BlockchainNetwork;
  public transactionHash?: string;
  public timestamp: string;

  constructor(
    message: string,
    code: string,
    details?: any,
    network?: BlockchainNetwork,
    transactionHash?: string
  ) {
    super(message);
    this.name = 'BlockchainError';
    this.code = code;
    this.details = details;
    this.network = network;
    this.transactionHash = transactionHash;
    this.timestamp = new Date().toISOString();
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type EscrowStatus =
  | 'created'
  | 'funded'
  | 'pending_release'
  | 'released'
  | 'refunded'
  | 'disputed';
export type ContractType = 'property_registry' | 'escrow' | 'payment' | 'identity';
export type GasSpeed = 'slow' | 'standard' | 'fast';

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface BlockchainEvent {
  type: 'transaction' | 'escrow' | 'property' | 'payment' | 'verification';
  event: string;
  data: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: string;
}

export interface PropertyEvent extends BlockchainEvent {
  type: 'property';
  event: 'PropertyRegistered' | 'PropertyTransferred' | 'PropertyUpdated';
  data: {
    tokenId: string;
    propertyId: string;
    owner: string;
    previousOwner?: string;
  };
}

export interface EscrowEvent extends BlockchainEvent {
  type: 'escrow';
  event: 'EscrowCreated' | 'EscrowFunded' | 'EscrowReleased' | 'EscrowRefunded';
  data: {
    escrowId: string;
    buyer: string;
    seller: string;
    amount: string;
  };
}

export interface PaymentEvent extends BlockchainEvent {
  type: 'payment';
  event: 'PaymentSent' | 'PaymentReceived' | 'PaymentFailed';
  data: {
    paymentId: string;
    from: string;
    to: string;
    amount: string;
    currency: string;
  };
}
