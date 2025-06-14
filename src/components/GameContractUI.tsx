import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletProvider';
import { contractService, Hen } from '../services/ContractService';
import { EventBus } from '../game/EventBus';
import { ethers } from 'ethers';

// Styles for the component
const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '20px',
    margin: '20px 0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '100%',
  },
  header: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#333',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  statBox: {
    textAlign: 'center' as const,
    padding: '10px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  betContainer: {
    marginBottom: '20px',
  },
  betTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#333',
  },
  betButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  betButton: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.2s ease',
  },
  betButtonA: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    border: '2px solid transparent',
  },
  betButtonASelected: {
    backgroundColor: '#bbdefb',
    borderColor: '#1976d2',
  },
  betButtonB: {
    backgroundColor: '#fce4ec',
    color: '#c2185b',
    border: '2px solid transparent',
  },
  betButtonBSelected: {
    backgroundColor: '#f8bbd0',
    borderColor: '#c2185b',
  },
  placeBetButton: {
    backgroundColor: '#9945FF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
    transition: 'background-color 0.2s ease',
  },
  claimButton: {
    backgroundColor: '#14F195',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
    transition: 'background-color 0.2s ease',
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  notification: {
    padding: '12px',
    borderRadius: '8px',
    marginTop: '15px',
    fontSize: '14px',
  },
  successNotification: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    border: '1px solid #c8e6c9',
  },
  errorNotification: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ffcdd2',
  },
  infoNotification: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    border: '1px solid #bbdefb',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,.3)',
    borderRadius: '50%',
    borderTopColor: '#fff',
    animation: 'spin 1s ease-in-out infinite',
    marginRight: '10px',
  },
  countdown: {
    textAlign: 'center' as const,
    marginTop: '10px',
    fontSize: '16px',
    fontWeight: 600,
  },
  winnerDisplay: {
    textAlign: 'center' as const,
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
    fontSize: '18px',
    fontWeight: 600,
  },
  winnerA: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    border: '2px solid #1976d2',
  },
  winnerB: {
    backgroundColor: '#fce4ec',
    color: '#c2185b',
    border: '2px solid #c2185b',
  },
};

// Add keyframes for spinner animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

interface GameContractUIProps {
  onBetPlaced?: (hen: Hen) => void;
}

export const GameContractUI: React.FC<GameContractUIProps> = ({ onBetPlaced }) => {
  const {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchToMonadTestnet,
    chainId,
  } = useWallet();
  
  const [selectedHen, setSelectedHen] = useState<Hen | null>(null);
  const [betAmount, setBetAmount] = useState<string>('0');
  const [totalA, setTotalA] = useState<string>('0');
  const [totalB, setTotalB] = useState<string>('0');
  const [isRoundActive, setIsRoundActive] = useState<boolean>(true);
  const [winningHen, setWinningHen] = useState<Hen | null>(null);
  const [userBet, setUserBet] = useState<{ hen: Hen | null, claimed: boolean }>({ hen: null, claimed: false });
  const [roundEndTime, setRoundEndTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [isClaimingReward, setIsClaimingReward] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // Initialize contract data
  useEffect(() => {
    if (isConnected && address) {
      loadContractData();
    }
  }, [isConnected, address]);

  // Update time left
  useEffect(() => {
    if (roundEndTime <= 0) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = roundEndTime - now;
      
      if (remaining <= 0) {
        setTimeLeft('Round ended');
        setIsRoundActive(false);
        clearInterval(timer);
      } else {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [roundEndTime]);

  // Listen for game events
  useEffect(() => {
    const handleRoundEnd = async () => {
      await loadContractData();
    };

    const handleRoundStart = async () => {
      await loadContractData();
      setSelectedHen(null);
      setWinningHen(null);
    };

    EventBus.on('round-end', handleRoundEnd);
    EventBus.on('round-start', handleRoundStart);

    return () => {
      EventBus.removeListener('round-end');
      EventBus.removeListener('round-start');
    };
  }, []);

  const loadContractData = async () => {
    try {
      // Get bet amount
      const amount = await contractService.getBetAmount();
      setBetAmount(ethers.formatEther(amount));

    } catch (error) {
      console.error('Error loading contract data:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load game data from contract'
      });
    }
  };

  const handleSelectHen = (hen: Hen) => {
    setSelectedHen(hen);
  };

  const handlePlaceBet = async () => {
    if (!selectedHen || !isConnected || !address) return;
    
    setIsPlacingBet(true);
    setNotification(null);
    
    try {
      const tx = await contractService.placeBet(selectedHen);
      setNotification({
        type: 'info',
        message: 'Transaction submitted! Waiting for confirmation...'
      });
      
      await tx.wait();
      
      setNotification({
        type: 'success',
        message: 'Bet placed successfully!'
      });
      
      // Update UI
      await loadContractData();
      
      // Notify parent component
      if (onBetPlaced) {
        onBetPlaced(selectedHen);
      }
    } catch (error: any) {
      console.error('Error placing bet:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to place bet'
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const canPlaceBet = isConnected && isRoundActive && selectedHen !== null && !isPlacingBet;
  const canClaimReward = isConnected && !isRoundActive && userBet.hen === winningHen && !userBet.claimed && !isClaimingReward;

  return (
    <div style={styles.container}>
      {!isConnected && (
        <button
          onClick={connect} // Call the connect function from useWallet
          disabled={isConnecting}
          style={{ ...styles.placeBetButton, marginBottom: '20px', backgroundColor: '#007bff' /* Blue connect button */ }}
        >
          {isConnecting ? (
            <>
              <span style={styles.loadingSpinner}></span>
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>
      )}

      {/* Only show the main game UI if connected */}
      {isConnected && (
        <>
      <h2 style={styles.header}>Hen Betting Game</h2>
      
      <div style={styles.statsContainer}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Bet Amount</div>
          <div style={styles.statValue}>{betAmount} ETH</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Total Bets A</div>
          <div style={styles.statValue}>{totalA} ETH</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Total Bets B</div>
          <div style={styles.statValue}>{totalB} ETH</div>
        </div>
      </div>
      
      {isRoundActive ? (
        <div style={styles.countdown}>
          Time left: {timeLeft}
        </div>
      ) : winningHen !== null && (
        <div style={{
          ...styles.winnerDisplay,
          ...(winningHen === Hen.A ? styles.winnerA : styles.winnerB)
        }}>
          Winner: Hen {winningHen === Hen.A ? 'A' : 'B'}
        </div>
      )}
      
      {isRoundActive ? (
        <div style={styles.betContainer}>
          <h3 style={styles.betTitle}>Place Your Bet</h3>
          
          <div style={styles.betButtons}>
            <button
              style={{
                ...styles.betButton,
                ...styles.betButtonA,
                ...(selectedHen === Hen.A ? styles.betButtonASelected : {})
              }}
              onClick={() => handleSelectHen(Hen.A)}
              disabled={!isConnected || userBet.hen !== null}
            >
              Hen A
            </button>
            
            <button
              style={{
                ...styles.betButton,
                ...styles.betButtonB,
                ...(selectedHen === Hen.B ? styles.betButtonBSelected : {})
              }}
              onClick={() => handleSelectHen(Hen.B)}
              disabled={!isConnected || userBet.hen !== null}
            >
              Hen B
            </button>
          </div>
          
          <button
            style={{
              ...styles.placeBetButton,
              ...(!canPlaceBet ? styles.disabledButton : {})
            }}
            onClick={handlePlaceBet}
            disabled={!canPlaceBet}
          >
            {isPlacingBet ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Placing Bet...
              </>
            ) : userBet.hen !== null ? (
              `Already Bet on Hen ${userBet.hen === Hen.A ? 'A' : 'B'}`
            ) : (
              `Place Bet (${betAmount} ETH)`
            )}
          </button>
        </div>
      ) : null}
      
      {notification && (
        <div style={{
          ...styles.notification,
          ...(notification.type === 'success' ? styles.successNotification :
             notification.type === 'error' ? styles.errorNotification :
             styles.infoNotification)
        }}>
          {notification.message}
        </div>
      )}
      </> 
      )}
      {/* End of isConnected conditional rendering */}
    </div>
  );
};
