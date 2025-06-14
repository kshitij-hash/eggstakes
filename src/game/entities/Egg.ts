import { Scene } from 'phaser';
import { ChickenType } from './Chicken';

export class Egg extends Phaser.Physics.Arcade.Sprite {
    private readonly chickenType: ChickenType;
    private readonly fallSpeed: number;
    private readonly canvasWidth: number;
    private readonly minFallSpeed = 100;
    private readonly maxFallSpeed = 300;
    private wiggleTimer: Phaser.Time.TimerEvent;
    private wiggleDirection: number = 1;
    
    constructor(scene: Scene, x: number, y: number, texture: string, type: ChickenType, canvasWidth: number) {
        super(scene, x, y, texture);
        
        this.chickenType = type;
        this.canvasWidth = canvasWidth;
        
        // Randomize fall speed within a range
        this.fallSpeed = Phaser.Math.Between(this.minFallSpeed, this.maxFallSpeed);
        
        // Add sprite to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set falling velocity
        this.setVelocityY(this.fallSpeed);
        
        // Scale the egg sprite if needed
        this.setScale(0.8);
        
        // Adjust bounding box if needed
        this.setSize(this.width * 0.8, this.height * 0.8);
        
        // Add a slight rotation for visual effect
        this.setAngularVelocity(Phaser.Math.Between(-20, 20));
        
        // Add wiggle effect
        this.setupWiggleEffect();
    }
    
    /**
     * Sets up a wiggle effect for the egg as it falls
     */
    private setupWiggleEffect(): void {
        // Create a wiggle timer that changes direction every 300-500ms
        const wiggleInterval = Phaser.Math.Between(300, 500);
        
        this.wiggleTimer = this.scene.time.addEvent({
            delay: wiggleInterval,
            callback: this.changeWiggleDirection,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * Changes the wiggle direction
     */
    private changeWiggleDirection(): void {
        this.wiggleDirection *= -1;
        
        // Apply a small horizontal velocity for wiggle effect
        const wiggleStrength = Phaser.Math.Between(15, 25);
        this.setVelocityX(wiggleStrength * this.wiggleDirection);
    }
    
    update(): void {
        // Check if egg has fallen off-screen
        if (this.y > this.scene.cameras.main.height + 50) {
            this.destroy();
        }
        
        // Apply a slight wobble effect
        const wobbleAmount = Math.sin(this.scene.time.now / 100) * 0.5;
        this.setScale(0.8 - wobbleAmount * 0.05, 0.8 + wobbleAmount * 0.05);
    }
    
    getChickenType(): ChickenType {
        return this.chickenType;
    }
    
    destroy(fromScene?: boolean): void {
        // Clean up timer when egg is destroyed
        if (this.wiggleTimer) {
            this.wiggleTimer.destroy();
        }
        
        super.destroy(fromScene);
    }
}
