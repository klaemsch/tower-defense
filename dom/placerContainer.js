/**
 * Self-contained button that owns its rectangle, border graphics,
 * label text, and active/hover state.  PlacerContainer just calls
 * activate() / deactivate() and listens to the 'select' event.
 */
class PlacerButton extends Phaser.GameObjects.Container {
    // ── Layout / theme (shared across all instances) ──────────────────
    static #WIDTH = 100;
    static #HEIGHT = 36;
    static #FILL_IDLE = 0x16213e;
    static #FILL_HOVER = 0x1a3a5c;
    static #FILL_ACTIVE = 0x1d3557;
    static #BORDER_IDLE = 0x457b9d;
    static #BORDER_ACTIVE = 0xa8dadc;
    static #TEXT_IDLE = '#a8dadc';
    static #TEXT_ACTIVE = '#ffffff';

    // ── Instance fields ───────────────────────────────────────────────
    #rect;
    #borderGfx;
    #label;
    #active = false;

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       x        - Top-left x (container-local)
     * @param {number}       y        - Top-left y (container-local)
     * @param {string}       label    - Button text
     * @param {string}       structureType
     */
    constructor(scene, x, y, label, structureType) {
        super(scene, x, y);

        this.#rect = scene.add
            .rectangle(0, 0, PlacerButton.#WIDTH, PlacerButton.#HEIGHT, PlacerButton.#FILL_IDLE)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        this.#borderGfx = scene.add.graphics();
        this.#drawBorder();

        this.#label = scene.add.text(
            PlacerButton.#WIDTH / 2,
            PlacerButton.#HEIGHT / 2,
            label,
            { fontSize: '11px', color: PlacerButton.#TEXT_IDLE, fontStyle: 'bold' }
        ).setOrigin(0.5);

        this.add([this.#rect, this.#borderGfx, this.#label]);
        this.#registerPointerEvents(structureType);
        scene.add.existing(this);
    }

    // ── Public API ────────────────────────────────────────────────────

    activate() {
        this.#active = true;
        this.#applyTheme();
    }

    deactivate() {
        this.#active = false;
        this.#applyTheme();
    }

    get isActive() { return this.#active; }

    // ── Private helpers ───────────────────────────────────────────────

    #drawBorder(color = PlacerButton.#BORDER_IDLE) {
        this.#borderGfx.clear();
        this.#borderGfx.lineStyle(2, color, 1);
        this.#borderGfx.strokeRect(0, 0, PlacerButton.#WIDTH, PlacerButton.#HEIGHT);
    }

    #applyTheme() {
        const active = this.#active;
        this.#rect.setFillStyle(active ? PlacerButton.#FILL_ACTIVE : PlacerButton.#FILL_IDLE);
        this.#drawBorder(active ? PlacerButton.#BORDER_ACTIVE : PlacerButton.#BORDER_IDLE);
        this.#label.setColor(active ? PlacerButton.#TEXT_ACTIVE : PlacerButton.#TEXT_IDLE);
    }

    #registerPointerEvents(structureType) {
        this.#rect.on('pointerover', () => {
            if (!this.#active)
                this.#rect.setFillStyle(PlacerButton.#FILL_HOVER);
        });

        this.#rect.on('pointerout', () => {
            if (!this.#active)
                this.#rect.setFillStyle(PlacerButton.#FILL_IDLE);
        });

        this.#rect.on('pointerdown', () =>
            this.emit('select', structureType, this)
        );
    }
}


/**
 * Toolbar container that holds one PlacerButton per placeable structure
 * and coordinates mutual exclusion between them.
 */
class PlacerContainer extends Phaser.GameObjects.Container {
    #placer;
    #progressManager;
    #activeButton = null;
    #buttons = [];

    static #PADDING_X = 8;
    static #PADDING_Y = 8;
    static #BUTTON_GAP = 6;
    static #BUTTON_HEIGHT = 36;

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       cx   - Center x
     * @param {number}       cy   - Center y
     */
    constructor(scene, cx, cy) {
        super(scene, cx, cy);
        this.#placer = scene.registry.get(globalConfig.registryKeys.placer);
        this.#progressManager = scene.registry.get(globalConfig.registryKeys.progressManager);

        this.#createButtons();

        // listen for change in active structure
        scene.registry.events.on(
            `changedata-${globalConfig.registryKeys.placerActiveStructure}`,
            (_parent, value) => { if (value === null) this.#deactivateAll(); }
        );

        // listen for change in progress
        scene.registry.events.on(
            `changedata-${globalConfig.registryKeys.progress}`,
            (_parent, _state) => {
                this.#destroyButtons();
                this.#createButtons();
            }
        );

        scene.add.existing(this);
    }

    // ── Private helpers ───────────────────────────────────────────────

    #createButtons() {
        Object.values(globalConfig.structures)
            .filter(s => s.placerLabel !== undefined)
            .filter(s => this.#progressManager.isUnlocked(s.internalType))
            .forEach((s, i) => this.#addButton(s, i));
    }

    #addButton(structure, index) {
        const x = PlacerContainer.#PADDING_X;
        const y = PlacerContainer.#PADDING_Y
            + index * (PlacerContainer.#BUTTON_HEIGHT + PlacerContainer.#BUTTON_GAP);

        const btn = new PlacerButton(
            this.scene, x, y, structure.placerLabel, structure.internalType
        );

        btn.on('select', (structureType, sender) =>
            this.#onButtonSelect(structureType, sender)
        );

        this.add(btn);
        this.#buttons.push(btn);
    }

    #onButtonSelect(structureType, sender) {
        if (this.#activeButton === sender) {
            this.#placer.deselect();
            sender.deactivate();
            this.#activeButton = null;
        } else {
            this.#activeButton?.deactivate();
            this.#placer.select(structureType);
            sender.activate();
            this.#activeButton = sender;
        }
    }

    #deactivateAll() {
        this.#activeButton?.deactivate();
        this.#activeButton = null;
    }

    #destroyButtons() {
        console.log('destroying buttons');
        this.#deactivateAll();
        this.#buttons.forEach(btn => btn.destroy());
        this.#buttons = [];
    }
}