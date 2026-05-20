class HudScene extends Phaser.Scene {
    #activeButton;
    #progressBar;

    #placer;
    #gameFlowManager;

    constructor() {
        super(config.sceneKeys.hud);
        this.#activeButton = null;
    }

    preload() { }

    create() {
        this.#gameFlowManager = this.registry.get('gameFlowManager');
        this.#placer = this.registry.get('placer');

        // ── Resources ──────────────────────────────────────────────────────
        this.#createResourceTexts();
        this.#newHUDText(8, 8 + 4 * 22, 'enemies', 'Enemies');  // TODO: enemies is not a resource, should not be registry but enemy manager and enemies group

        // ── Placement buttons ──────────────────────────────────────────────
        this.#createPlacerButtons();

        // ── Control Buttons ──────────────────────────────────────────────────────
        this.#createPauseToggle();

        this.#progressBar = new ProgressBar(this, {
            leftIcon: '▶',
            rightIcon: '⚑',
        }).setDepth(150);
    }

    update() {
        // update
        this.#progressBar.setProgress(0.65);
    }

    #createResourceTexts() {
        const resources = Object.values(config.resources);

        resources.forEach((resource, i) => {
            const { registryKey, label } = resource;
            //console.debug(`Creating HUD Text for resource ${label}`);
            this.#newHUDText(8, 8 + i * 22, registryKey, label);
        });
    }

    #createPlacerButtons() {
        const placeableStructures = Object.values(config.structures)
            .filter(s => s.placerLabel !== undefined);

        placeableStructures.forEach((structure, i) => {
            const { internalType, placerLabel } = structure;
            const x = this.scale.width - 110;
            const y = 8 + i * 42;
            this.#newPlacerButton(x, y, internalType, placerLabel);
        });

        // Listen for deselect from placer (e.g. after placing or pressing Escape)
        // so the button highlight clears automatically
        this.registry.events.on('changedata-placer-activeStructure', (parent, value) => {
            if (value === null) this.#clearButtonStates();
        });
    }

    #createPauseToggle() {
        const pauseLabel = '⏸️ Pause';
        const resumeLabel = '▶️ Resume';

        const x = 8;
        const y = 140;
        const WIDTH = 100;
        const HEIGHT = 36;
        const COLOR_IDLE = 0x16213e;

        this.add.rectangle(x, y, WIDTH, HEIGHT, COLOR_IDLE)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.#gameFlowManager.togglePauseWave();
            });

        const textElement = this.add.text(x + WIDTH / 2, y + HEIGHT / 2, this.registry.get('isPaused') ? resumeLabel : pauseLabel, {
            fontSize: '11px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(12);

        // listen for game state change
        this.registry.events.on('changedata-isPaused', (parent, isPaused) => {
            //console.log('paused:', isPaused);
            if (isPaused) {
                textElement.text = resumeLabel;
            } else {
                textElement.text = pauseLabel;
            }
        });
    }

    // ── HUD text ──────────────────────────────────────────────────────────────

    #newHUDText(x, y, registryKey, label) {
        const initValue = this.registry.get(registryKey);
        const textElement = this.add.text(x, y, `${label} ${initValue}`, {
            fontSize: '13px',
            color: '#a8dadc',
            fontStyle: 'bold',
            backgroundColor: '#00000066',
            padding: { x: 6, y: 3 },
        }).setDepth(10);

        this.registry.events.on(`changedata-${registryKey}`, (parent, value) => {
            textElement.setText(`${label} ${value}`);
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

    #newControlButton(x, y, action, label) {
        const WIDTH = 100;
        const HEIGHT = 36;
        const COLOR_IDLE = 0x16213e;
        const COLOR_ACTIVE = 0x1d3557;

        const button = this.add.rectangle(x, y, WIDTH, HEIGHT, COLOR_IDLE)
            .setOrigin(0, 0)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x + WIDTH / 2, y + HEIGHT / 2, label, {
            fontSize: '11px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(12);

        const event = button.on('pointerdown', () => {
            switch (action) {
                case 'play':
                    this.#gameFlowManager.startWave();
                    break;
                case 'toggle':
                    if (this.#gameFlowManager.isPaused()) {
                        text.text = '▶️ Resume';
                    } else {
                        text.text = '⏸️ Pause';
                    }
                    this.#gameFlowManager.togglePauseWave();
                    break;
            }
        });

        // Optional: update button state based on game flow
        this.events.on('wave-start', () => {
            //this.#updateButtonState(button, text, 'play', '▶️ Start');
        });

        return { button, text, event };
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