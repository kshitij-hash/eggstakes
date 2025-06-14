import React, { useState, useEffect } from 'react';
import { EventBus } from './game/EventBus';

interface PredictionUIProps {
    onPredictionMade: (prediction: string) => void;
}

export const PredictionUI: React.FC<PredictionUIProps> = ({ onPredictionMade }) => {
    const [showPrediction, setShowPrediction] = useState<boolean>(true);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number>(5);
    const [isLocked, setIsLocked] = useState<boolean>(false);

    useEffect(() => {
        // Listen for round-end event to show prediction UI for next round
        const handleRoundEnd = () => {
            // Reset prediction UI for next round
            setTimeout(() => {
                setPrediction(null);
                setIsLocked(false);
                setCountdown(5);
                setShowPrediction(true);
            }, 2000); // Show prediction UI 2 seconds after round ends
        };

        // Listen for round-start event to hide prediction UI
        const handleRoundStart = () => {
            setShowPrediction(false);
        };

        EventBus.on('round-end', handleRoundEnd);
        EventBus.on('round-start', handleRoundStart);

        return () => {
            EventBus.removeListener('round-end');
            EventBus.removeListener('round-start');
        };
    }, []);

    // Countdown timer effect
    useEffect(() => {
        if (!showPrediction || isLocked || countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Auto-lock when countdown reaches 0
                    setIsLocked(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showPrediction, isLocked, countdown]);

    // When prediction is locked in, notify parent component
    useEffect(() => {
        if (isLocked && prediction) {
            onPredictionMade(prediction);
        }
    }, [isLocked, prediction, onPredictionMade]);

    const handlePrediction = (chickenType: string) => {
        setPrediction(chickenType);
    };

    const handleLockIn = () => {
        if (prediction) {
            setIsLocked(true);
        }
    };

    if (!showPrediction) return null;

    return (
        <div className="prediction-ui">
            <h2>Predict the Winner</h2>
            <p>Time to lock in: {countdown}s</p>
            
            <div className="prediction-buttons">
                <button 
                    onClick={() => handlePrediction('A')}
                    className={`prediction-button ${prediction === 'A' ? 'selected' : ''}`}
                    disabled={isLocked}
                >
                    Chicken A
                </button>
                
                <button 
                    onClick={() => handlePrediction('draw')}
                    className={`prediction-button ${prediction === 'draw' ? 'selected' : ''}`}
                    disabled={isLocked}
                >
                    Draw
                </button>
                
                <button 
                    onClick={() => handlePrediction('B')}
                    className={`prediction-button ${prediction === 'B' ? 'selected' : ''}`}
                    disabled={isLocked}
                >
                    Chicken B
                </button>
            </div>
            
            <button 
                onClick={handleLockIn}
                className="lock-button"
                disabled={!prediction || isLocked}
            >
                {isLocked ? 'Prediction Locked!' : 'Lock In Prediction'}
            </button>
        </div>
    );
};
