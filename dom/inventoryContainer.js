class InventoryContainer extends Phaser.GameObjects.Container {
    #placer;
    #inventoryManager;
    #activeButton = null;
    #buttons = [];

    static #PADDING_X = 8;
    static #PADDING_Y = 30;
    static #BUTTON_GAP = 6;
    static #BUTTON_HEIGHT = globalStyles.buttons.small.height;

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       cx   - Center x
     * @param {number}       cy   - Center y
     */
    constructor(scene, cx, cy) {
        super(scene, cx, cy);
        this.#placer = scene.registry.get(globalConfig.registryKeys.placer);
        this.#inventoryManager = scene.registry.get(globalConfig.registryKeys.inventoryManager);

        this.#createHeadingText();

        // create buttons for inventory slots
        this.#createButtons();

        // listen for change in active inventory button
        scene.registry.events.on(
            `changedata-${globalConfig.registryKeys.selectedItem}`,
            (_parent, value) => { if (value === null) this.#deactivateAll(); }
        );

        // listen for change in inventory
        scene.game.events.on(
            globalConfig.eventKeys.inventoryChanged,
            () => {
                this.#destroyButtons();
                this.#createButtons();
            }
        );

        scene.add.existing(this);
    }

    // ── Private helpers ───────────────────────────────────────────────

    #createHeadingText() {
        this.add(
            this.scene.add.text(
                68,
                20,
                'Inventory',
                { fontSize: globalStyles.text.sizes.small, color: globalStyles.text.colors.base, fontStyle: 'bold' }
            ).setOrigin(0.5)
        );
    }

    #createButtons() {
        this.#inventoryManager.getItems()
            .forEach((item, i) => this.#addItemButton(item, i));
    }

    #addItemButton(item, index) {
        const itemConfig = item.config;
        const itemQuantity = item.quantity;

        // calculate button coordinates (x,y)
        const x = InventoryContainer.#PADDING_X;
        const y = InventoryContainer.#PADDING_Y
            + index * (InventoryContainer.#BUTTON_HEIGHT + InventoryContainer.#BUTTON_GAP);

        const btn = new InventoryButton(this.scene, x, y, itemConfig, itemQuantity);

        // if the button is pressed it sends an event -> handle this event
        btn.on(globalConfig.eventKeys.inventoryButtonPressed, (itemConfig, sender) =>
            this.#onButtonSelect(itemConfig, sender)
        );

        // add button to this container and to button list
        this.add(btn);
        this.#buttons.push(btn);
    }

    // callback for when button is selected
    #onButtonSelect(itemConfig, sender) {
        if (this.#activeButton === sender) {
            this.#placer.deselect();
            sender.deactivate();
            this.#activeButton = null;
        } else {
            this.#activeButton?.deactivate();
            this.#placer.select(itemConfig);
            sender.activate();
            this.#activeButton = sender;
        }
    }

    #deactivateAll() {
        this.#activeButton?.deactivate();
        this.#activeButton = null;
    }

    #destroyButtons() {
        console.log('destroying inventory buttons');
        this.#deactivateAll();
        this.#buttons.forEach(btn => btn.destroy());
        this.#buttons = [];
    }
}