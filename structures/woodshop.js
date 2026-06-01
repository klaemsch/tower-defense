class WoodShop extends Structure {
    #harvestAccumulator;
    #harvestRateMs;
    #radius;
    #treesInRadius;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        this.#radius = structureConfig.radiusInTiles;

        // every preUpdate call the delta since the last update gets added to harvestAccumulator
        // if it falls below the harvestRateMs threshold -> harvest 
        this.#harvestAccumulator = 0;
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
        this.#harvestAccumulator += delta;
        if (this.#harvestAccumulator >= this.#harvestRateMs) {
            this.#harvestAccumulator -= this.#harvestRateMs;
            this.produce(globalConfig.resources.wood.registryKey, globalConfig.resources.wood.label, this.#treesInRadius);
        }
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'woodShop',
    function (col, row) {
        return Structure.create(this.scene, col, row, globalConfig.structures.woodShop, WoodShop);
    }
);