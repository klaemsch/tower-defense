class GameFlowManager {
    #gameScene;
    #waveIndex = 0;
    #waveData;
    #currentWave = null;
    #enemyManager;
    #peacePeriodTimer;

    constructor(gameScene) {
        this.#gameScene = gameScene; // TODO: undestand the difference between this.#scene and this.#scene.scene
        this.#enemyManager = this.#gameScene.registry.get(config.registryKeys.enemyManager);
        this.#waveData = config.waves;
        this.#gameScene.registry.set(config.registryKeys.pauseResumeState, false);

        // subscribe to event that fires when an enemy is destroyed -> check if wave is completed
        this.#gameScene.game.events.on(config.eventKeys.enemyDestroyed, this.#checkWaveCompleted, this);

        this.#resetPeacePeriodTimer();
    }

    // ── Public API ───────────────────────────────────────────────────────────

    startWave() {
        console.log('startWave called');
        this.#startNextWave();
    }

    pauseWave() {
        console.log('pauseWave called');
        this.#gameScene.scene.pause();
        this.#enemyManager.pauseSpawning();
        this.#gameScene.registry.set(config.registryKeys.pauseResumeState, true);
    }

    resumeWave() {
        console.log('resumeWave called');
        this.#gameScene.scene.resume();
        this.#enemyManager.resumeSpawning();
        this.#gameScene.registry.set(config.registryKeys.pauseResumeState, false);
    }

    togglePauseWave() {
        console.log('togglePauseWave called');
        if (this.#gameScene.scene.isPaused() != this.#gameScene.registry.get(config.registryKeys.pauseResumeState)) console.error('scene state and registry state mismatch!');
        if (this.#gameScene.scene.isPaused()) {
            this.resumeWave();
        } else {
            this.pauseWave();
        }
    }

    isPaused() {
        return this.#gameScene.registry.get(config.registryKeys.pauseResumeState);
    }

    // ── Wave Management ──────────────────────────────────────────────────────

    #startNextWave() {
        const wave = this.#waveData[this.#waveIndex];
        if (!wave) return;
        this.#currentWave = wave;

        // Start spawning enemies via EnemyManager
        this.#enemyManager.startSpawning(wave.spawnRate, wave.lengthInSeconds / (wave.spawnRate / 1000));
    }

    #checkWaveCompleted() {
        // get progress of wave spawn timer -> 1 means all enemies have been spawned
        const timerProgress = this.#enemyManager.spawnTimer.getOverallProgress();
        //console.log('progress:', timerProgress);

        // at the time this event fires, the enemy that died is not yet removed from the enemies group so we need to subtract 1
        const enemiesLeft = this.#enemyManager.enemies.getLength() - 1;

        // if all enemies have been spawned AND destroyed
        if (timerProgress == 1 && enemiesLeft <= 0) {
            //console.log('wave completed')
            // pause game and open shop
            this.#gameScene.game.events.emit(config.eventKeys.gamePause);
            this.#gameScene.game.events.emit(config.eventKeys.shopOpen);
        }
    }

    #resetPeacePeriodTimer() {
        if (!this.#peacePeriodTimer) {
            this.#peacePeriodTimer = this.#gameScene.time.delayedCall(
                3000,
                () => {
                    console.log('peace period ended, start next wave')
                    this.#startNextWave();
                }
            );
        }
        else {
            this.#peacePeriodTimer.reset();
        }
    }
}