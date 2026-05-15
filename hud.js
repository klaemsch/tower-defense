class HudScene extends Phaser.Scene {
    #activeButton;
    #placer;

    constructor() {
        super('hudScene');
        this.#activeButton = null;
    }

    preload() { }

    create() {
        this.#placer = this.registry.get('placer');

        // ── Resources ──────────────────────────────────────────────────────
        this.#newHUDText(8, 8, config.resources.wood.registryKey, 0, config.resources.wood.label);
        this.#newHUDText(8, 30, 'enemies', 0, 'Enemies');

        // ── Placement buttons ──────────────────────────────────────────────
        this.#newPlacerButton(this.scale.width - 110, 8, 'woodShop', '🏪 Wood Shop');
        this.#newPlacerButton(this.scale.width - 110, 50, 'tower', '🗼 Tower');

        // Listen for deselect from placer (e.g. after placing or pressing Escape)
        // so the button highlight clears automatically
        this.registry.events.on('changedata-placer-activeStructure', (parent, value) => {
            if (value === null) this.#clearButtonStates();
        });
    }

    // ── HUD text ──────────────────────────────────────────────────────────────

    #newHUDText(x, y, label, initValue, text) {
        const textElement = this.add.text(x, y, `${text}: ${initValue}`, {
            fontSize: '13px',
            color: '#a8dadc',
            fontStyle: 'bold',
            backgroundColor: '#00000066',
            padding: { x: 6, y: 3 },
        }).setDepth(10);

        this.registry.events.on(`changedata-${label}`, (parent, value) => {
            textElement.setText(`${text}: ${value}`);
        });
    }

    // ── Placer buttons ────────────────────────────────────────────────────────

    #newPlacerButton(x, y, structureType, label) {
        const WIDTH = 100;
        const HEIGHT = 36;

        const COLOR_IDLE = 0x16213e;
        const COLOR_ACTIVE = 0x1d3557;
        const BORDER_IDLE = 0x457b9d;
        const BORDER_ACTIVE = 0xa8dadc;

        // Background rectangle (acts as the hit area)
        const button = this.add.rectangle(x, y, WIDTH, HEIGHT, COLOR_IDLE)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        // Border drawn with Graphics
        const border = this.add.graphics().setDepth(11);
        const drawBorder = (active) => {
            border.clear();
            border.lineStyle(2, active ? BORDER_ACTIVE : BORDER_IDLE, 1);
            border.strokeRect(x, y, WIDTH, HEIGHT);
        };
        drawBorder(false);

        // Label text
        const text = this.add.text(x + WIDTH / 2, y + HEIGHT / 2, label, {
            fontSize: '11px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(12);

        // ── Interaction ───────────────────────────────────────────────────
        button.on('pointerover', () => {
            if (this.activeButton !== button) {
                button.setFillStyle(0x1a3a5c);
            }
        });

        button.on('pointerout', () => {
            if (this.activeButton !== button) {
                button.setFillStyle(COLOR_IDLE);
                drawBorder(false);
            }
        });

        button.on('pointerdown', () => {

            if (this.activeButton === button) {
                // Clicking the active button deselects
                this.#placer.deselect();
                this.#setButtonState(button, border, text, false, COLOR_IDLE, BORDER_IDLE, drawBorder);
                this.activeButton = null;
            } else {
                // Deactivate previously active button
                if (this.activeButton) {
                    this.activeButton.emit('_deactivate');
                }
                this.#placer.select(structureType);
                this.#setButtonState(button, border, text, true, COLOR_ACTIVE, BORDER_ACTIVE, drawBorder);
                this.activeButton = button;
            }
        });

        // Internal deactivate event so sibling buttons can reset each other
        button.on('_deactivate', () => {
            this.#setButtonState(button, border, text, false, COLOR_IDLE, BORDER_IDLE, drawBorder);
        });

        return { button, border, text };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    #setButtonState(button, border, text, active, fillColor, borderColor, drawBorder) {
        button.setFillStyle(fillColor);
        drawBorder(active);
        text.setColor(active ? '#ffffff' : '#a8dadc');
    }

    #clearButtonStates() {
        if (this.activeButton) {
            this.activeButton.emit('_deactivate');
            this.activeButton = null;
        }
    }
}