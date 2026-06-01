class ProgressManager {

    static #DEFAULT_STATE = {
        unlockedStructures: globalConfig.world.structuresAvailableAtStart,
    };

    #gameScene;
    #state;

    constructor(gameScene) {
        this.#gameScene = gameScene;
        this.reset();
        this.#initResources();
        console.log('init progress manager');
    }

    // ── Structures ────────────────────────────────────────────────────

    /**
     * @param {string} structureType
     * @returns {boolean}
     */
    isUnlocked(structureType) {
        return this.#state.unlockedStructures.includes(structureType);
    }

    /**
     * @param {string} structureType
     */
    unlock(structureType) {
        if (structureType && structureType != '' && this.isUnlocked(structureType)) return;

        this.#state.unlockedStructures.push(structureType);
        this.#commit();
    }

    reset() {
        this.#state = structuredClone(ProgressManager.#DEFAULT_STATE);
        this.#commit();
    }

    // ── Private ───────────────────────────────────────────────────────

    #initResources() {
        //console.debug('initResources');
        for (const resource of Object.values(globalConfig.resources)) {
            const { registryKey, label, initialValue } = resource;
            //console.debug(`Setting ${registryKey} to ${initialValue}`);
            this.#gameScene.registry.set(registryKey, initialValue);
        }
    }

    /**
     * Write state to the registry so all scenes can react via changedata events.
     * A shallow clone is written so Phaser detects the change even if the
     * caller mutates the internal state object.
     */
    #commit() {
        this.#gameScene.registry.set(
            globalConfig.registryKeys.progress,
            { ...this.#state }
        );
    }
}