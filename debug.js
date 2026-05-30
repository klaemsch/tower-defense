function addWood(amount = 10) {
    window.__game.registry.inc(config.resources.wood.registryKey, amount);
    return `Added ${amount} wood to resources`;
}