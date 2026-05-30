class Structure extends Phaser.GameObjects.GameObject {
    #health;
    #container;
    #radius;
    #radiusType;

    #bgRect;
    #labelElement;
    #healthElement;
    #radiusGfx;

    constructor(scene, col, row, structureConfig) {
        super(scene, structureConfig.internalType);

        console.log('creating structure with', structureConfig)

        this.col = col;
        this.row = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.sizeInTiles = structureConfig.sizeInTiles;
        this.color = structureConfig.color;
        this.label = structureConfig.label;

        this.#health = structureConfig.health;
        this.#radius = structureConfig.radiusInTiles;
        this.#radiusType = structureConfig.radiusType;
        this.attackable = true;

        // create visuals and if configured the radius visuals
        const visuals = Structure.buildVisuals(this.scene, structureConfig);
        this.#bgRect = visuals.bgRect, this.#labelElement = visuals.labelElement, this.#healthElement = visuals.healthElement;

        this.#container = this.scene.add.container(this.pixelX, this.pixelY);
        this.#container.add([this.#bgRect, this.#labelElement, this.#healthElement]);
        if (this.#radius > 0) {
            this.#radiusGfx = Structure.buildRadiusVisuals(this.scene, structureConfig);
            this.#container.add([this.#radiusGfx]);
        }

        // if structure is moveable, create event handler
        if (structureConfig.moveable) {
            this.#bgRect.setInteractive();
            this.#bgRect.on('pointerdown', (_pointer, _localX, _localY, event) => {
                event.stopPropagation();
                this.pickup();
            });
        }

        placeInMap(col, row, this);

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);
    }

    preUpdate() { }

    #spawnProduceFx(label, amount) {
        const tileSize = config.world.tileSize;
        const x = this.col * tileSize + tileSize / 2;
        const y = this.row * tileSize;
        const labelText = `${label} +${amount}`;

        const labelElement = this.scene.add.text(x, y, labelText, {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#a8dadc',
            //stroke: '#000000',
            //strokeThickness: 3,
        }).setOrigin(0.5, 1).setDepth(config.depthMap.structureProductionFx).setAlpha(1);

        this.scene.tweens.add({
            targets: labelElement,
            y: y - 40,
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.Out',
            onComplete: () => labelElement.destroy(),
        });
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

    // public function that produces x amount of the product given by registryKey
    // fires animation and sets new value to registry
    produce(registryKey, label, amount) {
        if (amount <= 0) return;
        this.scene.registry.inc(registryKey, amount);
        this.#spawnProduceFx(label, amount);
    }

    pickup() {
        const placer = this.scene.registry.get(config.registryKeys.placer);
        placer.selectExistingForMove(this);
    }

    moveTo(col, row) {
        if (isCellOccupied(col, row)) return;

        removeFromMap(this.col, this.row);

        this.col = col;
        this.row = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        // move container -> moves visuals
        this.#container.setPosition(this.pixelX, this.pixelY);

        placeInMap(col, row, this);
    }

    destroy(fromScene) {
        console.log('structure of type', this.type, 'was destroyed')

        removeFromMap(this.col, this.row);

        // destroys gfx, labels, and any children added by subclasses
        this.#container.destroy(true);
        super.destroy(fromScene);
    }

    // static function that creates structure visuals and returns them
    static buildVisuals(scene, structureConfig) {
        const bgRectSize = structureConfig.sizeInTiles * config.world.tileSize;
        // background graphics
        const bgRect = scene.add.rectangle(0, 0, bgRectSize, bgRectSize, structureConfig.color);

        // label
        const labelElement = scene.add.text(0, -10, structureConfig.label, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // health
        const healthElement = scene.add.text(0, 10, structureConfig.health, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        return { bgRect, labelElement, healthElement };
    }

    // static function that creates radius visuals and returns them
    static buildRadiusVisuals(scene, structureConfig) {
        const tileSize = config.world.tileSize;
        const radius = structureConfig.radiusInTiles;

        const radiusGfx = scene.add.graphics().setDepth(config.depthMap.structureRadius);

        if (structureConfig.radiusType == RadiusType.Rectangular) {
            radiusGfx.lineStyle(1, 0xa8dadc, 0.25);
            radiusGfx.strokeRect(
                -(radius + 0.5) * tileSize,
                -(radius + 0.5) * tileSize,
                (radius * 2 + 1) * tileSize,
                (radius * 2 + 1) * tileSize,
            );
        } else if (structureConfig.radiusType == RadiusType.Circular) {
            radiusGfx.lineStyle(1, 0xa8dadc, 0.25);
            radiusGfx.strokeCircle(0, 0, radius * config.world.tileSize);
        }
        return radiusGfx;
    }

    // static to create a hove preview for the grid
    // returns move and destroy functions
    // generated by Claude
    static createPreview(scene, structureConfig) {
        const { tileSize } = config.world;
        const half = tileSize / 2;

        const { bgRect, labelElement, healthElement } = Structure.buildVisuals(scene, structureConfig);
        const radiusGfx = Structure.buildRadiusVisuals(scene, structureConfig);

        const container = scene.add.container(0, 0, [bgRect, labelElement, healthElement, radiusGfx])
            .setDepth(config.depthMap.hoverGrid)
            .setAlpha(0.45);

        // move this preview to another cell
        const moveTo = (col, row) => {
            const { x, y } = gridToWorld(col, row);
            container.setPosition(x, y);
        };

        // set new color to the background rectangle
        const setTint = (color) => {
            bgRect.setFillStyle(color);
        };

        // clear previously set color back to original color for the background rectangle
        const clearTint = () => {
            bgRect.setFillStyle(structureConfig.color);
        };

        const destroy = () => container.destroy(true);

        return { moveTo, setTint, clearTint, destroy };
    }

    static create(scene, col, row, structureConfig, SubClass) {
        if (structureConfig.costResourceRegistryKey && structureConfig.cost) {
            const currentResourceCount = scene.registry.get(structureConfig.costResourceRegistryKey);
            if (currentResourceCount < structureConfig.cost) return null;

            scene.registry.inc(structureConfig.costResourceRegistryKey, -structureConfig.cost);
        }
        return new SubClass(scene, col, row, structureConfig);
    }
}