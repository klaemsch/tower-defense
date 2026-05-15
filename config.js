const config = {
    world: {
        tileSize: 40,
        numCols: 20,  // 800 / 40
        numRows: 15,  // 600 / 40
        generation: {
            numTrees: 15,
        }
    },
    hq: {
        health: 200,
        color: 0x888888,
        label: 'HQ',
    },
    tower: {
        health: 100,
        fireRateMs: 1000,
        color: 0xFF0000,
        label: 'T',
        radiusInTiles: 5,
        bulletSpeed: 400,
        bulletDamage: 10,
    },
    woodShop: {
        health: 60,
        radiusInTiles: 1,
        harvestRateMs: 1000,
    },
    bullet: {
        speed: 400,
        color: 0xf1faee,
        size: 4,
        damage: 10,
    },
}

const phaserConfig = {
    type: Phaser.AUTO,
    width: config.world.numCols * config.world.tileSize,
    height: config.world.numRows * config.world.tileSize,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    fps: {
        showFPS: true,        // renders the counter top-left
        target: 60,
        forceSetTimeOut: false
    }
}