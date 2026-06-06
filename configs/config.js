const RadiusType = {
    Circular: 'circular',
    Rectangular: 'rectangular',
}

const ItemType = {
    Structure: 'structure',
    Upgrade: 'upgrade',
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
        itemsAtStart: [  // TODO: delete
            'woodShop',
            'tower',
            'powerPlant',
            'productionMultiplier',
            'freeze',
        ],
    },
    texts: {
        gameOverTitle: 'GAME OVER',
        gameOverSubtitle: 'Your HQ was destroyed',
        gameWonTitle: 'YOU WON',
        gameWonSubtitle: 'You survived every wave!',
    },
    items: {
        /**
         * A valid item config needs:
         * - itemType:      type to distinguish structures, upgrades ...
         * - internalType:  Phaser uses this internally to name the GameObjects
         * - health
         * - color:         visual color of the underlying rectangle
         * - label:         visual label that gets printed on the rectangle
         * - sizeInTiles:   size of item in tiles
         * 
         * If the item costs resources, set these:
         * - costResourceRegistryKey: key of the resource that is needed to build this item
         * - cost: amount of the resource that is needed to build this item
         * 
         * If the item can be placed, set this:
         * - inventoryLabel:            visual label for the inventory
         * - initInventoryQuantity:     initial quantity of this item in inventory
         * 
         * If the item is moveable, set this:
         * - moveable: true
         * 
         * If the item produces resources, set this:
         * - productionRateMs: delay between resource production in ms
         */
        hq: {
            itemType: ItemType.Structure,
            internalType: 'hq',
            health: 200,
            color: 0x888888,
            label: 'HQ',
            sizeInTiles: 1,
        },
        woodShop: {
            itemType: ItemType.Structure,
            internalType: 'woodShop',
            health: 60,
            color: '#1a1a2e',
            label: '🏪',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 5,
            inventoryIcon: '🏪',
            inventoryLabel: 'Wood Shop',
            initInventoryQuantity: Infinity,
            moveable: true,

            radiusInTiles: 1,
            radiusType: RadiusType.Rectangular,
            productionRateMs: 1000,

            createPreview: (scene, cfg) => WoodShop.createPreview(scene, cfg),
            create: (scene, col, row) => scene.add.woodShop(col, row),
        },
        tower: {
            itemType: ItemType.Structure,
            internalType: 'tower',
            health: 100,
            color: 0xFF0000,
            label: 'T',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            inventoryIcon: '🗼',
            inventoryLabel: 'Tower',
            initInventoryQuantity: Infinity,
            moveable: true,

            fireRateMs: 1000,
            radiusInTiles: 3,
            radiusType: RadiusType.Circular,
            bulletSpeed: 400,
            bulletDamage: 10,

            createPreview: (scene, cfg) => Tower.createPreview(scene, cfg),
            create: (scene, col, row) => scene.add.tower(col, row, globalConfig.items.tower),
        },
        hammer: {
            itemType: ItemType.Structure,
            internalType: 'hammer',
            health: 100,
            color: 0xFF0000,
            label: 'H',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            inventoryIcon: '🔨',
            inventoryLabel: 'Hammer',
            initInventoryQuantity: Infinity,
            moveable: true,

            fireRateMs: 1000,
            radiusInTiles: 1,
            radiusType: RadiusType.Rectangular,
            bulletSpeed: 400,
            bulletDamage: 20,

            createPreview: (scene, cfg) => Tower.createPreview(scene, cfg),
            create: (scene, col, row) => scene.add.tower(col, row, globalConfig.items.hammer),
        },
        sniper: {
            itemType: ItemType.Structure,
            internalType: 'sniper',
            health: 100,
            color: 0xFF0000,
            label: 'S',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            inventoryIcon: '🗼',
            inventoryLabel: 'Sniper',
            initInventoryQuantity: Infinity,
            moveable: true,

            fireRateMs: 3000,
            radiusInTiles: 6,
            radiusType: RadiusType.Circular,
            bulletSpeed: 800,
            bulletDamage: 20,

            createPreview: (scene, cfg) => Tower.createPreview(scene, cfg),
            create: (scene, col, row) => scene.add.tower(col, row, globalConfig.items.sniper),
        },
        powerPlant: {
            itemType: ItemType.Structure,
            internalType: 'powerPlant',
            health: 60,
            color: '#1a1a2e',
            label: '🏭',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 5,
            inventoryIcon: '🏭',
            inventoryLabel: 'Power Plant',
            initInventoryQuantity: Infinity,
            moveable: true,

            productionRateMs: 1000,
            productionCostResourceRegistryKey: 'wood',
            baseCostPerRate: 1,
            productionResourceRegistryKey: 'energy',
            baseProductionPerRate: 1,

            createPreview: (scene, cfg) => Structure.createPreview(scene, cfg),
            create: (scene, col, row) => scene.add.powerPlant(col, row),
        },
        productionMultiplier: {
            itemType: ItemType.Upgrade,
            internalType: 'productionMultiplier',
            multiplier: 2,
            inventoryLabel: 'Prod. Mult. x2',
            initInventoryQuantity: 2,
        },
        freeze: {
            itemType: ItemType.Upgrade,
            internalType: 'freeze',
            inventoryLabel: 'Freeze',
            initInventoryQuantity: 1,
            effectTimeInMs: 1000,
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
            enemyDropChance: 0.01,
        },
        wood: {
            registryKey: 'wood',
            label: '🪵',
            initialValue: 5,
            enemyDropChance: 0.06,
        },
        villager: {
            registryKey: 'villager',
            label: '🧑‍🤝‍🧑',
            initialValue: 5,
            enemyDropChance: 0.01,
        },
        energy: {
            registryKey: 'energy',
            label: '⚡',
            initialValue: 0,
            enemyDropChance: 0.02,
        },
        // TODO: maybe move this to the enemyConfig, to make different drop distributions per enemy type
        getRandomDrop: () => {
            const pool = Object.values(globalConfig.resources).filter((resource) => resource.enemyDropChance);
            const roll = Math.random();
            let cumulative = 0;

            // TODO: drop amount currently fixed at 1, maybe roll this later as well?
            const amount = 1;

            for (const resource of pool) {
                cumulative += resource.enemyDropChance;
                if (roll < cumulative) return { resource, amount };
            }

            // in case roll is higher than cumulative drop chances, drop nothing
            return null;
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
        selectedItem: 'selectedItem',
        enemyManager: 'enemyManager',
        placer: 'placer',
        gameFlowManager: 'gameFlowManager',
        inventoryManager: 'inventoryManager',
    },
    eventKeys: {
        gamePause: 'game:pause',            // emitted when the game is paused
        gameResume: 'game:resume',          // emitted when the game is paused
        gameOver: 'game:over',              // emitted when the HQ is destroyed
        gameWon: 'game:won',                // emitted when last wave survived -> game won
        shopOpen: 'shop:open',              // emitted when the shop is opened
        shopClose: 'shop:close',            // emitted when the shop is closed
        enemyDestroyed: 'enemy:destroyed',  // emitted after an enemy was destroyed
        inventoryButtonPressed: 'inventory:button:pressed', // emitted when an inventory button is pressed
        inventoryChanged: 'inventory:changed'               // emitted when the inventory changes because of unlock/upgrade
    },
    shop: {
        title: 'Wave Complete!',
        subtitle: 'You earned resources! Upgrade your towers.',
        layout: {
            cardWidth: 200,
            cardHeight: 280,
            cardGap: 24,
            imgSize: 72,
        },
        reroll: {
            cost: 5,
            costResourceRegistryKey: 'token',
        },
    },
    depthMap: {
        // TODO: apparently depth is dependent on scenes, so not comparable between scenes
        // scenes that are launched later, are put on top of the previous
        // 1. Normal Game
        structureRadius: 0,
        enemyPath: 1,
        hoverGrid: 5,
        bullet: 8,
        structureProductionFx: 10,
        // 2. HUD
        resourceContainer: 111,
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