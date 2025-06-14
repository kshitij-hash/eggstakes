import { Scene } from 'phaser';
import { Egg } from '../entities/Egg';
import { ChickenType } from '../entities/Chicken';

export class EggSpawner {
    private scene: Scene;
    private eggGroup: Phaser.Physics.Arcade.Group;
    private spawnTimer: Phaser.Time.TimerEvent | null = null;
    private readonly minSpawnInterval: number = 1000;
    private readonly maxSpawnInterval: number = 3000;
    private readonly spawnY: number = 50;
    private readonly canvasWidth: number;
    private readonly zoneWidth: number;
    private isActive: boolean = false;
    
    constructor(scene: Scene, canvasWidth: number) {
        this.scene = scene;
        this.canvasWidth = canvasWidth;
        this.zoneWidth = canvasWidth / 2;
        
        // Create physics group for eggs
        this.eggGroup = scene.physics.add.group({
            classType: Egg,
            runChildUpdate: true
        });
    }
    
    start(): void {
        this.isActive = true;
        this.scheduleNextSpawn();
    }
    
    stop(): void {
        this.isActive = false;
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }
    }
    
    private scheduleNextSpawn(): void {
        if (!this.isActive) return;
        
        // Random delay between min and max interval
        const delay = Phaser.Math.Between(this.minSpawnInterval, this.maxSpawnInterval);
        
        this.spawnTimer = this.scene.time.delayedCall(delay, () => {
            this.spawnEggs();
            this.scheduleNextSpawn();
        });
    }
    
    private spawnEggs(): void {
        if (!this.isActive) return;
        
        // Spawn one egg for Chicken A (left zone)
        this.spawnEgg(ChickenType.CHICKEN_A);
        
        // Spawn one egg for Chicken B (right zone)
        this.spawnEgg(ChickenType.CHICKEN_B);
    }
    
    private spawnEgg(chickenType: ChickenType): void {
        // Determine spawn position based on chicken type
        let x: number;
        
        if (chickenType === ChickenType.CHICKEN_A) {
            // Left zone (10% to 90% of left zone width)
            x = Phaser.Math.Between(this.zoneWidth * 0.1, this.zoneWidth * 0.9);
        } else {
            // Right zone (10% to 90% of right zone width)
            x = Phaser.Math.Between(this.zoneWidth + (this.zoneWidth * 0.1), this.canvasWidth - (this.zoneWidth * 0.1));
        }
        
        // Create egg at the position
        const egg = new Egg(this.scene, x, this.spawnY, 'egg', chickenType, this.canvasWidth);
        this.eggGroup.add(egg);
    }
    
    getEggGroup(): Phaser.Physics.Arcade.Group {
        return this.eggGroup;
    }
    
    clearEggs(): void {
        this.eggGroup.clear(true, true);
    }
}
