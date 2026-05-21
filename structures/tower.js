class Tower extends Structure {
    #attackTimer = 0;
    #radiusVisual;
    #radius;
    #radiusInPixel;

    #enemyManager;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        this.fireRateMs = config.structures.tower.fireRateMs;

        this.#radius = config.structures.tower.radiusInTiles;
        this.#radiusInPixel = this.#radius * config.world.tileSize;

        this.#enemyManager = this.scene.registry.get(config.registryKeys.enemyManager);

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
        // TODO: check if im right: delta is the time in milliseconds since the last preUpdate call, right?
        this.#attackTimer += delta;
        if (this.#attackTimer >= this.fireRateMs) {
            this.#attackTimer -= this.fireRateMs;
            // TODO: maybe use the function here:
            // const target = this.#enemyManager.getClosestEnemy(this.pixelX, this.pixelX, this.#radiusInPixel);
            const target = this.#findClosestEnemy();
            if (target) this.scene.add.bullet(this, target, config.structures.tower.bulletSpeed, config.structures.tower.bulletDamage);
        }
    }

    // TODO: move this to the enemy manager or use enemy manager
    #findClosestEnemy() {
        let closestEnemy = null, closestDistance = Infinity;
        this.#enemyManager.enemies.getChildren().forEach((entry) => {
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
        return Structure.create(this.scene, col, row, config.structures.tower, Tower);
    }
);
