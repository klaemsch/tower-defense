class PowerPlant extends Structure {

    constructor(scene, col, row) {
        super(scene, col, row, 'powerPlant', config.powerPlant.color, config.powerPlant.label, config.powerPlant.health);
    }

    destroy(fromScene) {
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'powerPlant',
    function (col, row) {
        // TODO: move cost check from children to structure.js
        const woodCount = this.scene.registry.get(config.resources.wood.registryKey);
        if (woodCount >= config.powerPlant.cost) {
            this.scene.registry.inc(config.resources.wood.registryKey, -config.powerPlant.cost);
            const powerPlant = new PowerPlant(this.scene, col, row);
            return powerPlant;
        }
        return null;
    }
);
