class Tower extends Structure {
    #attackTimer = 0;
    #radiusVisual;
    #radius;
    #radiusInPixel;

    constructor(scene, col, row) {
        super(scene, col, row, 'tower', config.tower.color, config.tower.label, config.tower.health);  // call parent "Structure"

        this.fireRateMs = config.tower.fireRateMs;

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
        // TODO: check if im right: delta is the time in milliseconds since the last preUpdate call, right?
        this.#attackTimer += delta;
        if (this.#attackTimer >= this.fireRateMs) {
            this.#attackTimer -= this.fireRateMs;
            // TODO: maybe use the function here:
            // const target = this.scene.enemyManager.getClosestEnemy(this.pixelX, this.pixelX, this.#radiusInPixel);
            const target = this.#findClosestEnemy();
            if (target) this.scene.add.bullet(this, target, config.tower.bulletSpeed, config.tower.bulletDamage);
        }
    }

    // TODO: move this to the enemy manager or use enemy manager
    #findClosestEnemy() {
        let closestEnemy = null, closestDistance = Infinity;
        this.scene.enemyManager.enemies.getChildren().forEach((entry) => {
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
        // TODO: move cost check from children to structure.js
        const woodCount = this.scene.registry.get(config.resources.wood.registryKey);
        if (woodCount >= config.tower.cost) {
            this.scene.registry.inc(config.resources.wood.registryKey, -config.tower.cost);
            const tower = new Tower(this.scene, col, row);
            return tower;
        }
        return null;
    }
);
