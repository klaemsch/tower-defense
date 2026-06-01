const enemyConfig = {
    baseEnemy: {
        speed: 0.5,         // cells per second
        spawnRate: 2000,    // ms between spawns
        damage: 10,         // damage per hit to a structure
        attackRate: 1000,   // ms between attacks while adjacent
        color: 0xe63946,
        sizeRatio: 0.5,   // size relative to tileSize, evaluated at draw time
        health: 30,
        draw: (gfx, px, py, eConfig, attacking) => {
            const s = (config.world.tileSize * eConfig.sizeRatio) / 2;

            gfx.fillStyle(attacking ? 0xff8800 : eConfig.color, 1);
            gfx.fillTriangle(px, py - s, px - s, py, px + s, py); // top half
            gfx.fillTriangle(px - s, py, px + s, py, px, py + s); // bottom half
        },
        spawnChance: 0.9,
    },
    bigEnemy: {
        speed: 0.5,         // cells per second
        spawnRate: 2000,    // ms between spawns
        damage: 10,         // damage per hit to a structure
        attackRate: 1000,   // ms between attacks while adjacent
        color: 0x0000FF,//0xe63946,
        sizeRatio: 0.9,   // size relative to tileSize, evaluated at draw time
        health: 30,
        draw: (gfx, px, py, eConfig, attacking) => {
            const s = (config.world.tileSize * eConfig.sizeRatio) / 2;

            // outer square, rotated 45°
            gfx.fillStyle(attacking ? 0xff8800 : eConfig.color, 1);
            gfx.fillTriangle(px, py - s, px + s, py, px, py);
            gfx.fillTriangle(px + s, py, px, py + s, px, py);
            gfx.fillTriangle(px, py + s, px - s, py, px, py);
            gfx.fillTriangle(px - s, py, px, py - s, px, py);

            // inner square, axis-aligned
            const inner = s * 0.45;
            gfx.fillStyle(0xffffff, 0.2);
            gfx.fillRect(px - inner, py - inner, inner * 2, inner * 2);
        },
        spawnChance: 0.9,
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
