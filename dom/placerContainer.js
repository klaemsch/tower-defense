class PlacerContainer extends Phaser.GameObjects.Container {
    #hudScene;
    #placer;

    #activeButton;

    #paddingLeft = 8;
    #paddingTop = 8;
    #betweenGap = 42;

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       cx      - Center x
     * @param {number}       cy      - Center y
     */
    constructor(scene, cx, cy) {
        super(scene, cx, cy);
        this.#hudScene = scene;
        this.#placer = this.#hudScene.registry.get(config.registryKeys.placer);

        const placeableStructures = Object.values(config.structures)
            .filter(s => s.placerLabel !== undefined);

        placeableStructures.forEach((structure, i) => {
            const { internalType, placerLabel } = structure;
            const x = this.#paddingLeft;
            const y = this.#paddingTop + i * this.#betweenGap;

            this.#newPlacerButton(x, y, internalType, placerLabel);
        });

        // Listen for deselect from placer (e.g. after placing or pressing Escape)
        // so the button highlight clears automatically
        this.#hudScene.registry.events.on(`changedata-${config.registryKeys.placerActiveStructure}`, (parent, value) => {
            if (value === null) this.#clearButtonStates();
        });

        scene.add.existing(this);
    }

    #newPlacerButton(x, y, structureType, label) {
        // TODO: move constants to class
        const WIDTH = 100;
        const HEIGHT = 36;

        const COLOR_IDLE = 0x16213e;
        const COLOR_ACTIVE = 0x1d3557;
        const BORDER_IDLE = 0x457b9d;
        const BORDER_ACTIVE = 0xa8dadc;

        // Background rectangle (acts as the hit area)
        const button = this.#hudScene.add.rectangle(x, y, WIDTH, HEIGHT, COLOR_IDLE)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });
        this.add(button);

        // Border drawn with Graphics
        const border = this.#hudScene.add.graphics().setDepth(11);
        const drawBorder = (active) => {
            border.clear();
            border.lineStyle(2, active ? BORDER_ACTIVE : BORDER_IDLE, 1);
            border.strokeRect(x, y, WIDTH, HEIGHT);
        };
        drawBorder(false);
        this.add(border);

        // Label text
        const text = this.#hudScene.add.text(x + WIDTH / 2, y + HEIGHT / 2, label, {
            fontSize: '11px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(12);
        this.add(text);

        // ── Interaction ───────────────────────────────────────────────────
        button.on('pointerover', () => {
            if (this.#activeButton !== button) {
                button.setFillStyle(0x1a3a5c);
            }
        });

        button.on('pointerout', () => {
            if (this.#activeButton !== button) {
                button.setFillStyle(COLOR_IDLE);
                drawBorder(false);
            }
        });

        button.on('pointerdown', () => {

            if (this.#activeButton === button) {
                // Clicking the active button deselects
                this.#placer.deselect();
                this.#setButtonState(button, border, text, false, COLOR_IDLE, BORDER_IDLE, drawBorder);
                this.#activeButton = null;
            } else {
                // Deactivate previously active button
                if (this.#activeButton) {
                    this.#activeButton.emit('_deactivate');
                }
                this.#placer.select(structureType);
                this.#setButtonState(button, border, text, true, COLOR_ACTIVE, BORDER_ACTIVE, drawBorder);
                this.#activeButton = button;
            }
        });

        // Internal deactivate event so sibling buttons can reset each other
        button.on('_deactivate', () => {
            this.#setButtonState(button, border, text, false, COLOR_IDLE, BORDER_IDLE, drawBorder);
        });

        return { button, border, text };
    }

    #setButtonState(button, border, text, active, fillColor, borderColor, drawBorder) {
        button.setFillStyle(fillColor);
        drawBorder(active);
        text.setColor(active ? '#ffffff' : '#a8dadc');
    }

    #clearButtonStates() {
        if (this.#activeButton) {
            this.#activeButton.emit('_deactivate');
            this.#activeButton = null;
        }
    }
}