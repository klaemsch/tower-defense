const placerPreviewMap = {
    woodShop: (scene, cfg) => WoodShop.createPreview(scene, cfg),
    tower: (scene, cfg) => Tower.createPreview(scene, cfg),
    hammer: (scene, cfg) => Tower.createPreview(scene, cfg),
    sniper: (scene, cfg) => Tower.createPreview(scene, cfg),
    powerPlant: (scene, cfg) => Structure.createPreview(scene, cfg),
};

const placerFactoryMap = {
    woodShop: (scene, col, row) => scene.add.woodShop(col, row),
    tower: (scene, col, row) => scene.add.tower(col, row, config.structures.tower),
    hammer: (scene, col, row) => scene.add.tower(col, row, config.structures.hammer),
    sniper: (scene, col, row) => scene.add.tower(col, row, config.structures.sniper),
    powerPlant: (scene, col, row) => scene.add.powerPlant(col, row),
};

class Placer {
    #scene;
    #activeStructure = null;    // internalType string
    #movingStructure = null;    // real Structure instance being moved
    #preview = null;            // { moveTo, destroy }

    constructor(scene) {
        this.#scene = scene;

        scene.input.on('pointermove', this.#onPointerMove, this);
        scene.input.on('pointerdown', this.#onPointerDown, this);

        const escKey = scene.input.keyboard.addKey("ESC");
        escKey.on("down", () => this.deselect());
    }

    // ── Public ────────────────────────────────────────────────────────

    select(structureType) {
        this.deselect();
        this.#activeStructure = structureType;
        this.#scene.registry.set(config.registryKeys.placerActiveStructure, structureType);
        this.#spawnPreview(structureType);
    }

    // Call this when the player clicks an already-placed structure to move it
    selectExistingForMove(structureInstance) {
        this.deselect();
        this.#movingStructure = structureInstance;
        this.#activeStructure = structureInstance.type;
        this.#scene.registry.set(config.registryKeys.placerActiveStructure, structureInstance.type);
        this.#spawnPreview(structureInstance.type);
    }

    deselect() {
        this.#activeStructure = null;
        this.#movingStructure = null;
        this.#scene.registry.set(config.registryKeys.placerActiveStructure, null);
        this.#destroyPreview();
    }

    // ── Private ───────────────────────────────────────────────────────

    #spawnPreview(structureType) {
        this.#destroyPreview();
        const structureConfig = config.structures[structureType];
        const previewFactory = placerPreviewMap[structureType];
        if (!previewFactory || !structureConfig) return;
        this.#preview = previewFactory(this.#scene, structureConfig);
    }

    #destroyPreview() {
        this.#preview?.destroy();
        this.#preview = null;
    }

    #place(col, row) {
        if (!this.#activeStructure) return;

        const { numCols, numRows } = config.world;
        if (col < 0 || col >= numCols || row < 0 || row >= numRows) return;

        if (this.#movingStructure) {
            // Move the existing structure, no cost re-applied
            this.#movingStructure.moveTo(col, row);
        } else {
            // Place new — factory handles cost check
            if (isCellOccupied(col, row)) return;
            const factory = placerFactoryMap[this.#activeStructure];
            if (!factory) { console.warn(`Unknown structure type: ${this.#activeStructure}`); return; }
            this.#destroyPreview();
            factory(this.#scene, col, row);

        }
        this.deselect();
    }

    // event fired everytime the pointer moves
    #onPointerMove(pointer) {
        // check if a structure is selected and a preview exist
        if (!this.#activeStructure || !this.#preview) return;

        // check if new position (get through pointer pos) is out of world bounds
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        const { numCols, numRows } = config.world;

        if (col < 0 || col >= numCols || row < 0 || row >= numRows) return;

        // move preview to pinter pos / cell
        this.#preview.moveTo(col, row);

        // Tint red if occupied by something else
        if (isCellOccupied(col, row)) {
            this.#preview.setTint?.(0xff6666);
        } else {
            this.#preview.clearTint?.();
        }
    }

    // event fired everytime the pointer is clicked
    #onPointerDown(pointer) {
        if (!this.#activeStructure) return;
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        this.#place(col, row);
    }
}