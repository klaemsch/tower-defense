class Tree extends Phaser.GameObjects.GameObject {
    #gfx;

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

        // Internal Graphics object that does the actual drawing
        this.#gfx = scene.add.graphics();

        // Draw once at spawn position
        this.#draw();

        // Register in the shared structure map (pass `this` as the owner ref)
        structureStorage.place(col, row, this);
    }

    #draw() {
        this.#gfx.clear();

        // Main filled triangle
        var triangle = Phaser.Geom.Triangle.BuildEquilateral(this.pixelX, this.pixelY - this.size / 2 + 3, this.size);
        this.#gfx.fillStyle(this.color, 1);
        this.#gfx.fillTriangleShape(triangle);
    }

    destroy(fromScene) {
        this.#gfx.destroy();
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
