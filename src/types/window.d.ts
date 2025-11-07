// Window type declarations for blockchain integration

interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isTrustWallet?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  selectedAddress: string | null;
  chainId: string;
  networkVersion: string;
  isConnected: () => boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
