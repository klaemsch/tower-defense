class GameFlowManager {
    #scene;
    #waveIndex = 0;
    #waveData;
    #currentWave = null;
    #enemyManager;
    #isPaused;

    constructor(scene) {
        this.#scene = scene;
        this.#enemyManager = scene.enemyManager;
        this.#waveData = config.waves;
        this.#isPaused = true;

        scene.events.on(config.enemy.onDestroyEventKey, this.#checkWaveCompleted, this);
    }

    // ── Public API ───────────────────────────────────────────────────────────

    startWave() {
        console.log('startWave called');
        this.#startNextWave();
    }

    pauseWave() {
        console.log('pauseWave called');
        this.#scene.sys.pause();
        this.#enemyManager.pauseSpawning();
        this.#isPaused = true;
    }

    resumeWave() {
        console.log('resumeWave called');
        this.#scene.sys.resume();
        this.#enemyManager.resumeSpawning();
        this.#isPaused = false;
    }

    togglePauseWave() {
        console.log('togglePauseWave called');
        if (this.#scene.sys.isPaused()) {
            this.resumeWave();
            this.#isPaused = false;
        } else {
            this.pauseWave();
            this.#isPaused = true;
        }
    }

    // ── Wave Management ──────────────────────────────────────────────────────

    #startNextWave() {
        const wave = this.#waveData[this.#waveIndex];
        if (!wave) return;
        this.#currentWave = wave;

        // Emit wave start event
        //this.#scene.events.emit('wave-start', this.#waveIndex + 1, wave.enemyCount);

        // Start spawning enemies via EnemyManager
        this.#enemyManager.startSpawning(wave.spawnRate, wave.lengthInSeconds / (wave.spawnRate / 1000));

        // Wait for all enemies to be destroyed
        /*this.#scene.events.once('wave-completed', () => {
            this.#onWaveCompleted();
        });*/

        // Start wave timer (for next wave)
        //this.#startWaveTimer();
    }

    #checkWaveCompleted(enemiesLeft) {
        if (enemiesLeft <= 0) {
            console.log('wave completed')
            this.#showShopOverlay();
        }
    }

    /*#startWaveTimer() {
        this.#stopWaveTimer();

        const timer = this.#scene.time.addEvent({
            delay: this.#waveDelay,
            callback: () => {
                this.#startNextWave();
            },
            loop: false,
        });

        this.#waveTimer = timer;
    }

    #stopWaveTimer() {
        if (this.#waveTimer) {
            this.#waveTimer.remove();
            this.#waveTimer = null;
        }
    }

    #onWaveCompleted() {
        this.#waveIndex++;
        this.#scene.events.emit('wave-completed', this.#waveIndex);

        // Show shop overlay
        //this.#showShopOverlay();

        // Stop spawning
        this.#enemyManager.stopSpawning();
    }

    #onAllWavesComplete() {
        this.#isGameOver = true;
        this.#scene.events.emit('game-won');
        this.#scene.triggerGameOver();
    }*/

    // ── Shop Overlay ─────────────────────────────────────────────────────────

    #showShopOverlay() {
        const scene = this.#scene;

        // Create overlay
        const overlay = scene.add.rectangle(
            scene.scale.width / 2,
            scene.scale.height / 2,
            scene.scale.width,
            scene.scale.height,
            0x000000,
            0.7
        ).setDepth(100);

        const title = scene.add.text(scene.scale.width / 2, 100, 'Wave Complete!', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(101);

        const text = scene.add.text(scene.scale.width / 2, 150, 'You earned resources! Upgrade your towers.', {
            fontSize: '18px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(101);

        // Add continue button
        const continueBtn = scene.add.text(scene.scale.width / 2, 250, 'Continue', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#1d3557',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

        continueBtn.on('pointerdown', () => {
            overlay.destroy();
            title.destroy();
            text.destroy();
            continueBtn.destroy();
            this.#startNextWave();
        });

        // Add resource counter
        const wood = scene.registry.get(config.resources.wood.registryKey);
        const woodText = scene.add.text(scene.scale.width / 2, 200, `Wood: ${wood}`, {
            fontSize: '16px',
            color: '#a8dadc',
        }).setOrigin(0.5).setDepth(101);
    }

    isPaused() {
        return this.#isPaused;
    }
}