// ─────────────────────────────────────────────────────────────────────────────
//  WoodShop — Custom Phaser GameObject
//
//  Owns its own visuals (rectangle + emoji icon + radius overlay) and its
//  grid data.  Swap the rectangle/icon for a Sprite in _buildVisuals().
//
//  Dependencies expected on globalThis:
//    TILE, COLS, ROWS    — grid constants
//    structureMap        — Map<string, { col, row, type, … }>
//    gridToWorld(c,r)    — { x, y } pixel centre of cell
//    placeInMap(c,r,type,ref) — registers the cell in structureMap
// ─────────────────────────────────────────────────────────────────────────────
class WoodShop extends Phaser.GameObjects.GameObject {

    constructor(scene, col, row) {
        super(scene, 'woodShop');

        this.col = col;
        this.row = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.radius = 1; // CELLS

        this.health = 60;
        this.attackable = true;
        this.lastHarvest = 0;
        this.harvestEveryMs = 1000;

        // Build all child display objects and keep refs for cleanup
        this._visuals = this._buildVisuals(scene, pos);

        // Register in the shared structure map (pass `this` as the owner ref)
        placeInMap(col, row, this);

        // add this object to the update list so the pre update method is called periodically
        scene.sys.updateList.add(this);
    }

    // ── Visuals ───────────────────────────────────────────────────────────────

    /**
     * Creates child display objects.
     * Swap this method body when you have a real Sprite asset.
     * @returns {{ icon, radiusGfx }}
     */
    _buildVisuals(scene, pos) {

        const icon = scene.add.text(pos.x, pos.y, '🏪', {
            fontSize: '16px',
        }).setOrigin(0.5).setDepth(2);

        // Radius overlay
        const radiusGfx = scene.add.graphics().setDepth(0);
        radiusGfx.lineStyle(1, 0xa8dadc, 0.25);
        radiusGfx.strokeRect(
            (this.col - this.radius) * TILE,
            (this.row - this.radius) * TILE,
            (this.radius * 2 + 1) * TILE,
            (this.radius * 2 + 1) * TILE,
        );

        return { icon, radiusGfx };
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // returns the number of trees in radius
    countTreesInRadius() {
        let treeCount = 0;
        structureMap.forEach((entry) => {
            if (entry.type !== 'tree') return;
            //console.log('found tree at', entry.pixelX, entry.pixelY);
            const dist = Math.max(
                Math.abs(entry.col - this.col),
                Math.abs(entry.row - this.row),
            );
            if (dist <= this.radius) treeCount++;
        });
        //console.log('found', count, 'trees in radius')
        return treeCount;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    preUpdate(time, delta) {
        if (time > this.lastHarvest + this.harvestEveryMs) {
            this.lastHarvest = time;
            const treeCount = this.countTreesInRadius();
            this.scene.registry.inc('wood', treeCount);
        }

    }

    destroy(fromScene) {
        this._visuals.icon.destroy();
        this._visuals.radiusGfx.destroy();
        super.destroy(fromScene);
    }
}


// ─────────────────────────────────────────────────────────────────────────────
//  WoodShopManager — scene-level controller
//
//  Usage:
//    create()  { this.woodShops = new WoodShopManager(this); }
//    // No update() hook needed — collection runs on a scene timer.
//
//  Public API:
//    this.woodShops.wood          → current wood count (number)
//    this.woodShops.placeWoodShop(col, row)
// ─────────────────────────────────────────────────────────────────────────────
class WoodShopManager {

    constructor(scene) {
        this.scene = scene;

        // Shared hover-highlight graphics
        this._hoverGfx = scene.add.graphics().setDepth(5);

        // ── Input ──────────────────────────────────────────────────────────
        scene.input.on('pointermove', this._onPointerMove, this);
        scene.input.on('pointerdown', this._onPointerDown, this);
    }

    // ── Public ────────────────────────────────────────────────────────────────

    /**
     * Create a WoodShop at (col, row) via the factory.
     * Guards against out-of-bounds and occupied cells.
     */
    placeWoodShop(col, row) {
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        if (isCellOccupied(col, row)) return;

        this.scene.add.woodShop(col, row);
    }

    // ── Input handlers ────────────────────────────────────────────────────────

    _onPointerMove(pointer) {
        if (this.scene.gameOver) return;
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        this._hoverGfx.clear();
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        const occupied = isCellOccupied(col, row);
        this._hoverGfx.lineStyle(2, occupied ? 0xff4444 : 0xffffff, 0.6);
        this._hoverGfx.strokeRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2);
    }

    _onPointerDown(pointer) {
        if (this.scene.gameOver) return;
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        this.placeWoodShop(col, row);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Factory Registration
//
//  Call registerStructureFactories() once before new Phaser.Game(config).
//  Afterwards any scene can do:  scene.add.woodShop(col, row)
// ─────────────────────────────────────────────────────────────────────────────
function registerWoodShopFactory() {
    Phaser.GameObjects.GameObjectFactory.register(
        'woodShop',
        function (col, row) {
            const shop = new WoodShop(this.scene, col, row);
            return shop;
        },
    );
}

registerWoodShopFactory();