function addWood(amount = 10) {
    window.__game.registry.inc(globalConfig.resources.wood.registryKey, amount);
    return `Added ${amount} wood to resources`;
}

function getConfigFromItemName(itemName) {
    let config;
    // TODO: combining them here seems unnecessary, maybe combine them in config?
    Object.values(globalConfig.items).forEach((structureConfig) => {
        console.log(structureConfig.internalType)
        if (structureConfig.internalType === itemName) {
            config = structureConfig;
            return;
        }
    })
    return config;
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

startGame();