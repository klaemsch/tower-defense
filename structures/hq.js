class HQ extends Structure {

    constructor(scene, _row, _col, structureConfig) {
        // override given row and col to place HQ in the middle of the map
        const col = Math.floor(config.world.numCols / 2);
        const row = Math.floor(config.world.numRows / 2);
        super(scene, col, row, structureConfig);  // call parent "Structure"

    }

    destroy(fromScene) {
        this.scene.game.events.emit(config.eventKeys.gameOver);
        // do not call super.destroy(fromScene); - this would destroy the HQ, i currently like it in the background of the Game Over Screen
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'hq',
    function () {
        return Structure.create(this.scene, 0, 0, config.structures.hq, HQ);
    }
);