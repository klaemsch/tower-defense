class GameFlowManager {
    #gameScene;
    #flowIndex;
    #flowData;
    #enemyManager;
    #peacePeriodTimer;

    constructor(gameScene) {
        this.#gameScene = gameScene; // TODO: undestand the difference between this.#scene and this.#scene.scene
        this.#enemyManager = this.#gameScene.registry.get(globalConfig.registryKeys.enemyManager);

        this.#flowIndex = 0;
        this.#flowData = globalConfig.flow;

        // init pauseResumeState
        this.#gameScene.registry.set(globalConfig.registryKeys.pauseResumeState, false);

        // subscribe to event that fires when an enemy is destroyed -> check if wave is completed
        this.#gameScene.game.events.on(globalConfig.eventKeys.enemyDestroyed, this.#checkWaveCompleted, this);

        // subscribe to event that fires when shop is closed -> start peace period timer
        this.#gameScene.game.events.on(globalConfig.eventKeys.shopClose, this.#startNextStep, this);

        this.#startNextStep();
    }

    // ── Public API ───────────────────────────────────────────────────────────

    startWave() {
        console.log('startWave called');
        this.#startNextStep();
    }

    pauseWave() {
        console.log('pauseWave called');
        this.#gameScene.scene.pause();
        this.#enemyManager.pauseSpawning();
        this.#gameScene.registry.set(globalConfig.registryKeys.pauseResumeState, true);
    }

    resumeWave() {
        console.log('resumeWave called');
        this.#gameScene.scene.resume();
        this.#enemyManager.resumeSpawning();
        this.#gameScene.registry.set(globalConfig.registryKeys.pauseResumeState, false);
    }

    togglePauseWave() {
        console.log('togglePauseWave called');
        if (this.#gameScene.scene.isPaused() != this.#gameScene.registry.get(globalConfig.registryKeys.pauseResumeState)) console.error('scene state and registry state mismatch!');
        if (this.#gameScene.scene.isPaused()) {
            this.resumeWave();
        } else {
            this.pauseWave();
        }
    }

    isPaused() {
        return this.#gameScene.registry.get(globalConfig.registryKeys.pauseResumeState);
    }

    getOverallProgressOfCurrentTimer() {
        const currentStep = this.getCurrentStep();
        if (!currentStep) return;

        if (currentStep.type === 'wave') {
            return this.#enemyManager.spawnTimer.getOverallProgress();
        } else if (currentStep.type === 'peace') {
            return this.#peacePeriodTimer.getOverallProgress();
        }
    }

    getCurrentStep() {
        const currentStep = this.#flowData[this.#flowIndex];
        if (!currentStep) {
            //console.error('couldnt get current step')
            return null;
        }
        return currentStep;
    }

    hasWon() {
        return this.#flowIndex >= this.#flowData.length;
    }


    // ── Wave Management ──────────────────────────────────────────────────────

    #checkWaveCompleted() {
        // get progress of wave spawn timer -> 1 means all enemies have been spawned
        const timerProgress = this.#enemyManager.spawnTimer.getOverallProgress();
        //console.log('progress:', timerProgress);

        // at the time this event fires, the enemy that died is not yet removed from the enemies group so we need to subtract 1
        const enemiesLeft = this.#enemyManager.enemies.getLength() - 1;

        // if all enemies have been spawned AND destroyed
        if (timerProgress == 1 && enemiesLeft <= 0) {

            const currentStep = this.getCurrentStep()
            this.#gameScene.registry.inc(globalConfig.resources.token.registryKey, currentStep.reward);

            console.log(`wave completed, reward: ${currentStep.reward}`)

            // mark current wave as done
            this.#flowData[this.#flowIndex].finished = true;
            this.#flowIndex++;

            if (this.hasWon()) {
                this.#gameScene.game.events.emit(globalConfig.eventKeys.gameWon);
            } else {
                // pause game and open shop
                this.#gameScene.game.events.emit(globalConfig.eventKeys.gamePause);
                this.#gameScene.game.events.emit(globalConfig.eventKeys.shopOpen);
            }
        }
    }

    #startNextStep() {
        console.log('start next steps');
        console.log(this.#flowData);

        if (this.hasWon()) {
            console.log('last wave survived');
            this.#gameScene.game.events.emit(globalConfig.eventKeys.gameWon);
        }

        const currentStep = this.getCurrentStep();
        if (!currentStep) return;

        if (currentStep.started) {
            // currentStep was already started, this means its finished, mark and continue to next step
            currentStep.finished = true;
            this.#flowIndex++;
            this.#startNextStep();
        } else {
            // use this step
            currentStep.started = true;

            switch (currentStep.type) {
                case 'wave':
                    // Start spawning enemies via enemyManager
                    this.#gameScene.game.events.emit(globalConfig.eventKeys.gameOver);
                    console.log('GameFlowManager starts spawning enemies');
                    this.#enemyManager.startSpawning(currentStep.spawnRate, currentStep.lengthInSeconds / (currentStep.spawnRate / 1000));
                    break;
                case 'peace':
                    // Start spawning enemies via EnemyManager
                    console.log('GameFlowManager starts peace period timer');
                    this.#startPeacePeriodTimer(currentStep.lengthInSeconds * 1000);
                    break;
                default:
                    console.warn('unknown default switch for flow type');
                    break;
            }
        }
    }

    #startPeacePeriodTimer(delayInMs = 3000) {
        this.#peacePeriodTimer?.remove();
        this.#peacePeriodTimer = this.#gameScene.time.delayedCall(
            delayInMs,
            () => this.#peacePeriodCallback(),
        );
    }

    #peacePeriodCallback() {
        console.log('peace period ended, start next wave')
        this.#startNextStep();
    }
}