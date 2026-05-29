class Structure extends Phaser.GameObjects.GameObject {
    #health;
    #container;
    #radius;
    #radiusInPixel;
    #radiusType;

    #bgGfx;
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

        this.size = config.world.tileSize;
        this.color = structureConfig.color;
        this.label = structureConfig.label;

        this.#health = structureConfig.health;
        this.#radius = structureConfig.radiusInTiles;
        this.#radiusInPixel = this.#radius * config.world.tileSize;
        this.#radiusType = structureConfig.radiusType;
        this.attackable = true;

        // create visuals and if configured the radius visuals
        this.#createVisuals();
        if (this.#radius > 0 && this.#radiusType !== undefined) this.#createRadiusVisuals();

        // if structure is moveable, create event handler
        if (structureConfig.moveable) {
            this.#bgGfx.setInteractive();
            this.#bgGfx.on('pointerdown', (_pointer, _localX, _localY, event) => {
                event.stopPropagation();
                this.pickup();
            });
        }

        placeInMap(col, row, this);

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);
    }

    preUpdate() { }

    #createVisuals() {

        // background graphics
        this.#bgGfx = this.scene.add.rectangle(0, 0, this.size, this.size, this.color);

        // label
        this.#labelElement = this.scene.add.text(0, -10, this.label, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // health
        this.#healthElement = this.scene.add.text(0, 10, this.#health, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // container that summarises all graphic/visual elements
        this.#container = this.scene.add.container(this.pixelX, this.pixelY);
        this.#container.add([this.#bgGfx, this.#labelElement, this.#healthElement]);
    }

    #createRadiusVisuals() {
        const tileSize = config.world.tileSize;

        this.#radiusGfx = this.scene.add.graphics().setDepth(config.depthMap.structureRadius);

        if (this.#radiusType == RadiusType.Rectangular) {
            this.#radiusGfx.lineStyle(1, 0xa8dadc, 0.25);
            this.#radiusGfx.strokeRect(
                -(this.#radius + 0.5) * tileSize,
                -(this.#radius + 0.5) * tileSize,
                (this.#radius * 2 + 1) * tileSize,
                (this.#radius * 2 + 1) * tileSize,
            );
        } else if (this.#radiusType == RadiusType.Circular) {
            this.#radiusGfx.lineStyle(1, 0xa8dadc, 0.25);
            this.#radiusGfx.strokeCircle(0, 0, this.#radiusInPixel);
        }
        this.#container.add([this.#radiusGfx]);
    }

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

    // static to create a hove preview for the grid
    // returns move and destroy functions
    // generated by Claude
    static createPreview(scene, structureConfig) {
        const { tileSize } = config.world;
        const half = tileSize / 2;

        const gfx = scene.add.graphics();
        gfx.fillStyle(structureConfig.color, 1);
        gfx.fillRect(-half, -half, tileSize, tileSize);

        const label = scene.add.text(0, -10, structureConfig.label, {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const children = [gfx, label];

        // Mirror radius visuals if configured
        const radius = structureConfig.radiusInTiles;
        const radiusType = structureConfig.radiusType;
        if (radius > 0 && radiusType !== undefined) {
            const radiusGfx = scene.add.graphics();
            radiusGfx.lineStyle(1, 0xa8dadc, 0.25);

            if (radiusType === RadiusType.Rectangular) {
                radiusGfx.strokeRect(
                    -(radius + 0.5) * tileSize,
                    -(radius + 0.5) * tileSize,
                    (radius * 2 + 1) * tileSize,
                    (radius * 2 + 1) * tileSize,
                );
            } else if (radiusType === RadiusType.Circular) {
                radiusGfx.strokeCircle(0, 0, radius * tileSize);
            }

            children.push(radiusGfx);
        }

        const container = scene.add.container(0, 0, children)
            .setDepth(config.depthMap.hoverGrid)
            .setAlpha(0.45);

        const moveTo = (col, row) => {
            const { x, y } = gridToWorld(col, row);
            container.setPosition(x, y);
        };

        const setTint = (color) => {
            gfx.clear();
            gfx.fillStyle(color, 1);
            gfx.fillRect(-half, -half, tileSize, tileSize);
        };

        const clearTint = () => {
            gfx.clear();
            gfx.fillStyle(structureConfig.color, 1);
            gfx.fillRect(-half, -half, tileSize, tileSize);
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