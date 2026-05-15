class Tower extends Structure {
    #lastFired;
    #radiusVisual;
    #radius;
    #radiusInPixel;

    constructor(scene, col, row) {
        super(scene, col, row, 'tower', config.tower.color, config.tower.label, config.tower.health);  // call parent "Structure"

        this.fireRateMs = config.tower.fireRateMs;
        this.#lastFired = 0;

        this.#radius = config.tower.radiusInTiles;
        this.#radiusInPixel = this.#radius * config.world.tileSize;

        this.#createRadiusVisual();
    }

    #createRadiusVisual() {
        const tileSize = config.world.tileSize;

        // Radius overlay
        this.#radiusVisual = this.scene.add.graphics().setDepth(0);
        this.#radiusVisual.lineStyle(1, 0xa8dadc, 0.25);
        this.#radiusVisual.strokeCircle(this.pixelX, this.pixelY, this.#radiusInPixel);
    }

    preUpdate(time, delta) {
        // TODO: instead of saving the time (might overflow at some point) use delta (time since last preUpdate call i guess)
        /**
         * 
         *  this.#attackTimer += delta;
        if (this.#attackTimer >= ENEMY_ATTACK_RATE) {
            this.#attackTimer -= ENEMY_ATTACK_RATE;
         */
        if (time > this.#lastFired + this.fireRateMs) {
            this.#lastFired = time;
            const target = this.#findClosestEnemy();
            // TODO: maybe use the function here:
            // const target = this.scene.enemyManager.getClosestEnemy(this.pixelX, this.pixelX, this.#radiusInPixel);
            if (target) this.scene.add.bullet(this, target, config.tower.bulletSpeed, config.tower.bulletDamage);
        }
    }

    #findClosestEnemy() {
        let closestEnemy = null, closestDistance = Infinity;
        this.scene.enemyManager.enemies.forEach((entry) => {
            if (entry.type !== 'enemy') return;
            const dx = entry.pixelX - this.pixelX;
            const dy = entry.pixelY - this.pixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.#radiusInPixel && dist < closestDistance) {
                closestDistance = dist;
                closestEnemy = entry;
            }
        });
        return closestEnemy;
    }

    destroy(fromScene) {
        this.#radiusVisual.destroy();
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'tower',
    function (col, row) {
        // TODO: move cost check to children -> structure.js
        const woodCount = this.scene.registry.get(config.resources.wood.registryKey);
        if (woodCount >= config.tower.cost) {
            this.scene.registry.inc(config.resources.wood.registryKey, -config.tower.cost);
            const tower = new Tower(this.scene, col, row);
            return tower;
        }
        return null;
    }
);
