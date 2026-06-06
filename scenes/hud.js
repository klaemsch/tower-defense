class HudScene extends Phaser.Scene {
    #progressBar;

    #enemyManager;
    #gameFlowManager;

    constructor() {
        super(globalConfig.sceneKeys.hud);
    }

    preload() { }

    create() {
        this.#registerEventListeners();

        this.#enemyManager = this.registry.get(globalConfig.registryKeys.enemyManager);
        this.#gameFlowManager = this.registry.get(globalConfig.registryKeys.gameFlowManager);

        // ── Resources ──────────────────────────────────────────────────────
        new ResourceContainer(this, 0, 0);
        //this.#newHUDText(8, 8 + 4 * 22, 'enemies', 'Enemies');  // TODO: enemies is not a resource, should not be registry but enemy manager and enemies group

        // ── Inventory with buttons ──────────────────────────────────────────────
        new InventoryContainer(this, this.scale.width - 140, 0);

        // ── Control Buttons ──────────────────────────────────────────────────────
        this.#createPauseToggle();
        this.#createTimeScaleToggle();

        this.#progressBar = new ProgressBar(this, {
            leftIcon: '▶',
            rightIcon: '⚑',
        }).setDepth(globalConfig.depthMap.progressBar);
    }

    update(time, delta) {
        delta = delta * this.time.timeScale;  // TODO check if this works
        const progress = this.#gameFlowManager.getOverallProgressOfCurrentTimer();
        this.#progressBar.setProgress(progress); // TODO: doing this every loop is a bit unnecessary

        this.registry.set('enemies', this.#enemyManager.enemies.getLength()); // TODO: doing this every loop is a bit unnecessary
    }

    destroy() {
        this.#destroyEventListeners();
    }

    #registerEventListeners() {
        console.log('hud register event listeners');
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
        
        const pauseResumeState = this.registry.get(globalConfig.registryKeys.pauseResumeState);
        const textElement = this.add.text(x + WIDTH / 2, y + HEIGHT / 2, pauseResumeState ? resumeLabel : pauseLabel, {
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

    #createTimeScaleToggle() {
        const btn = new RoundedButton(this, 8 + 50, 140 + 70, 100, 36, '1x', {
            fontSize: '13px',
            textColor: '#a8dadc',
        })
            .on('pointerdown', () => {
                if (this.#getTimeScale() === 1) {
                    this.#setTimeScale(2);
                    btn.setText('2x');
                } else if (this.#getTimeScale() === 2) {
                    this.#setTimeScale(3);
                    btn.setText('3x');
                } else if (this.#getTimeScale() === 3) {
                    this.#setTimeScale(1);
                    btn.setText('1x');
                }
            })
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

        const button = new RoundedButton(this, cx, cy + 70, 100, 38, 'Restart Game', {
            fontSize: '13px',
            textColor: '#a8dadc',
        })
            .setDepth(globalConfig.depthMap.gameOverText)
            .on('pointerdown', () => {
                console.log('restart button pressed');
                location.reload();
            })

        // pause scene so buttons arent clickable anymore
        // TODO: at the moment the placer buttons are working in the background
        // pausing the scene solves this, but then the restart button also does not work anymore
        // solution 1: create new 'gameOverScene', so we can pause the hudScene
        // solution 2: on gameOver event, set a flag to disable or destroy the buttons
        //this.scene.pause();
    }

    #setTimeScale(multiplier = 1) {
        this.game.scene.scenes.forEach((scene) => {
            scene.time.timeScale = multiplier;
            scene.tweens.timeScale = 1 / multiplier;  // cancel out the time scale for tweens
        });
    }

    #getTimeScale() {
        return this.time.timeScale;
    }
}