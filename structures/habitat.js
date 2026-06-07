class Habitat extends Structure {

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);
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

    produceHook(_time, _delta) {
        this.produce(globalConfig.resources.villager.registryKey, globalConfig.resources.villager.label, 1);
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'habitat',
    function (col, row) {
        return Structure.create(this.scene, col, row, globalConfig.items.habitat, Habitat);
    }
);
