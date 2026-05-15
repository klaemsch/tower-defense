const placerFactoryMap = {
    woodShop: (scene, col, row) => scene.add.woodShop(col, row),
    tower: (scene, col, row) => scene.add.tower(col, row),
};

class Placer {
    #scene;
    #hoverGraphics;
    #activeStructure;

    constructor(scene) {
        this.#scene = scene;
        this.#hoverGraphics = scene.add.graphics().setDepth(5);  // hover grid
        this.#activeStructure = null;

        // mouse listeners
        scene.input.on('pointermove', this.#onPointerMove, this);
        scene.input.on('pointerdown', this.#onPointerDown, this);

        // keyboard listeners
        const escKey = scene.input.keyboard.addKey("ESC");
        escKey.on("down", (event)  => {
           this.deselect();
        });
    }

    // ── Public ────────────────────────────────────────────────────────────────

    // selects a type of structure to be placed as string, e.g. 'tower'
    select(structureType) {
        this.#activeStructure = structureType;
        this.#scene.registry.set('placer-activeStructure', structureType);
    }

    // deselect type of structure
    deselect() {
        this.#activeStructure = null;
        this.#scene.registry.set('placer-activeStructure', null);
        this.#hoverGraphics.clear();
    }

    // try to place the currently selected structure type
    place(col, row) {
        if (!this.#activeStructure) return;
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        if (isCellOccupied(col, row)) return;

        const factory = placerFactoryMap[this.#activeStructure];
        if (!factory) { console.warn(`Unknown structure type: ${this.#activeStructure}`); return; }

        factory(this.#scene, col, row);

        this.deselect();
    }

    // ── Input handlers ────────────────────────────────────────────────────────

    #onPointerMove(pointer) {
        //console.log('move')
        if (this.#scene.gameOver) return;
        if (this.#activeStructure === null) {
            this.#hoverGraphics.clear();
            return;
        }
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        this.#hoverGraphics.clear();
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        const occupied = isCellOccupied(col, row);
        this.#hoverGraphics.lineStyle(2, occupied ? 0xff4444 : 0xffffff, 0.6);
        const tileSize = config.world.tileSize;
        this.#hoverGraphics.strokeRect(col * tileSize + 1, row * tileSize + 1, tileSize - 2, tileSize - 2);
    }

    #onPointerDown(pointer) {
        //console.log('down')
        if (this.#scene.gameOver) return;
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        this.place(col, row);
    }
}
