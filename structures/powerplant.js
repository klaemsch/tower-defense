class PowerPlant extends Structure {

    constructor(scene, col, row, structureConfig) {
        super(scene, col, row, structureConfig);
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
