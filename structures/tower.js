class Tower extends Structure {
    #attackAccumulator = 0;
    #findClosestEnemyFunc
    #enemyManager;

    #onBulletArriveFunc;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        this.#enemyManager = this.scene.registry.get(globalConfig.registryKeys.enemyManager);

        this.#findClosestEnemyFunc = this.config.radiusType === RadiusType.Circular
            ? this.#findClosestEnemyInCircRadius
            : this.#findClosestEnemyInRectRadius;
    }

    preUpdate(time, delta) {
        delta = delta * this.scene.time.timeScale;  // TODO check if this works
        // TODO: currently the tower only looks for enemies every fireRateMs
        // TODO: tower kills the last enemy in range, tower looks for new enemy -> no in range
        // enemy comes into range, tower only fires after fireRateMs, even if the last shot was way before that
        // TODO: it might be an idea to look for enemies every preUpdate
        this.#attackAccumulator += delta;
        if (this.#attackAccumulator >= this.config.fireRateMs) {
            this.#attackAccumulator -= this.config.fireRateMs;
            // TODO: maybe use the function here:
            // const target = this.#enemyManager.getClosestEnemy(this.pixelX, this.pixelX, this.#radiusInPixel);
            const target = this.#findClosestEnemyFunc();
            if (target) {

                // create a bullet with target, speed, damage and onArrive
                this.scene.add.bullet(
                    this, target,
                    this.config.bulletSpeed,
                    this.config.bulletDamage,
                    this.#onBulletArriveFunc
                );
            }
        }
    }

    onUpgradeChange() {
        console.log('tower onUpgradeChange');

        // check if there is a freeze upgrade
        const freezeUpgrade = [...this.upgrades].find(
            u => u.internalType === 'freeze' && u.effectTimeInMs > 0
        );

        // if there is, change the onArrive to stun
        if (freezeUpgrade) {
            this.#onBulletArriveFunc = (t, dmg) => {
                if (t && !t.isDestroyed) {
                    if (Math.random() < freezeUpgrade.effectChance) t.stun(freezeUpgrade.effectTimeInMs, dmg);
                }
            }
        } else {
            this.#onBulletArriveFunc = undefined;
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
            if (dist <= this.config.radiusInTiles * globalConfig.world.tileSize && dist < closestDistance) {
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
            if (dx <= this.config.radiusInTiles && dy <= this.config.radiusInTiles && euclDist < closestDistance) {
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
