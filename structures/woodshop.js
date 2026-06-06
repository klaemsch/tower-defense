class WoodShop extends Structure {
    #radius;
    #productionAmount = 0;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        this.#radius = structureConfig.radiusInTiles;

        // every preUpdate call the delta since the last update gets added to harvestAccumulator
        // if it falls below the harvestRateMs threshold -> harvest 
        this.#recalculateProductionAmount();
    }

    // returns the number of trees in radius
    #countTreesInRadius() {
        const adjacentTrees = structureStorage.getStructuresInRange(
            this.col, this.row, this.#radius, s => s.type === 'tree'
        );
        //console.log('found', adjacentTrees.length, 'trees in radius');
        return adjacentTrees.length;
    }

    // check structures multipliers and return multiplier value
    // if no multiplier found, return 1
    #calculateUpgradeMultiplier() {
        let multiplier = 0;
        console.log(this.upgrades)
        this.upgrades.forEach((upgrade) => {
            if (upgrade.multiplier) {
                multiplier += upgrade.multiplier;
            }
        });
        return multiplier > 0 ? multiplier : 1;
    }

    #recalculateProductionAmount() {
        const treeCount = this.#countTreesInRadius();
        const multiplier = this.#calculateUpgradeMultiplier();
        console.log('recalculateProductionAmount', treeCount, multiplier);
        this.#productionAmount = treeCount * multiplier;
    }

    onUpgradeChange() {
        console.log('onUpgradeChange')
        this.#recalculateProductionAmount();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    moveTo(col, row) {
        super.moveTo(col, row);
        this.#recalculateProductionAmount();
    }

    produceHook(time, delta) {
        delta = delta * this.scene.time.timeScale;  // TODO check if this works
        this.produce(globalConfig.resources.wood.registryKey, globalConfig.resources.wood.label, this.#productionAmount);
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'woodShop',
    function (col, row) {
        return Structure.create(this.scene, col, row, globalConfig.items.woodShop, WoodShop);
    }
);