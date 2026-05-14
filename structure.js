class Structure extends Phaser.GameObjects.GameObject {

    constructor(scene, col, row, type, color, label, health = 200) {
        super(scene, type);

        this.col = col;
        this.row = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.size = 40;
        this.color = color;
        this.label = label;

        this.health = health;
        this.attackable = true;

        // Internal Graphics object that does the actual drawing
        this._gfx = scene.add.graphics();

        // Draw once at spawn position
        this._draw(scene);

        // Register in the shared structure map (pass `this` as the owner ref)
        placeInMap(col, row, this);
    }

    _draw(scene) {
        const gfx = this._gfx;
        gfx.clear();

        const rect = new Phaser.Geom.Rectangle(this.pixelX - this.size / 2, this.pixelY - this.size / 2, this.size, this.size);
        gfx.fillStyle(this.color, 1);
        gfx.fillRectShape(rect);

        this.labelElement = scene.add.text(this.pixelX, this.pixelY, this.label, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    destroy(fromScene) {
        this._gfx.destroy();
        this.labelElement.destroy();
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'structure',
    function (col, row, type, color, label) {
        const structure = new Structure(this.scene, col, row, type, color, label);
        return structure;
    }
);
