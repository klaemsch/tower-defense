class GameFlowManager {
    #scene;
    #waveIndex = 0;
    #waveData;
    #currentWave = null;
    #enemyManager;
    #isPaused;

    constructor(scene) {
        this.#scene = scene; // TODO: undestand the difference between this.#scene and this.#scene.scene
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
        this.#scene.scene.pause();
        this.#enemyManager.pauseSpawning();
        this.#isPaused = true;
    }

    resumeWave() {
        console.log('resumeWave called');
        this.#scene.scene.resume();
        this.#enemyManager.resumeSpawning();
        this.#isPaused = false;
    }

    togglePauseWave() {
        console.log('togglePauseWave called');
        if (this.#scene.scene.isPaused()) {
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
        const timerProgress = this.#enemyManager.spawnTimer.getOverallProgress();
        console.log('progress:', timerProgress);
        if (timerProgress == 1 && enemiesLeft <= 0) {
            console.log('wave completed')
            this.#scene.scene.wake(config.sceneKeys.shop);
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

    isPaused() {
        return this.#isPaused;
    }
}