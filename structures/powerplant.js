class PowerPlant extends Structure {
    #harvestAccumulator;

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);

        // every preUpdate call the delta since the last update gets added to harvestAccumulator
        // if it falls below the harvestRateMs threshold -> harvest 
        this.#harvestAccumulator = 0;
    }

    // TODO: move this to base class?
    calculateProductionAmount() {
        if (this.upgrades.size > 0) {
            let multiplier = 0;
            this.upgrades.forEach((upgrade) => {
                if (upgrade.multiplier) {
                    multiplier += upgrade.multiplier;
                }
            });
            if (multiplier != 0) return this.config.baseProductionPerRate * multiplier;
        }
        return this.config.baseProductionPerRate;
    }

    produceHook(time, delta) {
        const cfg = this.config;
        this.convert(
            cfg.productionCostResourceRegistryKey,
            cfg.baseCostPerRate,
            globalConfig.resources.energy.registryKey,
            this.calculateProductionAmount(),
            globalConfig.resources.energy.label
        )
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
