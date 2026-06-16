const defaultEnemyBulletConfig = {
    speed: 400,
    damage: 10,
    color: 0xff0000,
    size: 2,
}

const enemyConfig = {
    baseEnemy: {
        imageKey: 'fighterEnemy',
        speed: 0.5,         // cells per second
        //spawnRate: 2000,    // ms between spawns
        //damage: 10,         // damage per hit to a structure
        attackRate: 1000,   // ms between attacks while adjacent
        color: 0xe63946,
        sizeRatio: 0.5,   // size relative to tileSize, evaluated at draw time
        health: 30,
        radiusInTiles: 2,
        radiusType: RadiusType.Circular,
        dropFxDuration: 2000,
        spawnChance: 0.9,
        bulletConfig: defaultEnemyBulletConfig,
    },
    bigEnemy: {
        imageKey: 'bulkyEnemy',
        speed: 0.35,         // cells per second
        //spawnRate: 2000,    // ms between spawns
        //damage: 20,         // damage per hit to a structure
        attackRate: 1000,   // ms between attacks while adjacent
        color: 0x0000FF,//0xe63946,
        sizeRatio: 0.9,   // size relative to tileSize, evaluated at draw time
        health: 120,
        radiusInTiles: 1,
        radiusType: RadiusType.Rectangular,
        dropFxDuration: 2000,
        spawnChance: 0.1,
        bulletConfig: {
            speed: 400,
            damage: 20,
            color: 0xff0000,
            size: 2,
        }
    },
    getRandom: () => {
        const pool = Object.values(enemyConfig);
        const roll = Math.random();
        let cumulative = 0;

        for (const cfg of pool) {
            cumulative += cfg.spawnChance;
            if (roll < cumulative) return cfg;
        }

        // Fallback in case chances don't sum to exactly 1 due to floating point
        console.warn("enemy config spawn chances don't sum up to 1");
        return pool[pool.length - 1];
    }
}
