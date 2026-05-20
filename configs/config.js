const config = {
    world: {
        tileSize: 40,
        numCols: 20,  // 800 / 40
        numRows: 15,  // 600 / 40
        generation: {
            numTrees: 15,
        },
        backgroundColor: '#1a1a2e'
    },
    structures: {
        /**
         * A valid structure config needs:
         * - internalType: Phaser uses this internally to name the GameObjects
         * - health
         * - color: visual color of the underlying rectangle
         * - label: visual label that gets printed
         * - costResourceRegistryKey: key of the resource that is needed to build this structure
         * - cost: amount of the resource that is needed to build this structure
         */
        hq: {
            internalType: 'hq',
            health: 200,
            color: 0x888888,
            label: 'HQ',
        },
        tower: {
            internalType: 'tower',
            health: 100,
            color: 0xFF0000,
            label: 'T',
            costResourceRegistryKey: 'wood',
            cost: 10,

            fireRateMs: 1000,
            radiusInTiles: 3,
            bulletSpeed: 400,
            bulletDamage: 10,
        },
        woodShop: {
            internalType: 'woodShop',
            health: 60,
            color: '#1a1a2e',
            label: '🏪',
            costResourceRegistryKey: 'wood',
            cost: 5,

            radiusInTiles: 1,
            harvestRateMs: 1000,
        },
        powerPlant: {
            internalType: 'powerPlant',
            health: 60,
            color: '#1a1a2e',
            label: '🏭',
            costResourceRegistryKey: 'wood',
            cost: 5,
        },
    },
    bullet: {
        speed: 400,
        color: 0xf1faee,
        size: 4,
        damage: 10,
    },
    enemy: {
        speed: 0.5,         // cells per second
        spawnRate: 2000,    // ms between spawns
        damage: 10,         // damage per hit to a structure
        attackRate: 1000,   // ms between attacks while adjacent
        color: 0xe63946,
        sizeRatio: 0.5,   // size relative to tileSize, evaluated at draw time
        health: 30,
        onDestroyEventKey: 'enemyDestroyed'
    },
    resources: {
        wood: {
            registryKey: 'wood',
            label: '🪵',
            initialValue: 5,
        },
        villager: {
            registryKey: 'villager',
            label: '🧑‍🤝‍🧑',
            initialValue: 5,
        },
        energy: {
            registryKey: 'energy',
            label: '⚡',
            initialValue: 0,
        }
    },
    waves: [
        { lengthInSeconds: 15, spawnRate: 2000, enemyHealth: 30 },
    ],
    sceneKeys: {
        game: 'gameScene',
        shop: 'shopScene',
        hud: 'hudScene',
    },
    shop: {
        title: 'Wave Complete!',
        subtitle: 'You earned resources! Upgrade your towers.',
        layout: {
            cardWidth: 200,
            cardHeight: 280,
            cardGap: 24,
            imgSize: 72,
        }
    }
}

const phaserConfig = {
    type: Phaser.AUTO,
    width: config.world.numCols * config.world.tileSize,
    height: config.world.numRows * config.world.tileSize,
    backgroundColor: config.world.backgroundColor,
}