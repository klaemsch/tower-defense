class Tree extends Phaser.GameObjects.GameObject {
    #draw
    #graphics

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
        this.graphics = scene.add.graphics();

        // Draw once at spawn position
        this.draw();

        // Register in the shared structure map (pass `this` as the owner ref)
        placeInMap(col, row, this);
    }

    draw() {
        this.graphics.clear();

        // Main filled triangle
        var triangle = Phaser.Geom.Triangle.BuildEquilateral(this.pixelX, this.pixelY - this.size / 2 + 3, this.size);
        this.graphics.fillStyle(this.color, 1);
        this.graphics.fillTriangleShape(triangle);
    }

    destroy(fromScene) {
        this.graphics.destroy();
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
