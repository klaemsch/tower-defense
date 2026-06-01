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

    preUpdate(time, delta) {
        this.#harvestAccumulator += delta;
        if (this.#harvestAccumulator >= this.#harvestRateMs) {
            this.#harvestAccumulator -= this.#harvestRateMs;
            if (this.scene.registry.get(globalConfig.resources.wood.registryKey) > 0) {
                this.scene.registry.inc(globalConfig.resources.wood.registryKey, -1);
                this.produce(globalConfig.resources.energy.registryKey, globalConfig.resources.energy.label, 1);
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
        return Structure.create(this.scene, col, row, globalConfig.structures.powerPlant, PowerPlant);
    }
);
