// ─── Enemy Config ─────────────────────────────────────────────────────────────
const ENEMY_SPEED = 0.5;   // cells per second
const ENEMY_SPAWN_RATE = 2000;  // ms between spawns
const ENEMY_DAMAGE = 10;    // damage per hit to a structure
const ENEMY_ATTACK_RATE = 1000;  // ms between attacks while adjacent
const ENEMY_COLOR = 0xe63946;
const ENEMY_SIZE_RATIO = 0.5;   // size relative to TILE, evaluated at draw time

// ─────────────────────────────────────────────────────────────────────────────
//  Enemy — Custom Phaser GameObject
//
//  Owns its own graphics, movement, pathfinding, and attack logic.
//  Replace the _draw() body with a Sprite when assets are ready.
//
//  Dependencies expected on globalThis / window:
//    TILE, COLS, ROWS  — grid constants
//    structureMap      — Map<string, { col, row, type, … }>
//    gridKey(c,r)      — returns the string key used by structureMap
//    gridToWorld(c,r)  — returns { x, y } pixel centre of cell
//    isCellOccupied(c,r) — boolean
//    damageStructure(c,r,dmg) — returns true when the structure is destroyed
// ─────────────────────────────────────────────────────────────────────────────
class Enemy extends Phaser.GameObjects.GameObject {

    /**
     * @param {Phaser.Scene} scene
     * @param {number} col   – starting grid column
     * @param {number} row   – starting grid row
     * @param {number[]} path – BFS waypoint array [{col,row},…]
     * @param {{ col:number, row:number }} target – initial attack target cell
     */
    constructor(scene, col, row, path, target) {
        super(scene, 'Enemy');

        // ── Grid position (fractional during movement) ────────────────────
        this.gridX = col;
        this.gridY = row;

        // ── Pixel position (derived each frame) ───────────────────────────
        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        // ── Pathfinding state ─────────────────────────────────────────────
        this.path = path;
        this.pathIdx = 0;
        this.targetCol = target.col;
        this.targetRow = target.row;

        // ── Attack state ──────────────────────────────────────────────────
        this.attacking = false;
        this.attackTimer = 0;

        // ── Graphics (placeholder — swap for Sprite later) ────────────────
        this._gfx = scene.add.graphics();

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);

        this._draw();

        // TEST TEST TEST
        this.hitBoxRadius = TILE * ENEMY_SIZE_RATIO - 10;
        const hq = structureMap.get(gridKey(10,7));
        scene.add.bullet(hq, this);
    }

    // ── Phaser lifecycle ──────────────────────────────────────────────────────

    /** Called by Phaser every frame before the main scene update. */
    preUpdate(_time, delta) {
        if (!this.active) return;

        const step = ENEMY_SPEED * (delta / 1000);

        if (this.attacking) {
            this._tickAttack(delta);
        } else {
            this._tickMove(step);
        }

        // Sync pixel position from grid position
        this.pixelX = this.gridX * TILE + TILE / 2;
        this.pixelY = this.gridY * TILE + TILE / 2;

        this._draw();
    }

    destroy(fromScene) {
        this._gfx.destroy();
        super.destroy(fromScene);
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    /** Diamond shape (two triangles). Swap this body for a Sprite later. */
    _draw() {
        const g = this._gfx;
        g.clear();

        const s = (TILE * ENEMY_SIZE_RATIO) / 2;
        const { pixelX: px, pixelY: py } = this;

        g.fillStyle(this.attacking ? 0xff8800 : ENEMY_COLOR, 1);
        // Top half
        g.fillTriangle(
            px, py - s,
            px - s, py,
            px + s, py,
        );
        // Bottom half
        g.fillTriangle(
            px - s, py,
            px + s, py,
            px, py + s,
        );
    }

    // ── Movement ──────────────────────────────────────────────────────────────

    _tickMove(step) {
        // Validate current target still exists
        if (!structureMap.has(gridKey(this.targetCol, this.targetRow))) {
            this._retarget();
            return;
        }

        // Path exhausted → switch to attack mode
        if (this.pathIdx >= this.path.length) {
            const best = this._pickTarget(Math.round(this.gridX), Math.round(this.gridY));
            if (best && (best.col !== this.targetCol || best.row !== this.targetRow)) {
                this._retarget();
                return;
            }
            this.attacking = true;
            this.attackTimer = 0;
            return;
        }

        const waypoint = this.path[this.pathIdx];
        const dx = waypoint.col - this.gridX;
        const dy = waypoint.row - this.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= step) {
            // Snap to waypoint
            this.gridX = waypoint.col;
            this.gridY = waypoint.row;
            this.pathIdx++;

            // Re-evaluate target on every waypoint snap
            const best = this._pickTarget(Math.round(this.gridX), Math.round(this.gridY));
            if (best && (best.col !== this.targetCol || best.row !== this.targetRow)) {
                this.targetCol = best.col;
                this.targetRow = best.row;
            }

            const newPath = Enemy.findPathToAdjacent(
                Math.round(this.gridX), Math.round(this.gridY),
                this.targetCol, this.targetRow,
            );
            if (newPath) { this.path = newPath; this.pathIdx = 0; }
        } else {
            this.gridX += (dx / dist) * step;
            this.gridY += (dy / dist) * step;
        }
    }

    // ── Attack ────────────────────────────────────────────────────────────────

    _tickAttack(delta) {
        // Target destroyed mid-attack
        if (!structureMap.has(gridKey(this.targetCol, this.targetRow))) {
            this.attacking = false;
            this._retarget();
            return;
        }

        // Better target appeared nearby
        const best = this._pickTarget(Math.round(this.gridX), Math.round(this.gridY));
        if (best && (best.col !== this.targetCol || best.row !== this.targetRow)) {
            this.attacking = false;
            this._retarget();
            return;
        }

        this.attackTimer += delta;
        if (this.attackTimer >= ENEMY_ATTACK_RATE) {
            this.attackTimer -= ENEMY_ATTACK_RATE;
            const destroyed = damageStructure(this.targetCol, this.targetRow, ENEMY_DAMAGE);
            if (destroyed) {
                this.attacking = false;
                this._retarget();
            }
        }
    }

    // ── Retarget ──────────────────────────────────────────────────────────────

    _retarget() {
        const newTarget = this._pickTarget(Math.round(this.gridX), Math.round(this.gridY));
        if (!newTarget) {
            this.active = false;
            return;
        }

        const newPath = Enemy.findPathToAdjacent(
            Math.round(this.gridX), Math.round(this.gridY),
            newTarget.col, newTarget.row,
        );
        if (!newPath) {
            this.active = false;
            return;
        }

        this.targetCol = newTarget.col;
        this.targetRow = newTarget.row;
        this.path = newPath;
        this.pathIdx = 0;
        this.attacking = false;
        this.attackTimer = 0;
    }

    // ── Target selection ──────────────────────────────────────────────────────

    _pickTarget(fromCol, fromRow) {
        let best = null, bestDist = Infinity;
        structureMap.forEach((entry) => {
            if (entry.type === 'tree') return;
            const d = Math.sqrt((entry.col - fromCol) ** 2 + (entry.row - fromRow) ** 2);
            if (d < bestDist) { bestDist = d; best = entry; }
        });
        return best;
    }

    // ── Static helpers ────────────────────────────────────────────────────────

    /** BFS that finds a walkable cell adjacent to the goal. */
    static findPathToAdjacent(startCol, startRow, goalCol, goalRow) {
        const adjacentGoals = Enemy._adjacentCells(goalCol, goalRow).filter(({ col, row }) => {
            if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
            const entry = structureMap.get(gridKey(col, row));
            return !entry || (col === startCol && row === startRow);
        });
        if (adjacentGoals.length === 0) return null;

        const goalSet = new Set(adjacentGoals.map(({ col, row }) => gridKey(col, row)));
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
                if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
                if (visited.has(k)) continue;
                const entry = structureMap.get(k);
                if (entry && !goalSet.has(k)) continue;
                visited.add(k);
                queue.push({ col: nc, row: nr, path: [...path, { col: nc, row: nr }] });
            }
        }
        return null;
    }

    static _adjacentCells(col, row) {
        return [
            { col: col - 1, row }, { col: col + 1, row },
            { col, row: row - 1 }, { col, row: row + 1 },
            { col: col - 1, row: row - 1 }, { col: col + 1, row: row - 1 },
            { col: col - 1, row: row + 1 }, { col: col + 1, row: row + 1 },
        ];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  EnemyManager — thin scene-level controller
//
//  Replaces the old module-level `enemies` array, `initEnemies()`,
//  `updateEnemies()`, `spawnEnemy()`, and `drawEnemies()`.
//
//  Usage in your scene:
//
//    create()  { this.enemyManager = new EnemyManager(this); }
//    update(t,d){ this.enemyManager.update(d); }   // delta in ms
// ─────────────────────────────────────────────────────────────────────────────
class EnemyManager {

    constructor(scene) {
        this.scene = scene;
        this.enemies = [];   // live Enemy instances

        // Periodic spawn timer
        scene.time.addEvent({
            delay: ENEMY_SPAWN_RATE,
            callback: this.spawn,
            callbackScope: this,
            loop: true,
        });
    }

    // ── Spawn ─────────────────────────────────────────────────────────────────

    spawn() {
        //console.log('spawning enemy')
        const candidates = this._getBorderCells();
        Phaser.Utils.Array.Shuffle(candidates);

        for (const { col, row } of candidates) {
            if (isCellOccupied(col, row)) continue;

            const target = this._pickAnyTarget(col, row);
            if (!target) continue;

            const path = Enemy.findPathToAdjacent(col, row, target.col, target.row);
            if (!path) continue;

            // ── Factory call ──────────────────────────────────────────────
            //  scene.add.enemy(col, row, path, target)
            const e = this.scene.add.enemy(col, row, path, target);
            this.enemies.push(e);
            return;
        }
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /**
     * Call from the scene's update().  Prunes dead instances.
     * (Individual Enemy.preUpdate() is wired automatically by updateList.)
     * @param {number} _delta – unused; kept for symmetry with old API
     */
    update(_delta) {
        // Prune destroyed instances from our reference list
        this.enemies = this.enemies.filter(e => e.active);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _pickAnyTarget(fromCol, fromRow) {
        let best = null, bestDist = Infinity;
        structureMap.forEach((entry) => {
            if (entry.attackable === false) return;
            const d = Math.sqrt((entry.col - fromCol) ** 2 + (entry.row - fromRow) ** 2);
            if (d < bestDist) { bestDist = d; best = entry; }
        });
        //console.log(best)
        return best;
    }

    _getBorderCells() {
        const cells = [];
        for (let c = 0; c < COLS; c++) {
            cells.push({ col: c, row: 0 });
            cells.push({ col: c, row: ROWS - 1 });
        }
        for (let r = 1; r < ROWS - 1; r++) {
            cells.push({ col: 0, row: r });
            cells.push({ col: COLS - 1, row: r });
        }
        return cells;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Factory Registration
//
//  Call this ONCE before your game boots (or at least before any scene
//  that uses `scene.add.enemy()`).
//
//    registerEnemyFactory();
//    new Phaser.Game(config);
// ─────────────────────────────────────────────────────────────────────────────
function registerEnemyFactory() {
    Phaser.GameObjects.GameObjectFactory.register(
        'enemy',
        /**
         * @param {number}   col    Starting grid column
         * @param {number}   row    Starting grid row
         * @param {object[]} path   BFS path [{col,row},…]
         * @param {object}   target { col, row } of initial attack target
         */
        function (col, row, path, target) {
            const enemy = new Enemy(this.scene, col, row, path, target);
            // updateList ensures preUpdate() fires; displayList is not needed
            // because Enemy manages its own internal Graphics object.
            this.scene.sys.updateList.add(enemy);
            return enemy;
        },
    );
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
// Register the factory before Phaser boots, then start the game.
registerEnemyFactory();
startGame();