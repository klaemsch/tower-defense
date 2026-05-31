// ─── Config shortcuts ─────────────────────────────────────────────────────────
const ENEMY_ATTACK_RATE = config.enemy.attackRate;

class Enemy extends Phaser.GameObjects.GameObject {
    #speed;
    #health;
    #color;

    #path;
    #pathIdx;
    #target;

    #attacking;
    #attackTimer;

    #gfx;
    #pathGfx;

    constructor(scene, col, row, path, target) {
        super(scene, 'enemy');

        this.gridX = col;
        this.gridY = row;

        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        this.hitBoxRadius = config.world.tileSize * config.enemy.sizeRatio * 0.5;

        this.#speed = config.enemy.speed;
        this.#health = config.enemy.health;
        this.#color = config.enemy.color;

        this.#path = path;
        this.#pathIdx = 0;
        this.#target = target;

        this.#attacking = false;
        this.#attackTimer = 0;

        this.#gfx = scene.add.graphics();
        this.#pathGfx = scene.add.graphics().setDepth(config.depthMap.enemyPath);

        scene.sys.updateList.add(this);

        this.#drawPath();
        this.#draw();

        // trigger destroy event for other scenes to check status
        this.once('destroy', () => {
            //console.log('enemy destroy event');
            this.scene.game.events.emit(config.eventKeys.enemyDestroyed);
        });
    }

    // ── Phaser lifecycle ──────────────────────────────────────────────────────

    preUpdate(_time, delta) {
        const step = this.#speed * (delta / 1000);

        if (this.#attacking) {
            this.#tickAttack(delta);
        } else {
            this.#tickMove(step);
        }

        const tileSize = config.world.tileSize;
        this.pixelX = this.gridX * tileSize + tileSize / 2;
        this.pixelY = this.gridY * tileSize + tileSize / 2;

        this.#draw();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // Apply damage. Destroys self if health reaches zero. Returns true if killed
    doDamage(amount) {
        // TODO: maybe let the enemy flicker or turn white for a second or so to indicate damage
        this.#health -= amount;
        if (this.#health <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }

    destroy(fromScene) {
        //console.log(this.scene)
        this.#pathGfx.destroy();
        this.#gfx.destroy();
        super.destroy(fromScene);
    }

    // ── Movement ──────────────────────────────────────────────────────────────

    #tickMove(step) {
        if (!this.#targetIsAlive()) {
            this.#retarget();
            return;
        }

        // Path exhausted → reached attack position
        if (this.#pathIdx >= this.#path.length) {
            this.#attacking = true;
            this.#attackTimer = 0;
            return;
        }

        // get next waypoint in path
        const waypoint = this.#path[this.#pathIdx];
        const dx = waypoint.col - this.gridX;
        const dy = waypoint.row - this.gridY;
        // distance to next waypoint
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= step) {
            // step would overshoot next waypoint
            // -> snap to next waypoint, advance, then re-evaluate
            this.gridX = waypoint.col;
            this.gridY = waypoint.row;
            this.#pathIdx++;
            this.#recalcPath();
            // TODO: this is a bit weird, Claude increases the pathIdx and then recalculates the path which resets the pathIdx
        } else {
            // step is ok -> do it
            this.gridX += (dx / dist) * step;
            this.gridY += (dy / dist) * step;
        }
    }

    // ── Attack ────────────────────────────────────────────────────────────────

    #tickAttack(delta) {
        if (!this.#targetIsAlive() || !this.#targetInRange()) {
            console.log('target change (target dead or out of range)');
            this.#attacking = false;
            this.#retarget();
            return;
        }

        this.#attackTimer += delta;
        if (this.#attackTimer >= ENEMY_ATTACK_RATE) {
            this.#attackTimer -= ENEMY_ATTACK_RATE;
            const destroyed = this.#target.doDamage(config.enemy.damage);
            if (destroyed) {
                this.#attacking = false;
                this.#retarget();
            }
        }
    }

    // ── Pathfinding ───────────────────────────────────────────────────────────

    /**
     * Re-evaluate best target and repath from current position.
     * Called on every waypoint snap so enemies react to newly placed buildings.
     */
    #recalcPath() {
        const best = this.#nearestTarget(Math.round(this.gridX), Math.round(this.gridY));
        if (best && best !== this.#target) this.#target = best;

        const newPath = Enemy.#findPath(
            Math.round(this.gridX), Math.round(this.gridY),
            this.#target.col, this.#target.row,
        );
        if (newPath) {
            this.#path = newPath;
            this.#pathIdx = 0;
            this.#drawPath();
        }
    }

    /** Pick a new target and path from scratch. Destroys self if none found. */
    #retarget() {
        const best = this.#nearestTarget(Math.round(this.gridX), Math.round(this.gridY));
        if (!best) { this.destroy(); return; }

        const newPath = Enemy.#findPath(
            Math.round(this.gridX), Math.round(this.gridY),
            best.col, best.row,
        );
        if (!newPath) { this.destroy(); return; }

        this.#target = best;
        this.#path = newPath;
        this.#pathIdx = 0;
        this.#attacking = false;
        this.#attackTimer = 0;
        this.#drawPath();
    }

    // ── Target selection ──────────────────────────────────────────────────────

    /**
     * Returns the nearest attackable structure GameObject to (fromCol, fromRow).
     * Single unified function — used by both #recalcPath and #retarget.
     */
    #nearestTarget(fromCol, fromRow) {
        let best = null;
        let bestDist = Infinity;

        structureMap.forEach((entry) => {
            if (!entry.attackable) return;
            const d = Math.sqrt((entry.col - fromCol) ** 2 + (entry.row - fromRow) ** 2);
            if (d < bestDist) { bestDist = d; best = entry; }
        });

        return best;
    }

    // returns true if this.#target is alive
    #targetIsAlive() {
        return this.#target && structureMap.has(gridKey(this.#target.col, this.#target.row));
    }

    // returns true if this.#target is in range
    #targetInRange() {
        return Enemy.#adjacentCells(this.gridX, this.gridY)
            .some(cell => cell.col === this.#target.col && cell.row === this.#target.row);
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    #draw() {
        const gfx = this.#gfx;
        gfx.clear();

        const s = (config.world.tileSize * config.enemy.sizeRatio) / 2;
        const px = this.pixelX;
        const py = this.pixelY;

        gfx.fillStyle(this.#attacking ? 0xff8800 : this.#color, 1);
        gfx.fillTriangle(px, py - s, px - s, py, px + s, py); // top half
        gfx.fillTriangle(px - s, py, px + s, py, px, py + s); // bottom half
    }

    #drawPath() {
        this.#pathGfx.clear();
        if (!this.#path || this.#path.length < 2) return;

        this.#pathGfx.lineStyle(1, this.#color, 0.3);
        this.#pathGfx.beginPath();

        const start = gridToWorld(Math.round(this.gridX), Math.round(this.gridY));
        this.#pathGfx.moveTo(start.x, start.y);

        this.#path.slice(this.#pathIdx).forEach(({ col, row }) => {
            const { x, y } = gridToWorld(col, row);
            this.#pathGfx.lineTo(x, y);
        });

        this.#pathGfx.strokePath();
    }

    // ── Static pathfinding ────────────────────────────────────────────────────

    static #findPath(startCol, startRow, goalCol, goalRow) {
        const { numCols, numRows } = config.world;
        const walkableAdjacent = Enemy.#adjacentCells(goalCol, goalRow).filter(({ col, row }) => {
            if (col < 0 || col >= numCols || row < 0 || row >= numRows) return false;
            const entry = structureMap.get(gridKey(col, row));
            return !entry || (col === startCol && row === startRow);
        });
        if (walkableAdjacent.length === 0) return null;

        const goalSet = new Set(walkableAdjacent.map(({ col, row }) => gridKey(col, row)));
        const queue = [{ col: startCol, row: startRow, path: [] }];
        const visited = new Set([gridKey(startCol, startRow)]);
        const dirs = [
            { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
            { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
            { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
            { dc: -1, dr: 1 }, { dc: 1, dr: 1 },
        ];

        while (queue.length > 0) {
            const { col, row, path } = queue.shift();
            if (goalSet.has(gridKey(col, row))) return path;

            for (const { dc, dr } of dirs) {
                const nc = col + dc, nr = row + dr;
                const k = gridKey(nc, nr);
                if (nc < 0 || nc >= numCols || nr < 0 || nr >= numRows) continue;
                if (visited.has(k)) continue;
                const entry = structureMap.get(k);
                if (entry && !goalSet.has(k)) continue;
                visited.add(k);
                queue.push({ col: nc, row: nr, path: [...path, { col: nc, row: nr }] });
            }
        }
        return null;
    }

    static #adjacentCells(col, row) {
        return [
            { col: col - 1, row }, { col: col + 1, row },
            { col, row: row - 1 }, { col, row: row + 1 },
            { col: col - 1, row: row - 1 }, { col: col + 1, row: row - 1 },
            { col: col - 1, row: row + 1 }, { col: col + 1, row: row + 1 },
        ];
    }

    // Public wrapper — used by EnemyManager at spawn time
    static findPathToAdjacent(startCol, startRow, goalCol, goalRow) {
        return Enemy.#findPath(startCol, startRow, goalCol, goalRow);
    }
}

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
        /*this.enemies = [];   // public — read by Enemy.destroy() and towers
        scene.events.on(config.enemy.onDestroyEventKey, () => {
            console.log(this.enemies.length)
            //this.enemies = this.enemies.filter((enemy) => !enemy.active)
            console.log(this.enemies)
            console.log(this.enemies.length)
        }, this);*/
    }

    // ── Public API ────────────────────────────────────────────────────────────

    startSpawning(rate = config.enemy.spawnRate, repeat = 100) {

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

            const path = Enemy.findPathToAdjacent(col, row, target.col, target.row);
            if (!path) continue;

            // create enemy and add it to group
            const enemy = this.#scene.add.enemy(col, row, path, target);
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

// ─────────────────────────────────────────────────────────────────────────────
//  Factory
// ─────────────────────────────────────────────────────────────────────────────
function registerEnemyFactory() {
    Phaser.GameObjects.GameObjectFactory.register(
        'enemy',
        function (col, row, path, target) {
            const enemy = new Enemy(this.scene, col, row, path, target);
            this.scene.sys.updateList.add(enemy);
            return enemy;
        },
    );
}

registerEnemyFactory();
startGame();