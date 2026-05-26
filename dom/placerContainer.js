class PlacerContainer extends Phaser.GameObjects.Container {
    #hudScene;
    #placer;

    #activeButton;
    #border;

    #paddingLeft = 8;
    #paddingTop = 8;
    #betweenGap = 6;
    #buttonWidth = 100;
    #buttonHeight = 36;
    #fillColorIdle = 0x16213e;
    #fillColorActive = 0x1d3557;
    #borderColorIdle = 0x457b9d;
    #borderColorActive = 0xa8dadc;

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
            const y = this.#paddingTop + i * (this.#buttonHeight + this.#betweenGap);

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

        // Background rectangle (acts as the hit area)
        const button = this.#hudScene.add.rectangle(x, y, this.#buttonWidth, this.#buttonHeight, this.#fillColorIdle)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });
        this.add(button);

        // Border drawn with Graphics
        this.#border = this.#hudScene.add.graphics().setDepth(11);

        this.#drawBorder(x, y, false);
        this.add(this.#border);

        // Label text
        const text = this.#hudScene.add.text(x + this.#buttonWidth / 2, y + this.#buttonHeight / 2, label, {
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
                button.setFillStyle(this.#fillColorIdle);
                this.#drawBorder(x, y, false);
            }
        });

        button.on('pointerdown', () => {

            if (this.#activeButton === button) {
                // Clicking the active button deselects
                this.#placer.deselect();
                this.#setButtonState(x, y, button, text, false, this.#fillColorIdle);
                this.#activeButton = null;
            } else {
                // Deactivate previously active button
                if (this.#activeButton) {
                    this.#activeButton.emit('_deactivate');
                }
                this.#placer.select(structureType);
                this.#setButtonState(x, y, button, text, true, this.#fillColorActive);
                this.#activeButton = button;
            }
        });

        // Internal deactivate event so sibling buttons can reset each other
        button.on('_deactivate', () => {
            this.#setButtonState(x, y, button, text, false, this.#fillColorIdle, this.#borderColorIdle);
        });
    }

    #drawBorder(x, y, active) {
        const borderColor = active ? this.#borderColorActive : this.#borderColorIdle;

        this.#border.clear();
        this.#border.lineStyle(2, borderColor, 1);
        this.#border.strokeRect(x, y, this.#buttonWidth, this.#buttonHeight);
    };

    #setButtonState(x, y, button, text, active, fillColor) {
        button.setFillStyle(fillColor);
        this.#drawBorder(x, y, active);
        text.setColor(active ? '#ffffff' : '#a8dadc');
    }

    #clearButtonStates() {
        if (this.#activeButton) {
            this.#activeButton.emit('_deactivate');
            this.#activeButton = null;
        }
    }
}