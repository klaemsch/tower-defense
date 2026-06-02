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
        console.log('init inventory manager');
    }

    /*isStructureUnlocked(structureType) {
        return this.#state.unlockedStructures.includes(structureType);
    }

    unlockThroughInternalType(cardInternalType) {
        console.warn('dont do this in regular game', "unlock", cardInternalType);
        Object.values(cards).forEach((card) => {
            if (card.configEntry.internalType == cardInternalType) {
                this.unlockThroughCard(card);
            }
        })
    }

    unlockThroughCard(cardConfig) {
        if (cardConfig.type === CardType.Structure) {
            this.unlockStructure(cardConfig);
        } else if (cardConfig.type === CardType.Upgrade) {
            this.addUpgrade(cardConfig);
        }
    }

    unlockStructure(cardConfig) {
        const internalType = cardConfig.configEntry.internalType;
        if (this.isStructureUnlocked(internalType)) return;
        this.#state.unlockedStructures.push(internalType);
        this.#commit();
    }

    addUpgrade(cardConfig) {
        const internalType = cardConfig.configEntry.internalType;
        this.#state.upgradeInventory.push(internalType);
        this.#commit();
    }*/

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

    getItems() {
        return this.#state.items;
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