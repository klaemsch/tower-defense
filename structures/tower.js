class Tower extends Structure {
    #attackTimer = 0;
    #radius;
    #radiusInPixel;
    #radiusType;
    #findClosestEnemyFunc
    #bulletDamage;
    #bulletSpeed;

    #enemyManager;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        this.fireRateMs = structureConfig.fireRateMs;

        this.#radius = structureConfig.radiusInTiles;
        this.#radiusInPixel = this.#radius * config.world.tileSize;
        this.#radiusType = structureConfig.radiusType;
        this.#bulletDamage = structureConfig.bulletDamage;
        this.#bulletSpeed = structureConfig.bulletSpeed;

        this.#enemyManager = this.scene.registry.get(config.registryKeys.enemyManager);

        this.#findClosestEnemyFunc = this.#radiusType === RadiusType.Circular
            ? this.#findClosestEnemyInCircRadius
            : this.#findClosestEnemyInRectRadius;
    }

    preUpdate(time, delta) {
        // TODO: check if im right: delta is the time in milliseconds since the last preUpdate call, right?
        this.#attackTimer += delta;
        if (this.#attackTimer >= this.fireRateMs) {
            this.#attackTimer -= this.fireRateMs;
            // TODO: maybe use the function here:
            // const target = this.#enemyManager.getClosestEnemy(this.pixelX, this.pixelX, this.#radiusInPixel);
            const target = this.#findClosestEnemyFunc();
            if (target) this.scene.add.bullet(this, target, this.#bulletSpeed, this.#bulletDamage);
        }
    }

    // TODO: move this to the enemy manager or use enemy manager
    #findClosestEnemyInCircRadius() {
        let closestEnemy = null, closestDistance = Infinity;
        this.#enemyManager.enemies.getChildren().forEach((enemy) => {
            if (enemy.type !== 'enemy') return;
            const dx = enemy.pixelX - this.pixelX;
            const dy = enemy.pixelY - this.pixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.#radiusInPixel && dist < closestDistance) {
                closestDistance = dist;
                closestEnemy = enemy;
            }
        });
        return closestEnemy;
    }

    // TODO: move this to the enemy manager or use enemy manager
    #findClosestEnemyInRectRadius() {
        let closestEnemy = null, closestDistance = Infinity;
        this.#enemyManager.enemies.getChildren().forEach((enemy) => {
            const dx = Math.abs(enemy.gridX - this.col);
            const dy = Math.abs(enemy.gridY - this.row);
            const euclDist = Math.sqrt(dx * dx + dy * dy);
            if (dx <= this.#radius && dy <= this.#radius && euclDist < closestDistance) {
                closestDistance = euclDist;
                closestEnemy = enemy;
            }
        });
        return closestEnemy;
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'tower',
    function (col, row, structureConfig) {
        return Structure.create(this.scene, col, row, structureConfig, Tower);
    }
);
