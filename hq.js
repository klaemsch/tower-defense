class HQ extends Structure {

    constructor(scene) {
        const col = Math.floor(COLS / 2);
        const row = Math.floor(ROWS / 2);
        super(scene, col, row, 'HQ', config.hq.color, config.hq.label, config.hq.health);  // call parent "Structure"

    }

    destroy(fromScene) {
        this.scene.triggerGameOver();
        // do not call super.destroy(fromScene); - this would destroy the HQ, i currently like it in the background of the Game Over Screen
    }
}

function registerHQFactory() {
    Phaser.GameObjects.GameObjectFactory.register(
        'hq',
        function () {
            const hq = new HQ(this.scene);
            return hq;
        },
    );
}

registerHQFactory();
