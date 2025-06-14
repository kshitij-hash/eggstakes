import { ChickenGame } from './scenes/ChickenGame';
import { AUTO, Game, Types, Scale } from "phaser";

// Game configuration
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB', // Sky blue background
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 300 },
            debug: false
        }
    },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: [
        ChickenGame
    ]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

// Handle window resize events
const handleResize = (game: Game) => {
    if (!game) return;
    
    const canvas = game.canvas;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const gameRatio = game.config.width as number / (game.config.height as number);
    
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + 'px';
        canvas.style.height = (windowWidth / gameRatio) + 'px';
    } else {
        canvas.style.width = (windowHeight * gameRatio) + 'px';
        canvas.style.height = windowHeight + 'px';
    }
};

export { handleResize };
export default StartGame;
