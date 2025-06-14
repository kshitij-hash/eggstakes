import { Scene } from 'phaser';
import { Chicken, ChickenType } from '../entities/Chicken';
import { EggSpawner } from '../utils/Spawner';
import { CollisionHandler } from '../utils/CollisionHandler';
import { EventBus } from '../EventBus';
import { contractService, Hen } from '../../services/ContractService'; // Added import, Hen enum

// Enum for game phases
enum GamePhase {
    STARTING_ROUND,
    GAMEPLAY,
    BETTING,
    ENDING_ROUND,
    SHOWING_RESULTS,
    RESTARTING
}

// Game timing constants
const GAME_DURATION = 60000; // 1 minute
const BET_DURATION = 20000;  // 20 seconds
const RESULTS_DURATION = 60000; // 1 minute

export class ChickenGame extends Scene {
    // Game entities
    private chickenA!: Chicken;
    private chickenB!: Chicken;
    private eggSpawner!: EggSpawner;
    private collisionHandler!: CollisionHandler;

    // UI elements
    private scoreTextA!: Phaser.GameObjects.Text;
    private scoreTextB!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text; // New UI element for status
    private resultText!: Phaser.GameObjects.Text;

    // Game config & state
    private readonly canvasWidth: number = 800;
    private readonly canvasHeight: number = 600;
    private currentPhase!: GamePhase;
    private phaseTimer!: Phaser.Time.TimerEvent;
    private phaseTimeRemaining: number = 0;
    private lastWinnerData: { winner: string | null, scoreA: number, scoreB: number } | null = null;

    constructor() {
        super('ChickenGame');
    }

    preload() {
        this.createPlaceholderGraphics();
        this.createPlaceholderAudio();
    }

    private createPlaceholderGraphics() {
        // Create background
        const bgGraphics = this.make.graphics({x: 0, y: 0});
        bgGraphics.fillStyle(0x87CEEB); // Sky blue
        bgGraphics.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        bgGraphics.fillStyle(0x8FBC8F); // Dark sea green for ground
        bgGraphics.fillRect(0, this.canvasHeight - 50, this.canvasWidth, 50);
        bgGraphics.generateTexture('background', this.canvasWidth, this.canvasHeight);
        
        // Create chicken A (white)
        const chickenAGraphics = this.make.graphics({x: 0, y: 0});
        chickenAGraphics.fillStyle(0xFFFFFF); // White
        chickenAGraphics.fillCircle(25, 25, 20);
        chickenAGraphics.fillStyle(0xFF0000); // Red for comb
        chickenAGraphics.fillTriangle(25, 0, 35, 10, 15, 10);
        chickenAGraphics.fillStyle(0xFF6A00); // Orange for beak
        chickenAGraphics.fillTriangle(25, 25, 45, 25, 25, 35);
        chickenAGraphics.generateTexture('chickenA', 50, 50);
        
        // Create chicken B (brown)
        const chickenBGraphics = this.make.graphics({x: 0, y: 0});
        chickenBGraphics.fillStyle(0xA52A2A); // Brown
        chickenBGraphics.fillCircle(25, 25, 20);
        chickenBGraphics.fillStyle(0xFF0000); // Red for comb
        chickenBGraphics.fillTriangle(25, 0, 35, 10, 15, 10);
        chickenBGraphics.fillStyle(0xFF6A00); // Orange for beak
        chickenBGraphics.fillTriangle(25, 25, 45, 25, 25, 35);
        chickenBGraphics.generateTexture('chickenB', 50, 50);
        
        // Create egg
        const eggGraphics = this.make.graphics({x: 0, y: 0});
        eggGraphics.fillStyle(0xFFFFFF); // White
        eggGraphics.fillCircle(15, 15, 15);
        eggGraphics.generateTexture('egg', 30, 30);
        
        // Create particle
        const particleGraphics = this.make.graphics({x: 0, y: 0});
        particleGraphics.fillStyle(0xFFD700); // Gold
        particleGraphics.fillCircle(5, 5, 5);
        particleGraphics.generateTexture('particle', 10, 10);
        
        // Create divider
        const dividerGraphics = this.make.graphics({x: 0, y: 0});
        dividerGraphics.fillStyle(0xFFFFFF); // White
        dividerGraphics.fillRect(0, 0, 10, this.canvasHeight);
        dividerGraphics.lineStyle(2, 0x000000); // Black border
        dividerGraphics.strokeRect(0, 0, 10, this.canvasHeight);
        dividerGraphics.generateTexture('divider', 10, this.canvasHeight);
    }

    private createPlaceholderAudio() {
        if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
            const audioContext = this.sound.context;
            const frameCount = audioContext.sampleRate * 0.1; // 100ms duration
            const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < frameCount; i++) {
                data[i] = Math.sin(2 * Math.PI * 440 * i / audioContext.sampleRate) * Math.exp(-i / audioContext.sampleRate * 5);
            }
            this.cache.audio.add('catch', buffer);
        }
    }

    create() {
        this.physics.world.setBounds(0, 0, this.canvasWidth, this.canvasHeight);
        this.add.image(this.canvasWidth / 2, this.canvasHeight / 2, 'background');
        const divider = this.add.image(this.canvasWidth / 2, this.canvasHeight / 2, 'divider');
        divider.setDisplaySize(10, this.canvasHeight);

        this.createChickens();
        this.eggSpawner = new EggSpawner(this, this.canvasWidth);
        this.collisionHandler = new CollisionHandler(this);
        this.collisionHandler.setupCollisions(
            this.chickenA,
            this.chickenB,
            this.eggSpawner.getEggGroup()
        );

        this.createUI();
        this.setupEventListeners();

        this.moveToNextPhase(GamePhase.STARTING_ROUND);

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.currentPhase === GamePhase.GAMEPLAY) {
            this.chickenA.update(this.eggSpawner.getEggGroup());
            this.chickenB.update(this.eggSpawner.getEggGroup());
        }
    }

    private createChickens(): void {
        const chickenAX = this.canvasWidth / 4;
        const chickenY = this.canvasHeight - 70;
        this.chickenA = new Chicken(this, chickenAX, chickenY, 'chickenA', ChickenType.CHICKEN_A, this.canvasWidth);

        const chickenBX = (this.canvasWidth / 4) * 3;
        this.chickenB = new Chicken(this, chickenBX, chickenY, 'chickenB', ChickenType.CHICKEN_B, this.canvasWidth);
    }

    private createUI(): void {
        const textStyle = {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        };

        this.scoreTextA = this.add.text(this.canvasWidth / 4, 30, 'Score: 0', textStyle).setOrigin(0.5);
        this.scoreTextB = this.add.text((this.canvasWidth / 4) * 3, 30, 'Score: 0', textStyle).setOrigin(0.5);

        // Status text to show current game phase information
        this.statusText = this.add.text(this.canvasWidth / 2, 30, '', textStyle).setOrigin(0.5);
        
        // Timer text, positioned below status text
        this.timerText = this.add.text(this.canvasWidth / 2, 60, '', textStyle).setOrigin(0.5);

        this.resultText = this.add.text(
            this.canvasWidth / 2,
            this.canvasHeight / 2,
            '',
            { ...textStyle, fontSize: '48px', strokeThickness: 6, align: 'center' }
        ).setOrigin(0.5).setVisible(false);
    }

    private setupEventListeners(): void {
        this.events.on('score-update', (data: { chickenType: ChickenType, scoreA: number, scoreB: number }) => {
            this.updateScoreDisplay(data.scoreA, data.scoreB);
            EventBus.emit('score-update', {
                chickenType: data.chickenType,
                scoreA: data.scoreA,
                scoreB: data.scoreB
            });
        });
    }

    private async moveToNextPhase(nextPhase?: GamePhase): Promise<void> {
        if (nextPhase !== undefined) {
            this.currentPhase = nextPhase;
        }

        if (this.phaseTimer) {
            this.phaseTimer.destroy();
        }
        this.timerText.setText('');
        this.resultText.setVisible(false);

        console.log(`ChickenGame: Moving to phase: ${GamePhase[this.currentPhase]}`);

        switch (this.currentPhase) {
            case GamePhase.STARTING_ROUND:
                this.statusText.setText('Starting New Round...');
                try {
                    const roundDurationForContract = (GAME_DURATION + BET_DURATION) / 1000;
                    console.log(`ChickenGame: Calling contractService.startRound() with duration: ${roundDurationForContract}s`);
                    await contractService.startRound(roundDurationForContract);
                    console.log('ChickenGame: contractService.startRound() successful');
                    this.moveToNextPhase(GamePhase.GAMEPLAY);
                } catch (error) {
                    console.error('ChickenGame: Error starting round:', error);
                    this.statusText.setText('Error starting round. Retrying in 5s...');
                    this.time.delayedCall(5000, () => this.moveToNextPhase(GamePhase.STARTING_ROUND));
                }
                break;

            case GamePhase.GAMEPLAY:
                this.statusText.setText('Game in Progress!');
                this.phaseTimeRemaining = GAME_DURATION / 1000;
                this.timerText.setText(`Time: ${this.phaseTimeRemaining}s`);
                this.collisionHandler.resetScores();
                this.updateScoreDisplay(0, 0);
                this.eggSpawner.start();
                this.phaseTimer = this.time.addEvent({
                    delay: 1000,
                    callback: this.updatePhaseTimer,
                    callbackScope: this,
                    loop: true
                });
                break;

            case GamePhase.BETTING:
                this.statusText.setText('Place Your Bets!');
                this.phaseTimeRemaining = BET_DURATION / 1000;
                this.timerText.setText(`Bet Time: ${this.phaseTimeRemaining}s`);
                this.eggSpawner.stop();
                EventBus.emit('betting-phase-started');
                this.phaseTimer = this.time.addEvent({
                    delay: 1000,
                    callback: this.updatePhaseTimer,
                    callbackScope: this,
                    loop: true
                });
                break;

            case GamePhase.ENDING_ROUND:
                this.statusText.setText('Ending Round...');
                EventBus.emit('betting-phase-ended');
                const gameWinner = this.determineAndDisplayLocalWinner(); 
                try {
                    let contractWinner: Hen;
                    if (gameWinner.winner === 'A') {
                        contractWinner = Hen.A;
                    } else if (gameWinner.winner === 'B') {
                        contractWinner = Hen.B;
                    } else { // Draw or null
                        console.warn('ChickenGame: Local game was a draw. Defaulting to Hen.A for contract endRound.');
                        contractWinner = Hen.A; // Default to Hen.A if draw, as contract requires a winner
                    }
                    console.log(`ChickenGame: Calling contractService.endRound() with winner: ${Hen[contractWinner]}`);
                    await contractService.endRound(contractWinner);
                    console.log('ChickenGame: contractService.endRound() successful');
                    this.moveToNextPhase(GamePhase.SHOWING_RESULTS);
                } catch (error) {
                    console.error('ChickenGame: Error ending round:', error);
                    this.statusText.setText('Error ending round. Retrying in 5s...');
                    this.time.delayedCall(5000, () => this.moveToNextPhase(GamePhase.ENDING_ROUND));
                }
                break;

            case GamePhase.SHOWING_RESULTS:
                this.statusText.setText('Fetching Results...');
                this.phaseTimeRemaining = RESULTS_DURATION / 1000;
                this.timerText.setText(`Next Game: ${this.phaseTimeRemaining}s`);
                try {
                    console.log('ChickenGame: Calling contractService.getPlayers()');
                    const players = await contractService.getPlayers();
                    console.log('ChickenGame: Players:', players);
                    EventBus.emit('show-results', { players, winnerData: this.lastWinnerData });
                } catch (error) {
                    console.error('ChickenGame: Error fetching players:', error);
                    EventBus.emit('show-results', { error: 'Failed to fetch player data', winnerData: this.lastWinnerData });
                }
                this.phaseTimer = this.time.addEvent({
                    delay: 1000,
                    callback: this.updatePhaseTimer,
                    callbackScope: this,
                    loop: true
                });
                break;

            case GamePhase.RESTARTING:
                this.statusText.setText('Preparing Next Game...');
                this.eggSpawner.clearEggs();
                this.time.delayedCall(2000, () => this.moveToNextPhase(GamePhase.STARTING_ROUND));
                break;
        }
    }

    private updatePhaseTimer(): void {
        this.phaseTimeRemaining--;
        let timerPrefix = "Time: ";
        if (this.currentPhase === GamePhase.BETTING) timerPrefix = "Bet Time: ";
        else if (this.currentPhase === GamePhase.SHOWING_RESULTS) timerPrefix = "Next Game: ";
        this.timerText.setText(`${timerPrefix}${this.phaseTimeRemaining}s`);

        if (this.phaseTimeRemaining <= 0) {
            if (this.phaseTimer) this.phaseTimer.destroy();

            if (this.currentPhase === GamePhase.GAMEPLAY) {
                this.moveToNextPhase(GamePhase.BETTING);
            } else if (this.currentPhase === GamePhase.BETTING) {
                this.moveToNextPhase(GamePhase.ENDING_ROUND);
            } else if (this.currentPhase === GamePhase.SHOWING_RESULTS) {
                this.moveToNextPhase(GamePhase.RESTARTING);
            }
        }
    }

    private determineAndDisplayLocalWinner(): { winner: string | null, scoreA: number, scoreB: number } {
        const scoreA = this.collisionHandler.getScoreA();
        const scoreB = this.collisionHandler.getScoreB();
        let resultMessage: string;
        let winner: string | null = null;

        if (scoreA > scoreB) {
            resultMessage = "Chicken A Wins This Match!";
            winner = "A";
        } else if (scoreB > scoreA) {
            resultMessage = "Chicken B Wins This Match!";
            winner = "B";
        } else {
            resultMessage = "Match Draw!";
            winner = "draw";
        }
        this.resultText.setText(resultMessage);
        this.resultText.setVisible(true);
        this.lastWinnerData = { winner, scoreA, scoreB };
        EventBus.emit('local-round-end', this.lastWinnerData);
        return this.lastWinnerData;
    }

    private updateScoreDisplay(scoreA: number, scoreB: number): void {
        this.scoreTextA.setText(`Score: ${scoreA}`);
        this.scoreTextB.setText(`Score: ${scoreB}`);
    }
}
