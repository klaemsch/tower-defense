class Structure extends Phaser.GameObjects.GameObject {
    config;
    prodTimeAccumulator = 0;  // keeps track of next production
    upgrades = new Set();

    #container;
    #bgRect;
    image;
    #labelElement;
    #healthElement;
    #radiusGfx;

    constructor(scene, col, row, structureConfig) {
        super(scene, structureConfig.internalType);

        console.log('creating structure with', structureConfig)
        this.config = structureConfig;

        this.col = col;
        this.row = row;

        const pos = helper.gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.attackable = true;

        // create visuals and if configured the radius visuals
        const visuals = Structure.buildVisuals(this.scene, structureConfig);
        this.#bgRect = visuals.bgRect, this.image = visuals.image, this.#labelElement = visuals.labelElement, this.#healthElement = visuals.healthElement;

        this.#container = this.scene.add.container(this.pixelX, this.pixelY);
        this.#container.add([this.#bgRect, this.image, this.#labelElement, this.#healthElement]);
        if (this.config.radiusInTiles > 0) {
            this.#radiusGfx = Structure.buildRadiusVisuals(this.scene, structureConfig);
            this.#container.add([this.#radiusGfx]);

            // make radius visible/invisible depending on if the mouse is over the structure
            this.#bgRect.setInteractive();
            this.#bgRect.on('pointerover', () => this.#radiusGfx.setVisible(true));
            this.#bgRect.on('pointerout', () => this.#radiusGfx.setVisible(false));
        }

        // if structure is moveable, create event handler
        if (structureConfig.moveable) {
            this.#bgRect.setInteractive();
            this.#bgRect.on('pointerdown', (_pointer, _localX, _localY, event) => {
                this.pickup(event);
            });
        }

        structureStorage.place(col, row, this);

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);
    }

    // hook for child functions to add extra logic that is called
    // when production should happen
    produceHook() { }

    preUpdate(time, delta) {
        delta = delta * this.scene.time.timeScale;  // TODO check if this works
        this.prodTimeAccumulator += delta;
        if (this.prodTimeAccumulator >= this.config.productionRateMs) {
            this.prodTimeAccumulator -= this.config.productionRateMs;
            this.produceHook();
        }
    }

    #spawnProduceFx(label, amount) {
        const labelText = `${label} +${amount}`;
        helper.spawnRisingFxAtGrid(this.scene, this.col, this.row, labelText, globalStyles.animations.produceFxDuration);
    }

    // starts a wiggle animation and changes color
    #spawnActionDeniedFx() {
        // set color to deny
        this.#bgRect.setFillStyle(0xff6666);

        // start wiggle animation and at the end set color back to normal
        const originalX = this.#container.x;
        this.scene.tweens.add({
            targets: this.#container,
            x: { from: originalX - 6, to: originalX + 6 },
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.#container.x = originalX;
                this.#bgRect.setFillStyle(this.config.color);
            }
        });
    }

    // applies the damage (amount) to this structure
    // returns true if destroyed (and destroys itself)
    // returns false if not destroyed but damaged
    doDamage(amount) {
        // TODO: IMPROVEMENT: maybe subtract armour from damage?
        this.config.health -= amount;
        if (this.config.health <= 0) {
            this.destroy();
            return true;
        } else {
            this.#healthElement.text = this.config.health;
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

    // public function that converts x amounts of product given by registryKeyX
    // into y amounts of product given by registryKeyY
    // fires animation and sets registry
    // currently only animation for Y, so only labelY required
    convert(registryKeyX, amountX, registryKeyY, amountY, labelY) {
        if (amountX <= 0 || amountY <= 0) return;
        if (this.scene.registry.get(registryKeyX) >= amountX) {
            this.scene.registry.inc(registryKeyX, -amountX);
            this.produce(registryKeyY, labelY, amountY);
        }
    }

    pickup(event) {
        const placer = this.scene.registry.get(globalConfig.registryKeys.placer);
        const placerSelectedItem = this.scene.registry.get(globalConfig.registryKeys.selectedItem);
        //console.log('placerSelectedItem', placerSelectedItem)
        if (!placerSelectedItem) {
            // stop propagation, so the placer's pointer down event isnt called aswell
            event.stopPropagation();
            //console.log('placer has no item selected, select this for move')
            placer.selectExistingForMove(this);
        }
    }

    // can be overwritten by derived classes
    // is called everytime an upgrade is added/removed/changed
    onUpgradeChange() { }

    // returns true if upgrade was added, false if not
    addUpgrade(upgrade) {
        // if upgrade already applied spawn Fx, return false
        if (this.upgrades.has(upgrade)) {
            this.#spawnActionDeniedFx();
            return false;
        }

        //console.log('upgrade', upgrade);
        this.upgrades.add(upgrade);
        this.onUpgradeChange();

        // upgrade added -> return true
        return true;
    }

    removeUpgrade(upgrade) {
        this.onUpgradeChange();
        return this.upgrades.delete(upgrade);
    }

    moveTo(col, row) {
        if (structureStorage.isOccupied(col, row)) return;

        structureStorage.remove(this.col, this.row);

        this.col = col;
        this.row = row;

        const pos = helper.gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        // move container -> moves visuals
        this.#container.setPosition(this.pixelX, this.pixelY);

        structureStorage.place(col, row, this);
    }

    destroy(fromScene) {
        console.log('structure of type', this.type, 'was destroyed')

        structureStorage.remove(this.col, this.row);

        // destroys gfx, labels, and any children added by subclasses
        this.#container.destroy(true);
        super.destroy(fromScene);
    }

    // static function that creates structure visuals and returns them
    static buildVisuals(scene, structureConfig) {
        const bgRectSize = structureConfig.sizeInTiles * globalConfig.world.tileSize;

        // background graphics
        const bgRect = scene.add.rectangle(0, 0, bgRectSize, bgRectSize, structureConfig.color);
        bgRect.setVisible(false);  // TODO

        // if imageKey not given in config use temp
        const imageKey = structureConfig.imageKey ? structureConfig.imageKey : 'temp';
        const image = scene.add.image(0, 0, imageKey);

        // scale image according to tileSize (image.height should be 48px)
        image.scale = globalConfig.world.tileSize / image.height;

        // label
        const labelElement = scene.add.text(0, -10, structureConfig.label, {
            fontSize: globalStyles.text.sizes.small,
            color: globalStyles.text.colors.highlight,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        labelElement.setVisible(false);  // TODO

        // health
        const healthElement = scene.add.text(0, 10, structureConfig.health, {
            fontSize: globalStyles.text.sizes.small,
            color: globalStyles.text.colors.highlight,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        return { bgRect, image, labelElement, healthElement };
    }

    // static function that creates radius visuals and returns them
    static buildRadiusVisuals(scene, structureConfig) {
        const tileSize = globalConfig.world.tileSize;
        const radius = structureConfig.radiusInTiles;

        const radiusGfx = scene.add.graphics().setDepth(globalStyles.depthMap.structureRadius);

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
            radiusGfx.strokeCircle(0, 0, radius * globalConfig.world.tileSize);
        }

        // make invisible
        radiusGfx.setVisible(false);

        return radiusGfx;
    }

    // static to create a hove preview for the grid
    // returns move and destroy functions
    // generated by Claude
    static createPreview(scene, structureConfig) {
        const { tileSize } = globalConfig.world;
        const half = tileSize / 2;

        const { bgRect, image, labelElement, healthElement } = Structure.buildVisuals(scene, structureConfig);
        const radiusGfx = Structure.buildRadiusVisuals(scene, structureConfig);
        radiusGfx.setVisible(true);

        const container = scene.add.container(0, 0, [bgRect, image, labelElement, healthElement, radiusGfx])
            .setDepth(globalStyles.depthMap.hoverGrid)
            .setAlpha(0.45);

        // move this preview to another cell
        const moveTo = (col, row) => {
            const { x, y } = helper.gridToWorld(col, row);
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
        // clone structure config
        const clonedConfig = { ...structureConfig };
        if (clonedConfig.costResourceRegistryKey && clonedConfig.cost) {
            const currentResourceCount = scene.registry.get(clonedConfig.costResourceRegistryKey);
            if (currentResourceCount < clonedConfig.cost) return null;

            scene.registry.inc(clonedConfig.costResourceRegistryKey, -clonedConfig.cost);
        }
        return new SubClass(scene, col, row, clonedConfig);
    }
}