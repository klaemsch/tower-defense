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
        }).setDepth(globalStyles.depthMap.progressBar);
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

        const x = 58;
        const y = 3 * globalConfig.world.tileSize;

        const pauseResumeState = this.registry.get(globalConfig.registryKeys.pauseResumeState);

        const btn = new RoundedButton(this, x, y, pauseResumeState ? resumeLabel : pauseLabel, {
            fontSize: globalStyles.text.sizes.medium,
            textColor: globalStyles.text.colors.base,
        })
            .on('pointerdown', () => {
                this.#gameFlowManager.togglePauseWave();
            })

        // listen for game state change
        this.registry.events.on(`changedata-${globalConfig.registryKeys.pauseResumeState}`, (parent, isPaused) => {
            if (isPaused) {
                btn.setText(resumeLabel);
            } else {
                btn.setText(pauseLabel);
            }
        });
    }

    #createTimeScaleToggle() {
        const x = 58;
        const y = 4 * globalConfig.world.tileSize;

        const btn = new RoundedButton(this, x, y, '1x', {
            fontSize: globalStyles.text.sizes.medium,
            textColor: globalStyles.text.colors.base,
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

        this.add.rectangle(cx, cy, numCols * tileSize, numRows * tileSize, 0x000000, 0.65).setDepth(globalStyles.depthMap.gameOverRect);

        this.add.text(cx, cy - 30, titleText, {
            fontSize: globalStyles.text.sizes.title, color: globalStyles.text.colors.warning, fontStyle: 'bold',
            //stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(globalStyles.depthMap.gameOverText);

        this.add.text(cx, cy + 24, subtitleText, {
            fontSize: globalStyles.text.sizes.large, color: globalStyles.text.colors.highlight,
        }).setOrigin(0.5).setDepth(globalStyles.depthMap.gameOverText);

        new RoundedButton(this, cx, cy + 70, 'Restart Game', {
            width: globalStyles.buttons.medium.width,
            height: globalStyles.buttons.medium.height,
            fontSize: globalStyles.text.sizes.medium,
            textColor: globalStyles.text.colors.base,
        })
            .setDepth(globalStyles.depthMap.gameOverText)
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
        console.log('Set time scale to', multiplier);
        this.game.scene.scenes.forEach((scene) => {
            scene.time.timeScale = multiplier;
            scene.tweens.timeScale = 1 / multiplier;  // cancel out the time scale for tweens
        });
    }

    #getTimeScale() {
        return this.time.timeScale;
    }
}