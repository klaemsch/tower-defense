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

                // calculate angle between this and target
                const angle = Phaser.Math.Angle.Between(this.pixelX, this.pixelY, target.pixelX, target.pixelY);
                // Sprite's "forward" is north (-90°), so offset by 90°
                this.image.setRotation(angle + Math.PI / 2);

                // create a bullet with target, speed, damage and onArrive
                this.scene.add.bullet(
                    this, target,
                    this.config.bulletConfig,
                    this.#onBulletArriveFunc
                );
            }
        }
    }

    onUpgradeChange() {
        //console.log('tower onUpgradeChange');

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

    // uses enemy manager to find closest enemy
    // checks if the enemy is in circular range/radius and returns it
    // if not in range or no enemy found, returns null
    #findClosestEnemyInCircRadius() {
        // get closest enemy and distance to it
        const closest = this.#enemyManager.getClosestEnemy(this.pixelX, this.pixelY);

        // calculate squared radius of tower
        const radiusInPixel = this.config.radiusInTiles * globalConfig.world.tileSize;
        const squaredRadiusInPixel = radiusInPixel ** 2;

        // check if squared distance is in range
        if (closest.enemy && closest.squaredDist <= squaredRadiusInPixel) {
            return closest.enemy;
        }
        return null
    }

    // uses enemy manager to find closest enemy
    // checks if the enemy is in rectangular range/radius and returns it
    // if not in range or no enemy found, returns null
    #findClosestEnemyInRectRadius() {
        // get closest enemy and distance to it
        const closest = this.#enemyManager.getClosestEnemy(this.pixelX, this.pixelY);
        if (!closest.enemy) return null;

        const dx = Math.abs(closest.enemy.gridX - this.col);
        const dy = Math.abs(closest.enemy.gridY - this.row);
        if (dx <= this.config.radiusInTiles && dy <= this.config.radiusInTiles) {
            return closest.enemy
        }

        return null;
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
