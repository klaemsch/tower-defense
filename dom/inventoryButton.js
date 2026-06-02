/**
 * Self-contained button that owns its rectangle, border graphics,
 * label text, and active/hover state.  Inventory just calls
 * activate() / deactivate() and listens to the 'select' event.
 */
class InventoryButton extends Phaser.GameObjects.Container {
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
     * @param {string}       itemConfig
     */
    constructor(scene, x, y, itemConfig) {
        super(scene, x, y);

        this.#rect = scene.add
            .rectangle(0, 0, InventoryButton.#WIDTH, InventoryButton.#HEIGHT, InventoryButton.#FILL_IDLE)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        this.#borderGfx = scene.add.graphics();
        this.#drawBorder();

        this.#label = scene.add.text(
            InventoryButton.#WIDTH / 2,
            InventoryButton.#HEIGHT / 2,
            itemConfig.inventoryLabel,
            { fontSize: '11px', color: InventoryButton.#TEXT_IDLE, fontStyle: 'bold' }
        ).setOrigin(0.5);

        this.add([this.#rect, this.#borderGfx, this.#label]);
        this.#registerPointerEvents(itemConfig);
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

    #drawBorder(color = InventoryButton.#BORDER_IDLE) {
        this.#borderGfx.clear();
        this.#borderGfx.lineStyle(2, color, 1);
        this.#borderGfx.strokeRect(0, 0, InventoryButton.#WIDTH, InventoryButton.#HEIGHT);
    }

    #applyTheme() {
        const active = this.#active;
        this.#rect.setFillStyle(active ? InventoryButton.#FILL_ACTIVE : InventoryButton.#FILL_IDLE);
        this.#drawBorder(active ? InventoryButton.#BORDER_ACTIVE : InventoryButton.#BORDER_IDLE);
        this.#label.setColor(active ? InventoryButton.#TEXT_ACTIVE : InventoryButton.#TEXT_IDLE);
    }

    #registerPointerEvents(itemConfig) {
        this.#rect.on('pointerover', () => {
            if (!this.#active)
                this.#rect.setFillStyle(InventoryButton.#FILL_HOVER);
        });

        this.#rect.on('pointerout', () => {
            if (!this.#active)
                this.#rect.setFillStyle(InventoryButton.#FILL_IDLE);
        });

        // when button/rect is pressed -> emit the pressed event, so other buttons can react
        this.#rect.on('pointerdown', () =>
            this.emit(globalConfig.eventKeys.inventoryButtonPressed, itemConfig, this)
        );
    }
}
