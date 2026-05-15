class Structure extends Phaser.GameObjects.GameObject {
    #health;
    #gfx;
    #labelElement;
    #healthElement;

    constructor(scene, col, row, type, color, label, health) {
        super(scene, type);

        this.col = col;
        this.row = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.size = config.world.tileSize;
        this.color = color;
        this.label = label;

        this.#health = health;
        this.attackable = true;

        // Internal Graphics object that does the actual drawing
        this.#gfx = scene.add.graphics();

        // Draw once at spawn position
        this.#draw(scene);

        // Register in the shared structure map (pass `this` as the owner ref)
        placeInMap(col, row, this);

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);
    }

    preUpdate() { }

    // TODO: maybe return the created elements (gfx, label), set them in the call to this function and destroy them later
    // analog to woodshop.js createVisuals
    #draw(scene) {
        this.#gfx.clear();

        const rect = new Phaser.Geom.Rectangle(this.pixelX - this.size / 2, this.pixelY - this.size / 2, this.size, this.size);
        this.#gfx.fillStyle(this.color, 1);
        this.#gfx.fillRectShape(rect);

        this.#labelElement = scene.add.text(this.pixelX, this.pixelY - 10, this.label, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.#healthElement = scene.add.text(this.pixelX, this.pixelY + 10, this.#health, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    destroy(fromScene) {
        console.log('structure of type', this.type, 'was destroyed')

        // TEST TEST TEST
        const key = gridKey(this.col, this.row);
        structureMap.delete(key);

        this.#gfx.destroy();
        this.#labelElement.destroy();
        this.#healthElement.destroy();
        super.destroy(fromScene);
    }

    // applies the damage (amount) to this structure
    // returns true if destroyed (and destroys itself)
    // returns false if not destroyed but damaged
    doDamage(amount) {
        this.#health -= amount;
        if (this.#health <= 0) {
            this.destroy();
            return true;
        } else {
            this.#healthElement.text = this.#health;
            return false;
        }
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'structure',
    function (col, row, type, color, label, health) {
        // TODO: check for costs here
        const structure = new Structure(this.scene, col, row, type, color, label, health);
        return structure;
    }
);
