// TODO: put into structure subclass and rename into asteroid
// move stuff into config
class Tree extends Phaser.GameObjects.GameObject {
    #image;

    constructor(scene, col, row) {
        super(scene, 'tree');   // type string used by Phaser internally

        this.col = col;
        this.row = row;

        const pos = helper.gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.size = 40;
        this.color = 0x8AC57F;

        this.attackable = false;

        // Draw once at spawn position
        this.#image = this.scene.add.image(this.pixelX, this.pixelY, 'tree');

        // Register in the shared structure map (pass `this` as the owner ref)
        structureStorage.place(col, row, this);
    }

    destroy(fromScene) {
        this.#image.destroy();
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'tree',
    function (col, row) {
        const tree = new Tree(this.scene, col, row);
        return tree;
    }
);
