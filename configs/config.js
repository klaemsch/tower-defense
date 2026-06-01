const RadiusType = {
    Circular: 'circular',
    Rectangular: 'rectangular',
}

const globalConfig = {
    debug: true,
    world: {
        tileSize: 40,
        numCols: 30,  // 800 / 40
        numRows: 20,  // 600 / 40
        generation: {
            numTrees: 15,
        },
        backgroundColor: '#1a1a2e',
        structuresAvailableAtStart: [
            'woodShop',
            'tower',
            'sniper',
        ]
    },
    texts: {
        gameOverTitle: 'GAME OVER',
        gameOverSubtitle: 'Your HQ was destroyed',
        gameWonTitle: 'YOU WON',
        gameWonSubtitle: 'You survived every wave!',
    },
    structures: {
        /**
         * A valid structure config needs:
         * - internalType: Phaser uses this internally to name the GameObjects
         * - health
         * - color:         visual color of the underlying rectangle
         * - label:         visual label that gets printed on the rectangle
         * - sizeInTiles:   size of structure in tiles
         * 
         * If the structure costs resources, set these:
         * - costResourceRegistryKey: key of the resource that is needed to build this structure
         * - cost: amount of the resource that is needed to build this structure
         * 
         * If the structure can be placed, set this:
         * - placerLabel: visual label for the placer
         * 
         * If the structure is moveable, set this:
         * - moveable: true
         */
        hq: {
            internalType: 'hq',
            health: 200,
            color: 0x888888,
            label: 'HQ',
            sizeInTiles: 1,
        },
        woodShop: {
            internalType: 'woodShop',
            health: 60,
            color: '#1a1a2e',
            label: '🏪',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 5,
            placerLabel: '🏪 Wood Shop',
            moveable: true,

            radiusInTiles: 1,
            radiusType: RadiusType.Rectangular,
            harvestRateMs: 1000,
        },
        tower: {
            internalType: 'tower',
            health: 100,
            color: 0xFF0000,
            label: 'T',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            placerLabel: '🗼 Tower',
            moveable: true,

            fireRateMs: 1000,
            radiusInTiles: 3,
            radiusType: RadiusType.Circular,
            bulletSpeed: 400,
            bulletDamage: 10,
        },
        hammer: {
            internalType: 'hammer',
            health: 100,
            color: 0xFF0000,
            label: 'H',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            placerLabel: '🔨 Hammer',
            moveable: true,

            fireRateMs: 1000,
            radiusInTiles: 1,
            radiusType: RadiusType.Rectangular,
            bulletSpeed: 400,
            bulletDamage: 20,
        },
        sniper: {
            internalType: 'sniper',
            health: 100,
            color: 0xFF0000,
            label: 'S',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            placerLabel: '🗼 Sniper',
            moveable: true,

            fireRateMs: 3000,
            radiusInTiles: 6,
            radiusType: RadiusType.Circular,
            bulletSpeed: 800,
            bulletDamage: 20,
        },
        powerPlant: {
            internalType: 'powerPlant',
            health: 60,
            color: '#1a1a2e',
            label: '🏭',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 5,
            placerLabel: '🏭 Power Plant',
            moveable: true,
        },
    },
    bullet: {
        color: 0xf1faee,
        size: 4,
    },
    resources: {
        token: {
            registryKey: 'token',
            label: '🪙',
            initialValue: 5,
        },
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
    flow: [
        { type: 'peace', lengthInSeconds: 2 },
        { type: 'wave', lengthInSeconds: 10, spawnRate: 1000, enemyHealth: 30, reward: 5 },
        { type: 'peace', lengthInSeconds: 10 },
        { type: 'wave', lengthInSeconds: 10, spawnRate: 1000, enemyHealth: 40, reward: 10 },
        { type: 'peace', lengthInSeconds: 10 },
        { type: 'wave', lengthInSeconds: 10, spawnRate: 500, enemyHealth: 50, reward: 15 },
        { type: 'peace', lengthInSeconds: 10 },
        { type: 'wave', lengthInSeconds: 15, spawnRate: 500, enemyHealth: 50, reward: 20 },
    ],
    sceneKeys: {
        game: 'gameScene',
        shop: 'shopScene',
        hud: 'hudScene',
    },
    registryKeys: {
        pauseResumeState: 'isPaused',
        placerActiveStructure: 'placer-activeStructure',
        enemyManager: 'enemyManager',
        placer: 'placer',
        gameFlowManager: 'gameFlowManager',
        progressManager: 'progressManager',
        progress: 'progress',
    },
    eventKeys: {
        gamePause: 'game:pause',            // emitted when the game is paused
        gameResume: 'game:resume',          // emitted when the game is paused
        gameOver: 'game:over',              // emitted when the HQ is destroyed
        gameWon: 'game:won',                // emitted when last wave survived -> game won
        shopOpen: 'shop:open',              // emitted when the shop is opened
        shopClose: 'shop:close',            // emitted when the shop is closed
        enemyDestroyed: 'enemy:destroyed',  // emitted after an enemy was destroyed
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
    },
    depthMap: {
        // 1. Normal Game
        structureRadius: 0,
        enemyPath: 1,
        hoverGrid: 5,
        bullet: 8,
        structureProductionFx: 10,
        // 2. HUD
        resourceContainer: 11,
        resourceLabel: 11,
        progressBar: 15,
        // 3. Shop and Game Over (MutEx)
        gameOverRect: 50,
        gameOverText: 51,
        shopBackgroundBlur: 50,
        shopText: 51,
    }
}

const phaserConfig = {
    type: Phaser.AUTO,
    width: globalConfig.world.numCols * globalConfig.world.tileSize,
    height: globalConfig.world.numRows * globalConfig.world.tileSize,
    backgroundColor: globalConfig.world.backgroundColor,
}