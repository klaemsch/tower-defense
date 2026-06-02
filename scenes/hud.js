class HudScene extends Phaser.Scene {
    #activeButton;
    #progressBar;

    #enemyManager;
    #placer;
    #gameFlowManager;

    constructor() {
        super(globalConfig.sceneKeys.hud);
        this.#activeButton = null;
    }

    preload() { }

    create() {
        this.#registerEventListeners();

        this.#enemyManager = this.registry.get(globalConfig.registryKeys.enemyManager);
        this.#placer = this.registry.get(globalConfig.registryKeys.placer);
        this.#gameFlowManager = this.registry.get(globalConfig.registryKeys.gameFlowManager);

        // ── Resources ──────────────────────────────────────────────────────
        new ResourceContainer(this, 0, 0);
        //this.#newHUDText(8, 8 + 4 * 22, 'enemies', 'Enemies');  // TODO: enemies is not a resource, should not be registry but enemy manager and enemies group

        // ── Inventory with buttons ──────────────────────────────────────────────
        new InventoryContainer(this, this.scale.width - 140, 0);

        // ── Control Buttons ──────────────────────────────────────────────────────
        this.#createPauseToggle();

        this.#progressBar = new ProgressBar(this, {
            leftIcon: '▶',
            rightIcon: '⚑',
        }).setDepth(globalConfig.depthMap.progressBar);
    }

    update(time, delta) {
        const progress = this.#gameFlowManager.getOverallProgressOfCurrentTimer();
        this.#progressBar.setProgress(progress);

        this.registry.set('enemies', this.#enemyManager.enemies.getLength()); // TODO: doing this every loop is a bit unnecessary
    }

    destroy() {
        this.#destroyEventListeners();
    }

    #registerEventListeners() {
        this.game.events.on(globalConfig.eventKeys.gameOver, () => this.#showGameOver(globalConfig.texts.gameOverTitle, globalConfig.texts.gameOverSubtitle));
        this.game.events.on(globalConfig.eventKeys.gameWon, () => this.#showGameOver(globalConfig.texts.gameWonTitle, globalConfig.texts.gameWonSubtitle));
    }

    #destroyEventListeners() {
        this.game.events.off(globalConfig.eventKeys.gameOver);
        this.game.events.off(globalConfig.eventKeys.gameWon);
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

        const textElement = this.add.text(x + WIDTH / 2, y + HEIGHT / 2, this.registry.get(globalConfig.registryKeys.pauseResumeState) ? resumeLabel : pauseLabel, {
            fontSize: '11px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(12);

        // listen for game state change
        this.registry.events.on(`changedata-${globalConfig.registryKeys.pauseResumeState}`, (parent, isPaused) => {
            if (isPaused) {
                textElement.text = resumeLabel;
            } else {
                textElement.text = pauseLabel;
            }
        });
    }

    #showGameOver(titleText, subtitleText) {
        const { tileSize, numCols, numRows } = globalConfig.world;
        const cx = (numCols * tileSize) / 2;
        const cy = (numRows * tileSize) / 2;

        console.log('game over triggered');

        this.add.rectangle(cx, cy, numCols * tileSize, numRows * tileSize, 0x000000, 0.65).setDepth(globalConfig.depthMap.gameOverRect);

        this.add.text(cx, cy - 30, titleText, {
            fontSize: '48px', color: '#e63946', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(globalConfig.depthMap.gameOverText);

        this.add.text(cx, cy + 24, subtitleText, {
            fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5).setDepth(globalConfig.depthMap.gameOverText);

        // pause scene so buttons arent clickable anymore
        this.scene.pause();
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