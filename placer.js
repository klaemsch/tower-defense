class Placer {
    #scene;
    #inventoryManager;
    #selectedItemConfig = null;     // config of selected item
    #movingItem = null;             // real instance being moved
    #preview = null;                // preview instance with { moveTo, destroy }

    constructor(scene) {
        this.#scene = scene;
        this.#inventoryManager = this.#scene.game.registry.get(globalConfig.registryKeys.inventoryManager);

        scene.input.on('pointermove', this.#onPointerMove, this);
        scene.input.on('pointerdown', this.#onPointerDown, this);

        const escKey = scene.input.keyboard.addKey("ESC");
        escKey.on("down", () => this.deselect());
    }

    // ── Public ────────────────────────────────────────────────────────

    select(itemConfig) {
        //console.log('select', itemConfig);
        this.deselect();
        this.#selectedItemConfig = itemConfig;
        this.#scene.registry.set(globalConfig.registryKeys.selectedItem, itemConfig);
        this.#spawnPreview();
    }

    // Call this when the player clicks an already-placed item to move it
    selectExistingForMove(itemInstance) {
        const gameFlowManager = this.#scene.game.registry.get(globalConfig.registryKeys.gameFlowManager);
        if (this.#selectedItemConfig || this.#movingItem || gameFlowManager.isCurrentlyWave()) return; // TODO: check if this is right
        //console.log('move')
        this.deselect();
        this.#movingItem = itemInstance;
        this.#selectedItemConfig = itemInstance.config;
        this.#scene.registry.set(globalConfig.registryKeys.selectedItem, itemInstance.type);
        this.#spawnPreview(itemInstance.config);
    }

    deselect() {
        this.#selectedItemConfig = null;
        this.#movingItem = null;
        this.#scene.registry.set(globalConfig.registryKeys.selectedItem, null);
        this.#destroyPreview();
    }

    // ── Private ───────────────────────────────────────────────────────

    #spawnPreview() {
        const itemConfig = this.#selectedItemConfig
        this.#destroyPreview();
        if (itemConfig.createPreview) this.#preview = itemConfig.createPreview(this.#scene, itemConfig);
    }

    #destroyPreview() {
        this.#preview?.destroy();
        this.#preview = null;
    }

    #place(col, row) {
        //console.log('#place called')
        if (!this.#selectedItemConfig) return;

        const { numCols, numRows } = globalConfig.world;
        if (col < 0 || col >= numCols || row < 0 || row >= numRows) return;

        if (this.#movingItem) {
            // moving, currently only structures // TODO
            // Move the existing item, no cost re-applied
            this.#movingItem.moveTo(col, row);
        } else if (this.#inventoryManager.canUseItem(this.#selectedItemConfig)) {
            // placing, if inventory manager says its ok
            if (this.#selectedItemConfig.itemType === ItemType.Structure) {
                this.#placeStructure(col, row);
            } else if (this.#selectedItemConfig.itemType === ItemType.Upgrade) {
                this.#placeUpgrade(col, row);
            } else {
                console.error('unknown item type');
            }
        }

        this.deselect();
    }

    // gets called by #place if the item is of type Structure
    #placeStructure(col, row) {
        //console.log('#placeStructure called');

        // Place new — factory handles cost check
        if (structureStorage.isOccupied(col, row)) return;

        this.#inventoryManager.useItem(this.#selectedItemConfig);

        this.#destroyPreview();
        if (this.#selectedItemConfig.create) {
            this.#selectedItemConfig.create(this.#scene, col, row);
        }

    }

    // gets called by #place if the item is of type Upgrade
    #placeUpgrade(col, row) {
        //console.log('#placeUpgrade called');

        // get structure in the cell
        const structure = structureStorage.getByCell(col, row);
        if (!structure) return;

        const canAddUpgrade = structure.addUpgrade(this.#selectedItemConfig);

        if (canAddUpgrade) this.#inventoryManager.useItem(this.#selectedItemConfig);
        else console.log('cant use this upgrade');
    }

    // event fired everytime the pointer moves
    #onPointerMove(pointer) {
        //console.log(this.#selectedItemConfig, this.#preview)
        // check if an item is selected and a preview exist
        if (!this.#selectedItemConfig || !this.#preview) return;

        // check if new position (get through pointer pos) is out of world bounds
        const { col, row } = helper.worldToGrid(pointer.x, pointer.y);
        const { numCols, numRows } = globalConfig.world;

        if (col < 0 || col >= numCols || row < 0 || row >= numRows) return;

        // move preview to pinter pos / cell
        this.#preview.moveTo(col, row);

        // Tint red if occupied by something else
        if (structureStorage.isOccupied(col, row)) {
            this.#preview.setTint?.(0xff6666);
        } else {
            this.#preview.clearTint?.();
        }
    }

    // event fired everytime the pointer is clicked
    #onPointerDown(pointer) {
        //console.log('placer pointer down');
        if (!this.#selectedItemConfig) return;
        const { col, row } = helper.worldToGrid(pointer.x, pointer.y);
        this.#place(col, row);
    }
}