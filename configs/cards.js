const cards = [
    {
        title: 'Sniper',
        description: 'Tower with increased\nrange and damage\nbut decreased speed.',
        color: 0xfacc15,
        costResourceRegistryKey: config.resources.token.registryKey,
        cost: 5,
        configEntry: config.structures.sniper,
    },
    {
        title: 'Power Plant',
        description: 'Generates Energy',
        color: 0x60a5fa,
        costResourceRegistryKey: config.resources.token.registryKey,
        cost: 75,
        popular: true,
        configEntry: config.structures.powerPlant,
    },
    {
        title: 'Frost Nova',
        description: 'Slows all enemies by 40%\nfor the first 10 seconds.',
        color: 0x818cf8,
        costResourceRegistryKey: config.resources.token.registryKey,
        cost: 60,
        configEntry: {},
    },
];