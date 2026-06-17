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

        //console.log('start spawning', repeat, 'enemies with rate', rate);
        this.enemies.clear(true, true);
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
        this.enemies.clear(true, true);
    }

    // returns the closest enemy and its squared distance to given coordinates (fromPixelX, fromPixelY)
    getClosestEnemy(fromPixelX, fromPixelY) {
        let closestEnemy = null, closestSquaredDistance = Infinity;

        for (const enemy of this.enemies.getChildren()) {
            const dx = enemy.pixelX - fromPixelX;
            const dy = enemy.pixelY - fromPixelY;
            const squaredDist = dx ** 2 + dy ** 2;
            if (squaredDist <= closestSquaredDistance) {
                closestSquaredDistance = squaredDist;
                closestEnemy = enemy;
            }
        }

        return {enemy: closestEnemy, squaredDist: closestSquaredDistance};
    }

    isAllEnemiesDestroyed() {
        //console.log('ABC is this used TODO')
        return this.enemies.length === 0;
    }

    // ── Spawn ─────────────────────────────────────────────────────────────────

    #spawn() {
        // TODO: work on this, its messy
        //console.log('SPAWN')
        const borderCell = structureStorage.getRandomBorderCell();

        const { col, row } = borderCell;

        const target = structureStorage.getClosestTarget(col, row);
        if (!target) return null;

        const path = helper.findPath(col, row, target.col, target.row);
        if (!path) return null;

        // choose random enemy config
        const eConfig = enemyConfig.getRandom();

        // create enemy and add it to group
        const enemy = this.#scene.add.enemy(col, row, path, target, eConfig);

        this.enemies.add(enemy);

       return enemy;
    }
}