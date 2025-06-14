import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { createConfig, http, WagmiProvider, useConnect, useAccount, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Define Monad Testnet chain
export const monadTestnet = {
  id: 10_143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.monad.xyz'] },
    public: { http: ['https://rpc.testnet.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.testnet.monad.xyz' },
  },
  testnet: true,
};

// Create a client for React Query
const queryClient = new QueryClient();

// Create a wagmi config with Monad Testnet
const config = createConfig({
  chains: [monadTestnet, mainnet, sepolia],
  transports: {
    [monadTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    injected(),
  ],
});

// Define the wallet context type
type WalletContextType = {
  connect: () => void;
  disconnect: () => void;
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | undefined;
  switchToMonadTestnet: () => void;
};

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  connect: () => {},
  disconnect: () => {},
  address: undefined,
  isConnected: false,
  isConnecting: false,
  chainId: undefined,
  switchToMonadTestnet: () => {},
});

// Create a hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Wallet provider component
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>{children}</WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Inner provider that uses wagmi hooks
const WalletProviderInner = ({ children }: { children: ReactNode }) => {
  const { connect: wagmiConnect, connectors, isPending } = useConnect();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Connect to wallet
  const connect = () => {
    const connector = connectors.find(c => c.id === 'injected');
    if (connector) {
      wagmiConnect({ connector });
    } else {
      console.error('Phantom wallet connector not found');
    }
  };
  
  // Disconnect from wallet
  const disconnect = () => {
    wagmiDisconnect();
  };
  
  // Switch to Monad Testnet
  const switchToMonadTestnet = async () => {
    if (!window.ethereum) {
      console.error('No ethereum provider found');
      return;
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${monadTestnet.id.toString(16)}`,
                chainName: monadTestnet.name,
                nativeCurrency: monadTestnet.nativeCurrency,
                rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
                blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Monad Testnet to wallet', addError);
        }
      } else {
        console.error('Failed to switch to Monad Testnet', error);
      }
    }
  };

  // Check if Phantom is installed
  useEffect(() => {
    const checkPhantomInstalled = () => {
      const isPhantomInstalled = window.ethereum && window.ethereum.isPhantom;
      if (!isPhantomInstalled) {
        console.warn('Phantom wallet is not installed');
      }
    };
    
    if (typeof window !== 'undefined') {
      checkPhantomInstalled();
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        connect,
        disconnect,
        address,
        isConnected,
        isConnecting: isPending,
        chainId,
        switchToMonadTestnet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
