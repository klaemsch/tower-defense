class InventoryManager {

    static #DEFAULT_STATE = {
        items: globalConfig.world.itemsAtStart.map((itemString) => globalConfig.items[itemString]),
    };

    #gameScene;
    #state;

    constructor(gameScene) {
        this.#gameScene = gameScene;
        this.reset();
        this.#initResources();
        //console.log('init inventory manager');
    }

    addItem(itemConfig) {
        this.#state.items.push(itemConfig);
        this.#commit();
    }

    removeItem(itemConfig) {
        if (!this.hasItem(itemConfig)) return;
        this.#state.items = this.#state.items.filter((i) => i != itemConfig);
        this.#commit();
    }

    hasItem(itemConfig) {
        return this.#state.items.indexOf(itemConfig) != -1;
    }

    getItem(itemConfig) {
        const index = this.#state.items.indexOf(itemConfig);
        if (index == -1) return;
        return this.#state.items[index];
    }

    getItems() {
        return this.#state.items;
    }

    canUseItem(itemConfig) {
        console.log('canUseItem')
        const item = this.getItem(itemConfig);
        if (!item || item.inventoryQuantity <= 0) {
            console.log('cant use this item, it does not exist in the inventory ', itemConfig);
            return false;
        }
        return true;
    }

    useItem(itemConfig) {
        console.log('useItem')
        if (!this.canUseItem(itemConfig)) return false;
        const item = this.getItem(itemConfig);
        if (item.inventoryQuantity !== Infinity) {
            item.inventoryQuantity -= 1;
            if (item.inventoryQuantity === 0) this.removeItem(itemConfig);
        }
        return true;
    }

    reset() {
        //this.#state = structuredClone(InventoryManager.#DEFAULT_STATE);
        this.#state = InventoryManager.#DEFAULT_STATE;
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
        this.#gameScene.game.events.emit(globalConfig.eventKeys.inventoryChanged);
    }
}