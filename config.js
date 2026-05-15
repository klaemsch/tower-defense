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
    hq: {
        health: 200,
        color: 0x888888,
        label: 'HQ',
    },
    tower: {
        health: 100,
        cost: 10,
        fireRateMs: 1000,
        color: 0xFF0000,
        label: 'T',
        radiusInTiles: 3,
        bulletSpeed: 400,
        bulletDamage: 10,
    },
    woodShop: {
        health: 60,
        cost: 5,
        label: '🏪',
        color: '#1a1a2e',
        radiusInTiles: 1,
        harvestRateMs: 1000,
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
    },
    resources: {
        wood: {
            registryKey: 'wood',
            label: 'Wood'
        }
    }
}

const phaserConfig = {
    type: Phaser.AUTO,
    width: config.world.numCols * config.world.tileSize,
    height: config.world.numRows * config.world.tileSize,
    backgroundColor: config.world.backgroundColor,
}