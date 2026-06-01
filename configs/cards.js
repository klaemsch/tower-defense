const cards = [
    {
        title: 'Sniper',
        description: 'Tower with increased\nrange and damage\nbut decreased speed.',
        color: 0xfacc15,
        costResourceRegistryKey: globalConfig.resources.token.registryKey,
        cost: 5,
        configEntry: globalConfig.structures.sniper,
    },
    {
        title: 'Power Plant',
        description: 'Generates Energy.',
        color: 0x60a5fa,
        costResourceRegistryKey: globalConfig.resources.token.registryKey,
        cost: 5,
        popular: true,
        configEntry: globalConfig.structures.powerPlant,
    },
    {
        title: 'Hammer',
        description: 'Melee Tower\nAttacks enemies in\nclose range.',
        color: 0x818cf8,
        costResourceRegistryKey: globalConfig.resources.token.registryKey,
        cost: 5,
        configEntry: globalConfig.structures.hammer,
    },
];