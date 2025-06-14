import React, { useState } from 'react';
import { useWallet, monadTestnet } from '../context/WalletProvider';

// Use inline styles instead of CSS module
const styles = {
  walletConnect: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  connectButton: {
    backgroundColor: '#9945FF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s ease'
  },
  walletInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  addressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0'
  },
  addressLabel: {
    fontWeight: '600',
    color: '#555'
  },
  address: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  connectedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#e0f2fe',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #bae6fd',
    color: 'black',
  },
  switchNetworkButton: {
    backgroundColor: '#FF9900',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  networkBadge: {
    backgroundColor: '#14F195',
    color: '#333',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '20px',
    display: 'inline-block',
    textAlign: 'center' as const,
    fontSize: '14px'
  },
  disconnectButton: {
    backgroundColor: '#ff5252',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  errorMessage: {
    marginTop: '12px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderLeft: '4px solid #f44336',
    color: '#d32f2f',
    fontSize: '14px',
    borderRadius: '4px'
  }
};

interface WalletConnectProps {
  onWalletConnected?: (address: string) => void;
}

export function WalletConnect({ onWalletConnected }: WalletConnectProps) {
  const { connect, disconnect, address, isConnected, isConnecting, chainId, switchToMonadTestnet } = useWallet();
  const [error, setError] = useState<string | null>(null);

  // SVG component for profile icon
  const ProfileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM12 14C8.68629 14 6 16.6863 6 20H18C18 16.6863 15.3137 14 12 14Z" fill="#333"/>
    </svg>
  );

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Handle connect button click
  const handleConnect = async () => {
    try {
      setError(null);
      connect();
      if (address && onWalletConnected) {
        onWalletConnected(address);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Connection error:', err);
    }
  };

  // Handle disconnect button click
  const handleDisconnect = () => {
    try {
      disconnect();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet');
      console.error('Disconnect error:', err);
    }
  };

  // Handle switch to Monad Testnet
  const handleSwitchNetwork = async () => {
    try {
      setError(null);
      await switchToMonadTestnet();
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
      console.error('Network switch error:', err);
    }
  };

  // Check if connected to Monad Testnet
  const isMonadTestnet = chainId === monadTestnet.id;

  return (
    <div style={styles.walletConnect}>
      {!isConnected ? (
        <button 
          style={styles.connectButton} 
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'}
        </button>
      ) : (
        <div style={styles.walletInfo}>
          {isMonadTestnet ? (
            <div style={styles.connectedInfo}>
              <ProfileIcon />
              <span style={{...styles.address, backgroundColor: 'transparent'}}>{formatAddress(address || '')}</span>
            </div>
          ) : (
            <>
              <div style={styles.addressContainer}>
                <span style={styles.addressLabel}>Connected:</span>
                <span style={styles.address}>{formatAddress(address || '')}</span>
              </div>
              <button 
                style={styles.switchNetworkButton} 
                onClick={handleSwitchNetwork}
              >
                Switch to Monad Testnet
              </button>
            </>
          )}
          
          <button 
            style={styles.disconnectButton} 
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      )}
      
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
}
