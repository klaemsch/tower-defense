function toggleDebug() {
    globalConfig.debug = !globalConfig.debug;
    return `debug mode ${globalConfig.debug}`;
}

function addWood(amount = 100) {
    window.__game.registry.inc(globalConfig.resources.wood.registryKey, amount);
    return `Added ${amount} wood to resources`;
}

function addToken(amount = 100) {
    window.__game.registry.inc(globalConfig.resources.token.registryKey, amount);
    return `Added ${amount} token to resources`;
}

function getConfigFromItemName(itemName) {
    let config;
    // TODO: combining them here seems unnecessary, maybe combine them in config?
    Object.values(globalConfig.items).forEach((structureConfig) => {
        //console.log(structureConfig.internalType)
        if (structureConfig.internalType === itemName) {
            config = structureConfig;
            return;
        }
    })
    return config;
}

function printInventory() {
    const game = window.__game;
    const inventoryManager = game.registry.get(globalConfig.registryKeys.inventoryManager);

    return inventoryManager.getItems();
}

function addToInventory(itemName) {
    const game = window.__game;
    const inventoryManager = game.registry.get(globalConfig.registryKeys.inventoryManager);

    const itemConfig = getConfigFromItemName(itemName);
    if (!itemConfig) console.error('no config for this name', itemName);
    inventoryManager.addItem(itemConfig);
    return `Unlocked ${itemConfig}`;
}

function addSniper() {
    addToInventory('sniper');
}

function addProductionMultiplier() {
    addToInventory('productionMultiplier');
}

function gameOver() {
    const game = window.__game;
    game.events.emit(globalConfig.eventKeys.gameOver);
}

function kill() {
    const game = window.__game;
    const enemyManager = game.registry.get(globalConfig.registryKeys.enemyManager);

    // clear enemy group (destroy and remove from scene)
    enemyManager.enemies.clear(true, true);
    
    // after resetting the enemy group, we need to send out the enemy destroyed event
    // resetting the group from outside messes with the normal check logic of "enemies remaining"
    game.events.emit(globalConfig.eventKeys.enemyDestroyed, null);
    return 'killed all enemies';
}

startGame();