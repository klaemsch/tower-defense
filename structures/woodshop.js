class WoodShop extends Structure {
    #lastHarvest;
    #harvestRateMs;
    #radius;
    #treesInRadius;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        this.#radius = structureConfig.radiusInTiles;

        this.#lastHarvest = 0;
        this.#harvestRateMs = structureConfig.harvestRateMs;

        this.#treesInRadius = this.#countTreesInRadius();
    }

    // returns the number of trees in radius
    #countTreesInRadius() {
        const adjacentTrees = structureStorage.getStructuresInRange(
            this.col, this.row, this.#radius, s => s.type === 'tree'
        );
        //console.log('found', adjacentTrees.length, 'trees in radius');
        return adjacentTrees.length;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    moveTo(col, row) {
        super.moveTo(col, row);
        this.#treesInRadius = this.#countTreesInRadius();
    }

    preUpdate(time, delta) {
        if (time > this.#lastHarvest + this.#harvestRateMs) {
            this.#lastHarvest = time;
            this.produce(config.resources.wood.registryKey, config.resources.wood.label, this.#treesInRadius);
        }
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'woodShop',
    function (col, row) {
        return Structure.create(this.scene, col, row, config.structures.woodShop, WoodShop);
    }
);