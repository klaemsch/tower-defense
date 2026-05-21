class HudScene extends Phaser.Scene {
    #activeButton;
    #progressBar;

    #enemyManager;
    #placer;
    #gameFlowManager;

    constructor() {
        super(config.sceneKeys.hud);
        this.#activeButton = null;
    }

    preload() { }

    create() {
        this.#enemyManager = this.registry.get(config.registryKeys.enemyManager);
        this.#placer = this.registry.get(config.registryKeys.placer);
        this.#gameFlowManager = this.registry.get(config.registryKeys.gameFlowManager);

        // ── Resources ──────────────────────────────────────────────────────
        new ResourceContainer(this, 0, 0);
        //this.#newHUDText(8, 8 + 4 * 22, 'enemies', 'Enemies');  // TODO: enemies is not a resource, should not be registry but enemy manager and enemies group

        // ── Placement buttons ──────────────────────────────────────────────
        new PlacerContainer(this, this.scale.width - 120, 0);

        // ── Control Buttons ──────────────────────────────────────────────────────
        this.#createPauseToggle();

        this.#progressBar = new ProgressBar(this, {
            leftIcon: '▶',
            rightIcon: '⚑',
        }).setDepth(150);
    }

    update(time, delta) {
        if (this.#enemyManager.spawnTimer) {
            const progress = this.#enemyManager.spawnTimer.getOverallProgress();
            this.#progressBar.setProgress(progress);
        }

        this.registry.set('enemies', this.#enemyManager.enemies.getLength()); // TODO: doing this every loop is a bit unnecessary
    }

    /*#createPlacerButtons() {
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
        this.registry.events.on(`changedata-${config.registryKeys.placerActiveStructure}`, (parent, value) => {
            if (value === null) this.#clearButtonStates();
        });
    }*/

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

        const textElement = this.add.text(x + WIDTH / 2, y + HEIGHT / 2, this.registry.get(config.registryKeys.pauseResumeState) ? resumeLabel : pauseLabel, {
            fontSize: '11px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(12);

        // listen for game state change
        this.registry.events.on(`changedata-${config.registryKeys.pauseResumeState}`, (parent, isPaused) => {
            //console.log('paused:', isPaused);
            if (isPaused) {
                textElement.text = resumeLabel;
            } else {
                textElement.text = pauseLabel;
            }
        });
    }

    // ── HUD text ──────────────────────────────────────────────────────────────

    /*#newHUDText(x, y, registryKey, label) {
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
    }*/

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
}