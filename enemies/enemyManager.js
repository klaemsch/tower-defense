// ─────────────────────────────────────────────────────────────────────────────
//  EnemyManager
// ─────────────────────────────────────────────────────────────────────────────
class EnemyManager {
    #scene;

    constructor(scene) {
        this.#scene = scene;
        // create group for enemy game objects
        // -> phaser keeps track and automatically removes them from the group if they are destroyed
        this.enemies = scene.add.group();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    startSpawning(rate = enemyConfig.baseEnemy.spawnRate, repeat = 100) {

        // repeat is the number of times the event is repeated after the first one fired
        // so if we want the event to happen X times we need to set repeat to X-1
        repeat = Math.floor(repeat) - 1

        console.log('start spawning with rate', rate);
        console.log('start spawning', repeat, 'enemies');
        this.enemies = this.#scene.add.group();
        this.spawnTimer = this.#scene.time.addEvent({
            delay: rate,
            callback: this.#spawn,
            callbackScope: this,
            repeat: repeat,
        });
    }

    pauseSpawning() {
        if (this.spawnTimer) this.spawnTimer.paused = true;
    }

    resumeSpawning() {
        if (this.spawnTimer) this.spawnTimer.paused = false;
    }

    stopSpawning() {
        // TODO: maybe reuse via reset() or something?
        this.spawnTimer.remove();
        this.spawnTimer = null;
        this.enemies = scene.add.group(); // TODO: i dont know if thats good, the old group will become inaccessable
    }

    /** Returns the closest active enemy within maxRange pixels, or null. */
    getClosestEnemy(fromPixelX, fromPixelY, maxRange) {
        let closestEnemy = null, colestDistance = Infinity;

        for (const enemy of this.enemies) {
            //if (!enemy.active) continue;
            const dx = enemy.pixelX - fromPixelX;
            const dy = enemy.pixelY - fromPixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= maxRange && dist <= colestDistance) { colestDistance = dist; closestEnemy = enemy; }
        }

        /*this.scene.enemyManager.enemies.forEach((enemy) => {
            if (enemy.type !== 'enemy') return;
            const dx = enemy.pixelX - this.pixelX;
            const dy = enemy.pixelY - this.pixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.radius && dist < closestDistance) {
                closestDistance = dist;
                closestEnemy = enemy;
            }
        });*/
        return closestEnemy;
    }

    isAllEnemiesDestroyed() {
        console.log('ABC is this used TODO')
        return this.enemies.length === 0;
    }

    // ── Spawn ─────────────────────────────────────────────────────────────────

    #spawn() {
        console.log('SPAWN')
        const candidates = this.#getBorderCells();
        Phaser.Utils.Array.Shuffle(candidates);

        for (const { col, row } of candidates) {
            if (isCellOccupied(col, row)) continue;

            const target = this.#nearestTarget(col, row);
            if (!target) continue;

            const path = helper.findPath(col, row, target.col, target.row);
            if (!path) continue;

            // choose random enemy config
            const eConfig = enemyConfig.getRandom();

            // create enemy and add it to group
            const enemy = this.#scene.add.enemy(col, row, path, target, eConfig);
            this.enemies.add(enemy);

            return enemy;
        }

        console.log('No position for enemy spawn found');

        return null;
    }

    #nearestTarget(fromCol, fromRow) {
        let best = null;
        let bestDist = Infinity;

        structureMap.forEach((entry) => {
            if (entry.attackable === false) return;
            const d = Math.sqrt((entry.col - fromCol) ** 2 + (entry.row - fromRow) ** 2);
            if (d < bestDist) { bestDist = d; best = entry; }
        });
        return best;
    }

    #getBorderCells() {
        const { numCols, numRows } = config.world;
        const cells = [];
        for (let c = 0; c < numCols; c++) {
            cells.push({ col: c, row: 0 });
            cells.push({ col: c, row: numRows - 1 });
        }
        for (let r = 1; r < numRows - 1; r++) {
            cells.push({ col: 0, row: r });
            cells.push({ col: numCols - 1, row: r });
        }
        return cells;
    }
}