function addWood(amount = 10) {
    window.__game.registry.inc(config.resources.wood.registryKey, amount);
    return `Added ${amount} wood to resources`;
}

function unlockStrucutre(structureName) {
    const game = window.__game;
    const progressManager = game.registry.get(config.registryKeys.progressManager);
    progressManager.unlock(structureName);
    return `Unlocked ${structureName}`;
}

function unlockSniper() {
    unlockStrucutre('sniper');
}

startGame();