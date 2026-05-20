class WoodShop extends Structure {
    #lastHarvest;
    #harvestRateMs;
    #radiusVisual;
    #radius;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        this.#radius = structureConfig.radiusInTiles;

        this.#lastHarvest = 0;
        this.#harvestRateMs = structureConfig.harvestRateMs;

        this.#createRadiusVisual();
    }

    #createRadiusVisual() {
        const tileSize = config.world.tileSize;

        // Radius overlay
        this.#radiusVisual = this.scene.add.graphics().setDepth(0);
        this.#radiusVisual.lineStyle(1, 0xa8dadc, 0.25);
        this.#radiusVisual.strokeRect(
            (this.col - this.#radius) * tileSize,
            (this.row - this.#radius) * tileSize,
            (this.#radius * 2 + 1) * tileSize,
            (this.#radius * 2 + 1) * tileSize,
        );
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // returns the number of trees in radius
    #countTreesInRadius() {
        let treeCount = 0;
        structureMap.forEach((entry) => {
            if (entry.type !== 'tree') return;
            //console.log('found tree at', entry.pixelX, entry.pixelY);
            const dist = Math.max(
                Math.abs(entry.col - this.col),
                Math.abs(entry.row - this.row),
            );
            if (dist <= this.#radius) treeCount++;
        });
        //console.log('found', count, 'trees in radius')
        return treeCount;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    preUpdate(time, delta) {
        if (time > this.#lastHarvest + this.#harvestRateMs) {
            this.#lastHarvest = time;
            const treeCount = this.#countTreesInRadius();
            this.produce(config.resources.wood.registryKey, config.resources.wood.label, treeCount);
        }
    }

    destroy(fromScene) {
        this.#radiusVisual.destroy();
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'woodShop',
    function (col, row) {
        return Structure.create(this.scene, col, row, config.structures.woodShop, WoodShop);
    }
);