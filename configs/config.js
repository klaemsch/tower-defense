const RadiusType = {
    Circular: 'circular',
    Rectangular: 'rectangular',
}

const ItemType = {
    Structure: 'structure',
    Upgrade: 'upgrade',
}

const FlowType = {
    Peace: 'peace',
    Wave: 'wave',
}

const imageConfig = {
    // key: path
    tree: 'assets/asteroid_48x48.png',
    temp: 'assets/temp.png',

    habitat: 'assets/habitat/habitat_top_48x48.png',
    hammer: 'assets/hammer/hammer_top_48x48.png',
    hq: 'assets/hq/hq_top_48x48.png',
    powerPlant: 'assets/powerplant/powerplant_top_48x48.png',
    sniper: 'assets/sniper/sniper_top_48x48.png',
    tower: 'assets/tower/tower_futuristic_top_48x48.png',
    woodShop: 'assets/woodshop/woodshop_top_48x48.png',

    productionMultiplier: 'assets/upgrades/upgrade_production_48x48.png',
    freeze: 'assets/upgrades/upgrade_freeze_48x48.png',

    fighterEnemy: 'assets/enemies/enemy_fighter_48x48.png',
    bulkyEnemy: 'assets/enemies/enemy_bulky_48x48.png',
    hammerheadEnemy: 'assets/enemies/enemy_hammerhead_48x48.png',
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
            'habitat',
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
         * - imageKey:      key of image defined in imageConfig
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
            imageKey: 'hq',
            color: 0x888888,
            label: 'HQ',
            sizeInTiles: 1,
        },
        woodShop: {
            itemType: ItemType.Structure,
            internalType: 'woodShop',
            health: 60,
            imageKey: 'woodShop',
            //color: '#1a1a2e',
            color: '0xff0000',
            label: '🏪',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 5,
            inventoryIcon: '🏪',
            inventoryLabel: 'Wood Shop',
            initInventoryQuantity: 1,
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
            imageKey: 'tower',
            //color: 0xFF0000,
            color: '#ff0000',
            label: 'T',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            inventoryIcon: '🗼',
            inventoryLabel: 'Tower',
            initInventoryQuantity: 1,
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
            imageKey: 'hammer',
            //color: 0xFF0000,
            color: '#ff0000',
            label: 'H',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            inventoryIcon: '🔨',
            inventoryLabel: 'Hammer',
            initInventoryQuantity: 1,
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
            imageKey: 'sniper',
            //color: 0xFF0000,
            color: '#ff0000',
            label: 'S',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 10,
            inventoryIcon: '🗼',
            inventoryLabel: 'Sniper',
            initInventoryQuantity: 1,
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
            imageKey: 'powerPlant',
            //color: '#1a1a2e',
            color: '#ff0000',
            label: '🏭',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 5,
            inventoryIcon: '🏭',
            inventoryLabel: 'Power Plant',
            initInventoryQuantity: 1,
            moveable: true,

            productionRateMs: 1000,
            productionCostResourceRegistryKey: 'wood',
            baseCostPerRate: 1,
            productionResourceRegistryKey: 'energy',
            baseProductionPerRate: 1,

            createPreview: (scene, cfg) => Structure.createPreview(scene, cfg),
            create: (scene, col, row) => scene.add.powerPlant(col, row),
        },
        habitat: {
            itemType: ItemType.Structure,
            internalType: 'habitat',
            health: 60,
            imageKey: 'habitat',
            //color: '#1a1a2e', // TODO: maybe remove the config here and always set it to red in structure.js 
            color: '#ff0000',
            label: '🏠',
            sizeInTiles: 1,
            costResourceRegistryKey: 'wood',
            cost: 5,
            inventoryIcon: '🏠',
            inventoryLabel: 'Habitat',
            initInventoryQuantity: 1,
            moveable: true,

            productionRateMs: 1000,

            createPreview: (scene, cfg) => Structure.createPreview(scene, cfg),
            create: (scene, col, row) => scene.add.habitat(col, row),
        },
        productionMultiplier: {
            itemType: ItemType.Upgrade,
            internalType: 'productionMultiplier',
            imageKey: 'productionMultiplier',
            multiplier: 2,
            inventoryLabel: 'Prod. Mult. x2',
            initInventoryQuantity: 2,
        },
        freeze: {
            itemType: ItemType.Upgrade,
            internalType: 'freeze',
            imageKey: 'freeze',
            inventoryLabel: 'Freeze',
            initInventoryQuantity: 1,
            effectTimeInMs: 1000,
            effectChance: 0.3,
            fxLabel: '🧊',
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
            label: '🪨',
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
        { type: FlowType.Peace, lengthInSeconds: 10 },
        { type: FlowType.Wave, lengthInSeconds: 10, spawnRate: 1000, enemyHealth: 30, reward: 5 },
        { type: FlowType.Peace, lengthInSeconds: 10 },
        { type: FlowType.Wave, lengthInSeconds: 10, spawnRate: 1000, enemyHealth: 40, reward: 10 },
        { type: FlowType.Peace, lengthInSeconds: 10 },
        { type: FlowType.Wave, lengthInSeconds: 10, spawnRate: 500, enemyHealth: 50, reward: 15 },
        { type: FlowType.Peace, lengthInSeconds: 10 },
        { type: FlowType.Wave, lengthInSeconds: 15, spawnRate: 500, enemyHealth: 50, reward: 20 },
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
}

const phaserConfig = {
    type: Phaser.AUTO,
    width: globalConfig.world.numCols * globalConfig.world.tileSize,
    height: globalConfig.world.numRows * globalConfig.world.tileSize,
    backgroundColor: globalConfig.world.backgroundColor,
}