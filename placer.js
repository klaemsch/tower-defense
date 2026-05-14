const placerFactoryMap = {
    woodShop: (scene, col, row) => scene.add.woodShop(col, row),
    tower: (scene, col, row) => scene.add.tower(col, row),
};

class Placer {
    #scene
    #hoverGraphics
    #activeStructure
    #onPointerMove
    #onPointerDown

    constructor(scene) {
        this.scene = scene;
        this.hoverGraphics = scene.add.graphics().setDepth(5);  // hover grid
        this.activeStructure = 'woodShop';

        // listeners
        scene.input.on('pointermove', this.onPointerMove, this);
        scene.input.on('pointerdown', this.onPointerDown, this);
    }

    // ── Public ────────────────────────────────────────────────────────────────

    // selects a type of structure to be placed as string, e.g. 'tower'
    select(structureType) {
        this.activeStructure = structureType;
    }

    // deselect type of structure
    deselect() {
        this.activeStructure = 'woodShop';
    }

    // try to place the currently selected structure type
    place(col, row) {
        if (!this.activeStructure) return;
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        if (isCellOccupied(col, row)) return;

        const factory = placerFactoryMap[this.activeStructure];
        if (!factory) { console.warn(`Unknown structure type: ${this.activeStructure}`); return; }

        factory(this.scene, col, row);

        this.deselect();
    }

    // ── Input handlers ────────────────────────────────────────────────────────

    onPointerMove(pointer) {
        //console.log('move')
        if (this.scene.gameOver) return;
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        this.hoverGraphics.clear();
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        const occupied = isCellOccupied(col, row);
        this.hoverGraphics.lineStyle(2, occupied ? 0xff4444 : 0xffffff, 0.6);
        this.hoverGraphics.strokeRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2);
    }

    onPointerDown(pointer) {
        //console.log('down')
        if (this.scene.gameOver) return;
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        this.place(col, row);
    }
}
