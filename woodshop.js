class WoodShop extends Phaser.GameObjects.GameObject {
    #lastHarvest
    #harvestRateMs
    #visuals

    constructor(scene, col, row) {
        super(scene, 'woodShop');

        this.col = col;
        this.row = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.radius = config.woodShop.radiusInTiles;

        this.health = config.woodShop.health;
        this.attackable = true;

        this.#lastHarvest = 0;
        this.#harvestRateMs = config.woodShop.harvestRateMs;

        // Build all child display objects and keep refs for cleanup
        this.#visuals = this.#createVisuals(scene, pos);

        // Register in the shared structure map (pass `this` as the owner ref)
        placeInMap(col, row, this);

        // add this object to the update list so the pre update method is called periodically
        scene.sys.updateList.add(this);
    }

    #createVisuals(scene, pos) {

        const icon = scene.add.text(pos.x, pos.y, '🏪', {
            fontSize: '16px',
        }).setOrigin(0.5).setDepth(2);

        // Radius overlay
        const radius = scene.add.graphics().setDepth(0);
        radius.lineStyle(1, 0xa8dadc, 0.25);
        radius.strokeRect(
            (this.col - this.radius) * TILE,
            (this.row - this.radius) * TILE,
            (this.radius * 2 + 1) * TILE,
            (this.radius * 2 + 1) * TILE,
        );

        return {icon, radius};
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // returns the number of trees in radius
    #countTreesInRadius() {
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
        if (time > this.#lastHarvest + this.#harvestRateMs) {
            this.#lastHarvest = time;
            const treeCount = this.#countTreesInRadius();
            this.scene.registry.inc('wood', treeCount);
        }

    }

    destroy(fromScene) {
        this.#visuals.icon.destroy();
        this.#visuals.radius.destroy();
        super.destroy(fromScene);
    }
}

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