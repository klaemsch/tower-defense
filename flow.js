class GameFlowManager {
    #scene;
    #waveIndex = 0;
    #waveData;
    #currentWave = null;
    #enemyManager;

    constructor(scene) {
        this.#scene = scene; // TODO: undestand the difference between this.#scene and this.#scene.scene
        this.#enemyManager = scene.enemyManager;
        this.#waveData = config.waves;
        this.#scene.registry.set('isPaused', false);

        // subscribe to event that fires when an enemy is destroyed -> check if wave is completed
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
        this.#scene.registry.set('isPaused', true);
    }

    resumeWave() {
        console.log('resumeWave called');
        this.#scene.scene.resume();
        this.#enemyManager.resumeSpawning();
        this.#scene.registry.set('isPaused', false);
    }

    togglePauseWave() {
        console.log('togglePauseWave called');
        if (this.#scene.scene.isPaused() != this.#scene.registry.get('isPaused')) console.error('scene state and registry state mismatch!');
        if (this.#scene.scene.isPaused()) {
            this.resumeWave();
        } else {
            this.pauseWave();
        }
    }

    // ── Wave Management ──────────────────────────────────────────────────────

    #startNextWave() {
        const wave = this.#waveData[this.#waveIndex];
        if (!wave) return;
        this.#currentWave = wave;

        // Start spawning enemies via EnemyManager
        this.#enemyManager.startSpawning(wave.spawnRate, wave.lengthInSeconds / (wave.spawnRate / 1000));
    }

    #checkWaveCompleted(enemiesLeft) {
        // get progress of wave spawn timer -> 1 means all enemies have been spawned
        const timerProgress = this.#enemyManager.spawnTimer.getOverallProgress();
        //console.log('progress:', timerProgress);
        
        // if all enemies have been spawned AND destroyed
        if (timerProgress == 1 && enemiesLeft <= 0) {
            //console.log('wave completed')
            this.#scene.scene.sleep(config.sceneKeys.game);
            this.#scene.scene.wake(config.sceneKeys.shop);
        }
    }

    isPaused() {
        return this.#scene.registry.get('isPaused');
    }
}