const ENEMY_SPAWN_RATE = config.enemy.spawnRate;
const ENEMY_DAMAGE = config.enemy.damage;
const ENEMY_ATTACK_RATE = config.enemy.attackRate;

class Enemy extends Phaser.GameObjects.GameObject {
    #health;
    #target;
    #speed;

    #path;
    #pathIdx;
    #attacking;
    #attackTimer;

    #gfx;
    #pathGfx;
    #color;
    
    /**
     * @param {Phaser.Scene} scene
     * @param {number} col   – starting grid column
     * @param {number} row   – starting grid row
     * @param {number[]} path – BFS waypoint array [{col,row},…]
     * @param {{ col:number, row:number }} target – initial attack target cell
     */
    constructor(scene, col, row, path, target) {
        super(scene, 'enemy');

        // ── Grid position (fractional during movement) ────────────────────
        this.gridX = col;
        this.gridY = row;

        // ── Pixel position (derived each frame) ───────────────────────────
        const pos = gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        // ── Properties ────────────────────────────────────────────────────
        this.#speed = config.enemy.speed;
        this.#health = config.enemy.health;

        // ── Pathfinding state ─────────────────────────────────────────────
        this.#path = path;
        this.#pathIdx = 0;
        this.#target = target;

        // ── Attack state ──────────────────────────────────────────────────
        this.#attacking = false;
        this.#attackTimer = 0;

        // ── Graphics  ─────────────────────────────────────────────────────
        this.#gfx = scene.add.graphics();
        this.#color = config.enemy.color;

        // TEST TEST TEST
        this.#pathGfx = scene.add.graphics().setDepth(1);
        this.#drawPath();

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);

        this.#draw();
    }

    // ── Phaser lifecycle ──────────────────────────────────────────────────────

    /** Called by Phaser every frame before the main scene update. */
    preUpdate(time, delta) {
        //if (!this.active) return;
        //if (this.#health <= 0) this.destroy();

        const tileSize = config.world.tileSize;
        const step = this.#speed * (delta / 1000);

        if (this.#attacking) {
            this.#tickAttack(delta);
        } else {
            this.#tickMove(step);
        }

        // Sync pixel position from grid position
        this.pixelX = this.gridX * tileSize + tileSize / 2;
        this.pixelY = this.gridY * tileSize + tileSize / 2;

        this.#draw();
    }

    // applies the damage (amount) to this enemy
    // returns true if destroyed (and destroys itself)
    // returns false if not destroyed but damaged
    doDamage(amount) {
        this.#health -= amount;
        if (this.#health <= 0) {
            this.destroy();
            return true;
        } else {
            return false;
        }
    }

    destroy(fromScene) {
        console.log('enemy at', this.gridX, this.gridY, 'was destroyed')
        this.active = false;

        // remove enemy from enemy manager list
        //console.log('destroyed', 'index:', this.scene.enemyManager.enemies.indexOf(this));
        const index = this.scene.enemyManager.enemies.indexOf(this);
        if (index > -1) {
            this.scene.enemyManager.enemies.splice(index, 1);
        }

        // destroy
        this.#pathGfx.destroy();
        this.#gfx.destroy();
        super.destroy(fromScene);
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    /** Diamond shape (two triangles). Swap this body for a Sprite later. */
    #draw() {
        const gfx = this.#gfx;
        gfx.clear();

        const s = (config.world.tileSize * config.enemy.sizeRatio) / 2;
        const { pixelX: px, pixelY: py } = this;

        gfx.fillStyle(this.#attacking ? 0xff8800 : this.#color, 1);
        // Top half
        gfx.fillTriangle(
            px, py - s,
            px - s, py,
            px + s, py,
        );
        // Bottom half
        gfx.fillTriangle(
            px - s, py,
            px + s, py,
            px, py + s,
        );
    }

    // TEST TEST TEST
    #drawPath() {
        this.#pathGfx.clear();
        if (!this.#path || this.#path.length < 2) return;

        this.#pathGfx.lineStyle(1, 0xe63946, 0.3);
        this.#pathGfx.beginPath();

        const start = gridToWorld(Math.round(this.gridX), Math.round(this.gridY));
        this.#pathGfx.moveTo(start.x, start.y);

        this.#path.slice(this.#pathIdx).forEach(({ col, row }) => {
            const { x, y } = gridToWorld(col, row);
            this.#pathGfx.lineTo(x, y);
        });
        this.#pathGfx.strokePath();
    }

    // ── Movement ──────────────────────────────────────────────────────────────

    #tickMove(step) {
        // Validate current target still exists
        if (!structureMap.has(gridKey(this.#target.col, this.#target.row))) {
            this.#retarget();
            return;
        }

        // Path exhausted → switch to attack mode
        if (this.#pathIdx >= this.#path.length) {
            const best = this.#pickTarget(Math.round(this.gridX), Math.round(this.gridY));
            if (best && (best.col !== this.#target.col || best.row !== this.#target.row)) {
                this.#retarget();
                return;
            }
            this.#attacking = true;
            this.#attackTimer = 0;
            return;
        }

        const waypoint = this.#path[this.#pathIdx];
        const dx = waypoint.col - this.gridX;
        const dy = waypoint.row - this.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= step) {
            // Snap to waypoint
            this.gridX = waypoint.col;
            this.gridY = waypoint.row;
            this.#pathIdx++;

            // Re-evaluate target on every waypoint snap
            const best = this.#pickTarget(Math.round(this.gridX), Math.round(this.gridY));
            if (best && (best.col !== this.#target.col || best.row !== this.#target.row)) {
                this.#target = best;
            }

            const newPath = Enemy.findPathToAdjacent(
                Math.round(this.gridX), Math.round(this.gridY),
                this.#target.col, this.#target.row,
            );
            if (newPath) {
                this.#path = newPath; this.#pathIdx = 0;
                this.#drawPath(); // TEST TEST TEST
            }
        } else {
            this.gridX += (dx / dist) * step;
            this.gridY += (dy / dist) * step;
        }
    }

    // ── Attack ────────────────────────────────────────────────────────────────

    #tickAttack(delta) {
        // Target destroyed mid-attack
        if (!structureMap.has(gridKey(this.#target.col, this.#target.row))) {
            this.#attacking = false;
            this.#retarget();
            return;
        }

        // Better target appeared nearby
        const best = this.#pickTarget(Math.round(this.gridX), Math.round(this.gridY));
        if (best && (best.col !== this.#target.col || best.row !== this.#target.row)) {
            this.#attacking = false;
            this.#retarget();
            return;
        }

        this.#attackTimer += delta;
        if (this.#attackTimer >= ENEMY_ATTACK_RATE) {
            this.#attackTimer -= ENEMY_ATTACK_RATE;
            const destroyed = this.scene._damageStructure(this.#target.col, this.#target.row, ENEMY_DAMAGE);
            if (destroyed) {
                this.#attacking = false;
                this.#retarget();
            }
        }
    }

    // ── Retarget ──────────────────────────────────────────────────────────────

    #retarget() {
        const newTarget = this.#pickTarget(Math.round(this.gridX), Math.round(this.gridY));
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

        this.#target = newTarget;
        this.#path = newPath;
        this.#pathIdx = 0;
        this.#attacking = false;
        this.#attackTimer = 0;
        this.#drawPath();
    }

    // ── Target selection ──────────────────────────────────────────────────────

    #pickTarget(fromCol, fromRow) {
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
            if (col < 0 || col >= numCols || row < 0 || row >= numRows) return false;
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