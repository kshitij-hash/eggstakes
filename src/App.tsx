import { useRef, useState, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';
import { PredictionUI } from './PredictionUI';
import { WalletConnect } from './components/WalletConnect';
import { useWallet } from './context/WalletProvider';

function App() {
    // References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [roundInfo, setRoundInfo] = useState<{ winner: string | null, scoreA: number, scoreB: number } | null>(null);
    const [userPrediction, setUserPrediction] = useState<string | null>(null);
    const [predictionResult, setPredictionResult] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const { isConnected } = useWallet();
    
    useEffect(() => {
        // Handler for round end event from the game
        const handleRoundEnd = (data: { winner: string | null, scoreA: number, scoreB: number }) => {
            setRoundInfo(data);
            
            // Check if prediction was correct
            if (userPrediction) {
                const isCorrect = userPrediction === data.winner;
                setPredictionResult(isCorrect ? 'correct' : 'incorrect');
            }
        };
        
        // Use EventBus to listen for round-end event from Phaser
        EventBus.on('round-end', handleRoundEnd);
        
        // Listen for round-start event to reset prediction result
        EventBus.on('round-start', () => {
            setPredictionResult(null);
        });
        
        return () => {
            // Clean up event listeners
            EventBus.removeListener('round-end');
            EventBus.removeListener('round-start');
        };
    }, [userPrediction]);

    const handlePredictionMade = (prediction: string) => {
        setUserPrediction(prediction);
        
        // Emit event to notify game that prediction is made
        EventBus.emit('prediction-made', { prediction });
    };
    
    const handleWalletConnected = (address: string) => {
        setWalletAddress(address);
        console.log('Wallet connected:', address);
    };

    return (
        <div id="app">
            <header>
                <h1>🐔 Chicken Egg-Catching Game 🥚</h1>
                <WalletConnect onWalletConnected={handleWalletConnected} />
            </header>
            <main>
                <div className="game-container">
                    <PhaserGame ref={phaserRef} />
                    
                    <PredictionUI onPredictionMade={handlePredictionMade} />
                </div>
                
                {isConnected && walletAddress && (
                    <div className="wallet-status">
                        <p>Playing with wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</p>
                    </div>
                )}
                
                {roundInfo && (
                    <div className="round-results">
                        <h2>{roundInfo.winner === 'A' ? 'Chicken A Wins!' : 
                             roundInfo.winner === 'B' ? 'Chicken B Wins!' : 
                             'Draw!'}</h2>
                        <p>Final Score: Chicken A: {roundInfo.scoreA} | Chicken B: {roundInfo.scoreB}</p>
                        
                        {predictionResult && (
                            <div className={`prediction-result ${predictionResult}`}>
                                <p>Your prediction was {predictionResult}!</p>
                                {userPrediction && (
                                    <p>You predicted: {userPrediction === 'A' ? 'Chicken A' : 
                                                      userPrediction === 'B' ? 'Chicken B' : 
                                                      'Draw'}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App
