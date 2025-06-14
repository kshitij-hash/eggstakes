import { Scene } from 'phaser';
import { Chicken, ChickenType } from '../entities/Chicken';
import { Egg } from '../entities/Egg';

export class CollisionHandler {
    private scene: Scene;
    private scoreA: number = 0;
    private scoreB: number = 0;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    setupCollisions(chickenA: Chicken, chickenB: Chicken, eggGroup: Phaser.Physics.Arcade.Group): void {
        // Check for eggs that reached the catch line
        this.scene.events.on('update', () => {
            eggGroup.getChildren().forEach((egg: Phaser.GameObjects.GameObject) => {
                const eggSprite = egg as Egg;
                
                if (eggSprite.getChickenType() === ChickenType.CHICKEN_A) {
                    // Check if egg is at chickenA's catch line
                    if (eggSprite.y >= chickenA.getCatchLineY() && 
                        Math.abs(eggSprite.x - chickenA.x) <= 30) {
                        this.eggCaught(eggSprite, ChickenType.CHICKEN_A);
                    }
                } else {
                    // Check if egg is at chickenB's catch line
                    if (eggSprite.y >= chickenB.getCatchLineY() && 
                        Math.abs(eggSprite.x - chickenB.x) <= 30) {
                        this.eggCaught(eggSprite, ChickenType.CHICKEN_B);
                    }
                }
            });
        });
    }
    
    private eggCaught(egg: Egg, chickenType: ChickenType): void {
        // Play catch sound
        this.scene.sound.play('catch');

        // Update score based on which chicken caught the egg
        if (chickenType === ChickenType.CHICKEN_A) {
            this.scoreA++;
        } else {
            this.scoreB++;
        }
        
        // Emit score update event
        this.scene.events.emit('score-update', {
            chickenType,
            scoreA: this.scoreA,
            scoreB: this.scoreB
        });

        // Destroy the egg
        egg.destroy();
    }
    
    private createCatchEffect(x: number, y: number): void {
        // Create a simple particle effect when an egg is caught
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            quantity: 5
        });
        
        // Auto-destroy the particle emitter after it's done
        this.scene.time.delayedCall(300, () => {
            particles.destroy();
        });
    }
    
    getScoreA(): number {
        return this.scoreA;
    }
    
    getScoreB(): number {
        return this.scoreB;
    }
    
    resetScores(): void {
        this.scoreA = 0;
        this.scoreB = 0;
    }
}
