import { Scene } from 'phaser';

export enum ChickenType {
    CHICKEN_A = 'chickenA',
    CHICKEN_B = 'chickenB'
}

export class Chicken extends Phaser.Physics.Arcade.Sprite {
    private readonly chickenType: ChickenType;
    private readonly moveSpeed: number = 200;
    private readonly zoneWidth: number;
    private readonly canvasWidth: number;
    private targetX: number | null = null;
    private readonly catchDistance: number = 5;
    private readonly catchLineY: number;
    private isPecking: boolean = false;
    private peckingTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Scene, x: number, y: number, texture: string, type: ChickenType, canvasWidth: number) {
        super(scene, x, y, texture);
        
        this.chickenType = type;
        this.canvasWidth = canvasWidth;
        this.zoneWidth = canvasWidth / 2;
        
        // Set the catch line slightly above the chicken's position
        this.catchLineY = y - 20;
        
        // Add sprite to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set boundaries for movement
        const minX = this.chickenType === ChickenType.CHICKEN_A ? 0 : this.zoneWidth;
        const maxX = this.chickenType === ChickenType.CHICKEN_A ? this.zoneWidth : this.canvasWidth;
        
        // Set collision with world bounds
        this.setCollideWorldBounds(true);
        
        // Adjust bounding box if needed
        this.setSize(this.width * 0.8, this.height * 0.8);
        
        // Set origin to bottom center for better positioning
        this.setOrigin(0.5, 1);
        
        // Listen for egg catch events
        scene.events.on('egg-caught', this.onEggCaught, this);
    }
    
    update(eggs: Phaser.Physics.Arcade.Group): void {
        // If pecking, don't move
        if (this.isPecking) {
            return;
        }
        
        // Find closest egg in the chicken's zone
        const closestEgg = this.findClosestEgg(eggs);
        
        if (closestEgg) {
            this.targetX = closestEgg.x;
            
            // Move towards target
            this.moveTowardsTarget();
        } else {
            // No eggs to catch, stop moving
            this.setVelocityX(0);
            this.targetX = null;
        }
        
        // Add a slight bobbing motion when moving
        if (this.body && Math.abs(this.body.velocity.x) > 0) {
            const bobAmount = Math.sin(this.scene.time.now / 150) * 0.05;
            this.setScale(1 + bobAmount, 1 - bobAmount);
        } else {
            this.setScale(1, 1);
        }
    }
    
    /**
     * Triggered when an egg is caught
     */
    private onEggCaught(data: { chickenType: ChickenType, x: number, y: number }): void {
        // Only react if this is the chicken that caught the egg
        if (data.chickenType === this.chickenType) {
            this.doPeckingAnimation();
        }
    }
    
    /**
     * Performs a pecking animation
     */
    private doPeckingAnimation(): void {
        // Set pecking state
        this.isPecking = true;
        
        // Stop horizontal movement
        this.setVelocityX(0);
        
        // Visual pecking effect - scale down vertically and up horizontally
        this.scene.tweens.add({
            targets: this,
            scaleY: 0.7,
            scaleX: 1.3,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                // Reset scale
                this.setScale(1, 1);
                
                // End pecking state after a short delay
                if (this.peckingTimer) {
                    this.peckingTimer.destroy();
                }
                
                this.peckingTimer = this.scene.time.delayedCall(200, () => {
                    this.isPecking = false;
                    this.peckingTimer = null;
                });
            }
        });
    }
    
    private findClosestEgg(eggs: Phaser.Physics.Arcade.Group): Phaser.Physics.Arcade.Sprite | null {
        let closestEgg: Phaser.Physics.Arcade.Sprite | null = null;
        let closestDistance = Number.MAX_VALUE;
        
        eggs.getChildren().forEach((egg: Phaser.GameObjects.GameObject) => {
            const eggSprite = egg as Phaser.Physics.Arcade.Sprite;
            
            // Check if egg is in the same zone as the chicken
            const isInZone = this.isEggInChickenZone(eggSprite);
            
            if (isInZone) {
                const distance = Math.abs(eggSprite.x - this.x);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEgg = eggSprite;
                }
            }
        });
        
        return closestEgg;
    }
    
    private isEggInChickenZone(egg: Phaser.Physics.Arcade.Sprite): boolean {
        if (this.chickenType === ChickenType.CHICKEN_A) {
            return egg.x < this.zoneWidth;
        } else {
            return egg.x >= this.zoneWidth;
        }
    }
    
    private moveTowardsTarget(): void {
        if (this.targetX === null) return;
        
        const distance = this.targetX - this.x;
        
        // Stop when within catch distance
        if (Math.abs(distance) <= this.catchDistance) {
            this.setVelocityX(0);
            return;
        }
        
        // Move left or right
        const direction = distance > 0 ? 1 : -1;
        this.setVelocityX(direction * this.moveSpeed);
        
        // Flip sprite based on direction
        this.setFlipX(direction < 0);
    }
    
    getChickenType(): ChickenType {
        return this.chickenType;
    }
    
    getCatchLineY(): number {
        return this.catchLineY;
    }
    
    destroy(fromScene?: boolean | undefined): void {
        // Clean up event listeners
        if (this.scene) {
            this.scene.events.off('egg-caught', this.onEggCaught, this);
        }
        
        // Clean up timer
        if (this.peckingTimer) {
            this.peckingTimer.destroy();
        }
        
        super.destroy(fromScene);
    }
}
