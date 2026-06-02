class PowerPlant extends Structure {
    #harvestAccumulator;
    #harvestRateMs;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        // every preUpdate call the delta since the last update gets added to harvestAccumulator
        // if it falls below the harvestRateMs threshold -> harvest 
        this.#harvestAccumulator = 0;
        this.#harvestRateMs = structureConfig.harvestRateMs;
    }

    calculateProductionAmount() {
        if (this.upgrades.size > 0) {
            let multiplier = 0;
            this.upgrades.forEach((upgrade) => {
                if (upgrade.muliplier) {
                    multiplier += upgrade.muliplier;
                }
            });
            if (multiplier != 0) return this.config.baseProductionPerRate * multiplier;
        }
        return this.config.baseProductionPerRate;
    }

    preUpdate(time, delta) {
        this.#harvestAccumulator += delta;
        if (this.#harvestAccumulator >= this.#harvestRateMs) {
            this.#harvestAccumulator -= this.#harvestRateMs;
            if (this.scene.registry.get(this.config.productionCostResourceRegistryKey) >= this.config.baseCostPerRate) {
                this.scene.registry.inc(this.config.productionCostResourceRegistryKey, -this.config.baseCostPerRate);
                this.produce(globalConfig.resources.energy.registryKey, globalConfig.resources.energy.label, this.calculateProductionAmount());
            }
        }
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'powerPlant',
    function (col, row) {
        return Structure.create(this.scene, col, row, globalConfig.items.powerPlant, PowerPlant);
    }
);
