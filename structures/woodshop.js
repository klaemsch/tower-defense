class WoodShop extends Structure {
    #lastHarvest;
    #harvestRateMs;
    #radiusVisual;
    #radius;

    constructor(scene, col, row) {
        super(scene, col, row, 'woodShop', config.woodShop.color, config.woodShop.label, config.woodShop.health);  // call parent "Structure"

        this.#radius = config.woodShop.radiusInTiles;

        this.#lastHarvest = 0;
        this.#harvestRateMs = config.woodShop.harvestRateMs;

        this.#createRadiusVisual();
    }

    #createRadiusVisual() {
        const tileSize = config.world.tileSize;

        // Radius overlay
        this.#radiusVisual = this.scene.add.graphics().setDepth(0);
        this.#radiusVisual.lineStyle(1, 0xa8dadc, 0.25);
        this.#radiusVisual.strokeRect(
            (this.col - this.#radius) * tileSize,
            (this.row - this.#radius) * tileSize,
            (this.#radius * 2 + 1) * tileSize,
            (this.#radius * 2 + 1) * tileSize,
        );
    }

    // ── Harvest FX ────────────────────────────────────────────────────────────

    #spawnHarvestFx(amount) {
        const tileSize = config.world.tileSize;
        const x = this.col * tileSize + tileSize / 2;
        const y = this.row * tileSize;
        const labelText = `${config.resources.wood.label} +${amount}`;

        const label = this.scene.add.text(x, y, labelText, {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#a8dadc',
            //stroke: '#000000',
            //strokeThickness: 3,
        }).setOrigin(0.5, 1).setDepth(200).setAlpha(1);

        this.scene.tweens.add({
            targets: label,
            y: y - 40,
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.Out',
            onComplete: () => label.destroy(),
        });
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
            if (dist <= this.#radius) treeCount++;
        });
        //console.log('found', count, 'trees in radius')
        return treeCount;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    preUpdate(time, delta) {
        if (time > this.#lastHarvest + this.#harvestRateMs) {
            this.#lastHarvest = time;
            const treeCount = this.#countTreesInRadius();
            if (treeCount > 0) {
                this.scene.registry.inc(config.resources.wood.registryKey, treeCount);
                this.#spawnHarvestFx(treeCount);
            }
        }
    }

    destroy(fromScene) {
        this.#radiusVisual.destroy();
        super.destroy(fromScene);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'woodShop',
    function (col, row) {
        // TODO: move cost check from children to structure.js
        const woodCount = this.scene.registry.get(config.resources.wood.registryKey);
        if (woodCount >= config.woodShop.cost) {
            this.scene.registry.inc(config.resources.wood.registryKey, -config.woodShop.cost);
            const shop = new WoodShop(this.scene, col, row);
            return shop;
        }
        return null;
    },
);