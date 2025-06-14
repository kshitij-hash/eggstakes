import { Scene } from 'phaser';
import { Chicken, ChickenType } from '../entities/Chicken';
import { EggSpawner } from '../utils/Spawner';
import { CollisionHandler } from '../utils/CollisionHandler';
import { EventBus } from '../EventBus';

export class ChickenGame extends Scene {
    // Game entities
    private chickenA: Chicken;
    private chickenB: Chicken;
    private eggSpawner: EggSpawner;
    private collisionHandler: CollisionHandler;
    
    // UI elements
    private scoreTextA: Phaser.GameObjects.Text;
    private scoreTextB: Phaser.GameObjects.Text;
    private timerText: Phaser.GameObjects.Text;
    private resultText: Phaser.GameObjects.Text;
    
    // Game config
    private readonly roundDuration: number = 30000; // 30 seconds
    private readonly canvasWidth: number = 800;
    private readonly canvasHeight: number = 600;
    private roundTimer: Phaser.Time.TimerEvent;
    private timeRemaining: number = 30;
    private isRoundActive: boolean = false;
    
    constructor() {
        super('ChickenGame');
        // Properties will be initialized in create() method
    }
    
    preload() {
        this.load.setPath('assets');
        
        // Load images
        this.load.image('background', 'background.png');
        this.load.image('chickenA', 'chicken_white.png');
        this.load.image('chickenB', 'chicken_brown.png');
        this.load.image('egg', 'egg.png');
        this.load.image('particle', 'particle.png');
        this.load.image('divider', 'divider.png');
        
        // Create programmatic sounds since we don't have audio files
        this.createSoundEffects();
    }
    
    // The createPlaceholderGraphics method has been removed as it's no longer needed
    // We're now using actual image assets loaded in the preload method
    
    /**
     * Creates programmatic sound effects using the Web Audio API
     */
    private createSoundEffects() {
        // Create catch sound (short high-pitched blip)
        const catchSound = this.sound.add('catch');
        if (!catchSound.source) {
            const ctx = this.sound.context;
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < buffer.length; i++) {
                // Create a short "blip" sound
                const t = i / buffer.length;
                data[i] = Math.sin(Math.PI * 10 * t) * (1 - t);
            }
            
            this.cache.audio.add('catch', buffer);
        }
        
        // Create round-end sound (longer celebratory sound)
        const roundEndSound = this.sound.add('round-end');
        if (!roundEndSound.source) {
            const ctx = this.sound.context;
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < buffer.length; i++) {
                // Create a celebratory sound
                const t = i / buffer.length;
                data[i] = Math.sin(Math.PI * 5 * t) * Math.sin(Math.PI * 20 * t) * (1 - 0.8 * t);
            }
            
            this.cache.audio.add('round-end', buffer);
        }
    }
    
    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Add background
        this.add.image(this.canvasWidth / 2, this.canvasHeight / 2, 'background');
        
        // Add divider
        const divider = this.add.image(this.canvasWidth / 2, this.canvasHeight / 2, 'divider');
        divider.setDisplaySize(10, this.canvasHeight);
        
        // Create chickens
        this.createChickens();
        
        // Set up egg spawner
        this.eggSpawner = new EggSpawner(this, this.canvasWidth);
        
        // Set up collision handler
        this.collisionHandler = new CollisionHandler(this);
        this.collisionHandler.setupCollisions(
            this.chickenA, 
            this.chickenB, 
            this.eggSpawner.getEggGroup()
        );
        
        // Create UI
        this.createUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the round
        this.startRound();
        
        // Notify React component that scene is ready
        EventBus.emit('current-scene-ready', this);
    }
    
    update() {
        // Update chickens AI
        if (this.isRoundActive) {
            this.chickenA.update(this.eggSpawner.getEggGroup());
            this.chickenB.update(this.eggSpawner.getEggGroup());
        }
    }
    
    private createChickens(): void {
        // Create chicken A (left side)
        const chickenAX = this.canvasWidth / 4;
        const chickenY = this.canvasHeight - 70;
        this.chickenA = new Chicken(this, chickenAX, chickenY, 'chickenA', ChickenType.CHICKEN_A, this.canvasWidth);
        
        // Create chicken B (right side)
        const chickenBX = (this.canvasWidth / 4) * 3;
        this.chickenB = new Chicken(this, chickenBX, chickenY, 'chickenB', ChickenType.CHICKEN_B, this.canvasWidth);
    }
    
    private createUI(): void {
        // Create score texts
        const textStyle = {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        };
        
        this.scoreTextA = this.add.text(
            this.canvasWidth / 4,
            30,
            'Score: 0',
            textStyle
        ).setOrigin(0.5);
        
        this.scoreTextB = this.add.text(
            (this.canvasWidth / 4) * 3,
            30,
            'Score: 0',
            textStyle
        ).setOrigin(0.5);
        
        // Create timer text
        this.timerText = this.add.text(
            this.canvasWidth / 2,
            30,
            `Time: ${this.timeRemaining}s`,
            textStyle
        ).setOrigin(0.5);
        
        // Create result text (hidden initially)
        this.resultText = this.add.text(
            this.canvasWidth / 2,
            this.canvasHeight / 2,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5).setVisible(false);
    }
    
    private setupEventListeners(): void {
        // Listen for score updates
        this.events.on('score-update', (data: { chickenType: ChickenType, scoreA: number, scoreB: number }) => {
            this.updateScoreDisplay(data.scoreA, data.scoreB);
            
            // Forward the event to React if needed
            EventBus.emit('score-update', {
                chickenType: data.chickenType,
                scoreA: data.scoreA,
                scoreB: data.scoreB
            });
        });
    }
    
    private startRound(): void {
        this.isRoundActive = true;
        this.timeRemaining = this.roundDuration / 1000;
        
        // Reset scores
        this.collisionHandler.resetScores();
        this.updateScoreDisplay(0, 0);
        
        // Reset UI
        this.resultText.setVisible(false);
        
        // Start egg spawner
        this.eggSpawner.start();
        
        // Start round timer
        this.roundTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            repeat: this.timeRemaining - 1
        });
        
        // Emit round-start event for UI components
        EventBus.emit('round-start');
    }
    
    private updateTimer(): void {
        this.timeRemaining--;
        this.timerText.setText(`Time: ${this.timeRemaining}s`);
        
        if (this.timeRemaining <= 0) {
            this.endRound();
        }
    }
    
    private endRound(): void {
        this.isRoundActive = false;
        
        // Stop egg spawning
        this.eggSpawner.stop();
        
        // Stop chickens
        this.chickenA.setVelocity(0);
        this.chickenB.setVelocity(0);
        
        // Get final scores
        const scoreA = this.collisionHandler.getScoreA();
        const scoreB = this.collisionHandler.getScoreB();
        
        // Determine winner
        let resultMessage: string;
        let winner: string | null = null;
        
        if (scoreA > scoreB) {
            resultMessage = "Chicken A Wins!";
            winner = "A";
        } else if (scoreB > scoreA) {
            resultMessage = "Chicken B Wins!";
            winner = "B";
        } else {
            resultMessage = "Draw!";
            winner = "draw";
        }
        
        // Display result
        this.resultText.setText(resultMessage);
        this.resultText.setVisible(true);
        
        // Play round-end sound
        this.sound.play('round-end');
        
        // Emit round end event
        EventBus.emit('round-end', {
            winner,
            scoreA,
            scoreB
        });
        
        // Restart after delay (for demo purposes - in production you might want user interaction)
        this.time.delayedCall(3000, () => {
            this.resetGame();
        });
    }
    
    private resetGame(): void {
        // Clear all eggs
        this.eggSpawner.clearEggs();
        
        // Start a new round
        this.startRound();
    }
    
    private updateScoreDisplay(scoreA: number, scoreB: number): void {
        this.scoreTextA.setText(`Score: ${scoreA}`);
        this.scoreTextB.setText(`Score: ${scoreB}`);
    }
}
