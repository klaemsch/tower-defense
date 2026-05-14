class Tree extends Phaser.GameObjects.GameObject {

    constructor(scene, col, row) {
        super(scene, 'tree');   // type string used by Phaser internally

        this.col = col;
        this.row = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.size = 40;
        this.color = 0x8AC57F;

        this.attackable = false;

        // Internal Graphics object that does the actual drawing
        this._gfx = scene.add.graphics();

        // Draw once at spawn position
        this._draw();

        // Register in the shared structure map (pass `this` as the owner ref)
        placeInMap(col, row, this);
    }

    _draw() {
        const gfx = this._gfx;
        gfx.clear();

        // Main filled triangle
        var triangle = Phaser.Geom.Triangle.BuildEquilateral(this.pixelX, this.pixelY - this.size / 2 + 3, this.size);
        gfx.fillStyle(this.color, 1);
        gfx.fillTriangleShape(triangle);
    }

    destroy(fromScene) {
        this._gfx.destroy();
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
