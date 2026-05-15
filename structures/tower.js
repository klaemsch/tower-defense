class Tower extends Structure {
    #lastFired;

    constructor(scene, col, row) {
        super(scene, col, row, 'tower', config.tower.color, config.tower.label, config.tower.health);  // call parent "Structure"

        this.fireRateMs = config.tower.fireRateMs;
        this.#lastFired = 0;

        this.radius = config.tower.radiusInTiles * config.world.tileSize;
    }

    preUpdate(time, delta) {
        if (time > this.#lastFired + this.fireRateMs) {
            this.#lastFired = time;
            const target = this.#findClosestEnemy();
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
            if (dist <= this.radius && dist < closestDistance) {
                closestDistance = dist;
                closestEnemy = entry;
            }
        });
        return closestEnemy;
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
