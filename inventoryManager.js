class InventoryManager {

    static #DEFAULT_STATE = {
        items: new Map(
            globalConfig.world.itemsAtStart.map((itemString) => {
                const config = globalConfig.items[itemString];
                return [config.internalType, { config, quantity: config.initInventoryQuantity ?? 0 }];
            })
        )
    };

    static #DEFAULT_DEBUG_STATE = {
        items: new Map(
            Object.values(globalConfig.items)
            .filter((item) => item.internalType !== 'hq')
            .map((item) => {
                const config = globalConfig.items[item.internalType];
                return [config.internalType, { config, quantity: Infinity }];
            })
        )
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
        //console.log('addItem in InventoryManager', itemConfig);

        // copy itemConfig
        const itemConfigCopy = { ...itemConfig };

        // check if item already exists
        const item = this.getItem(itemConfig);

        if (!item) this.#setItemMap(itemConfigCopy);    // new Item -> set item with quantity 1
        else item.quantity += 1;                        // existing Item -> increment quantity by 1

        this.#commit();
    }

    removeItem(itemConfig) {
        if (!this.hasItem(itemConfig)) return;
        this.#state.items.delete(itemConfig.internalType);
        this.#commit();
    }

    hasItem(itemConfig) {
        return this.#state.items.has(itemConfig.internalType);
    }

    getItem(itemConfig) {
        return this.#state.items.get(itemConfig.internalType);
    }

    getItems() {
        return [...this.#state.items.values()];
    }

    canUseItem(itemConfig) {
        //console.log('canUseItem')
        const item = this.getItem(itemConfig);
        const currentResourceCount = this.#gameScene.registry.get(item.config.costResourceRegistryKey);
        if (!item || item.quantity <= 0 || currentResourceCount < item.config.cost) {
            //console.log('cant use this item, it does not exist in the inventory or is too expensive', itemConfig);
            return false;
        }
        return true;
    }

    useItem(itemConfig) {
        //console.log('useItem')
        if (!this.canUseItem(itemConfig)) return false;
        const item = this.getItem(itemConfig);
        if (item.quantity !== Infinity) {
            item.quantity -= 1;
            if (item.quantity === 0) this.removeItem(itemConfig);
            this.#commit();  // commit only in case of non infinity
        }
        return true;
    }

    reset() {
        // TODO: structuredClone would be better, but does not work with functions
        //this.#state = structuredClone(InventoryManager.#DEFAULT_STATE);
        if (globalConfig.debug) {
            this.#state = InventoryManager.#DEFAULT_DEBUG_STATE;
        } else {
            this.#state = InventoryManager.#DEFAULT_STATE;
        }

        this.#commit();
        //console.log('state', this.#state);
    }

    // ── Private ───────────────────────────────────────────────────────

    #initResources() {
        //console.debug('initResources');
        for (const resource of Object.values(globalConfig.resources)) {
            if (typeof resource === 'function') continue;
            const { registryKey, label, initialValue } = resource;
            //console.debug(`Setting ${registryKey} to ${initialValue}`);
            this.#gameScene.registry.set(registryKey, initialValue);
        }

        // TODO: maybe move resource stuff into its own resourceManager / resourceInventoryManager
        // TODO: move this into its own function #initOnEnemyDestroyedHandler() or something

        // on enemy destroy, choose a random drop from config and add it to resources
        this.#gameScene.game.events.on(globalConfig.eventKeys.enemyDestroyed, (drop) => {
            if (!drop) return;
            //console.log('enemyDestroyed event recieved drop', drop.amount, drop.resource.label);
            this.#gameScene.registry.inc(drop.resource.registryKey, 1);
        });
    }

    /**
     * Write state to the registry so all scenes can react via changedata events.
     * A shallow clone is written so Phaser detects the change even if the
     * caller mutates the internal state object.
     */
    #commit() {
        this.#gameScene.game.events.emit(globalConfig.eventKeys.inventoryChanged);
    }

    // helper, that always sets the item map in the same way / keeps the structure
    #setItemMap(config, quantity = 1) {
        this.#state.items.set(config.internalType, {
            config: config,
            quantity: quantity,
        })
    }
}