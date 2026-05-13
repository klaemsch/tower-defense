// ─── Enemy Configuration ──────────────────────────────────────────────────────
const ENEMY_SPEED       = 0.5;   // cells per second
const ENEMY_SPAWN_RATE  = 2000;  // ms between spawns
const ENEMY_DAMAGE      = 10;    // damage per hit to a structure
const ENEMY_ATTACK_RATE = 1000;  // ms between attacks while adjacent
const ENEMY_COLOR       = 0xe63946;
const ENEMY_SIZE        = TILE * 0.5;

// ─── State ────────────────────────────────────────────────────────────────────
let enemies    = [];
let enemyLayer;
let _hqCol, _hqRow;
let _scene;

function initEnemies(scene, hqGridCol, hqGridRow) {
    _hqCol  = hqGridCol;
    _hqRow  = hqGridRow;
    _scene  = scene;

    enemyLayer = scene.add.graphics();

    scene.time.addEvent({
        delay: ENEMY_SPAWN_RATE,
        callback: () => spawnEnemy(scene),
        loop: true
    });
}

// ─── Spawn ────────────────────────────────────────────────────────────────────
function spawnEnemy(scene) {
    const candidates = getBorderCells();
    Phaser.Utils.Array.Shuffle(candidates);

    for (const { col, row } of candidates) {
        if (isCellOccupied(col, row)) continue;

        const target = pickTarget(col, row);
        if (!target) continue;

        const path = findPathToAdjacent(col, row, target.col, target.row);
        if (!path) continue; // no route even to stand next to it

        const pos = gridToWorld(col, row);
        enemies.push({
            x: col, y: row,
            pixelX: pos.x, pixelY: pos.y,
            alive: true,
            path,
            pathIdx: 0,
            targetCol: target.col,
            targetRow: target.row,
            attacking: false,   // true while standing adjacent and dealing damage
            attackTimer: 0,     // ms accumulator
        });
        return;
    }
}

// ─── Update (called every frame from game.js update()) ───────────────────────
function updateEnemies(scene, delta) {
    const dt   = delta / 1000;
    const step = ENEMY_SPEED * dt;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.alive) { enemies.splice(i, 1); continue; }

        if (e.attacking) {
            tickAttack(e, delta);
        } else {
            tickMove(e, step);
        }

        e.pixelX = e.x * TILE + TILE / 2;
        e.pixelY = e.y * TILE + TILE / 2;
    }

    drawEnemies();
}

// ─── Movement tick ────────────────────────────────────────────────────────────
function tickMove(e, step) {
    // Check if target still exists — if not, re-target
    if (!structureMap.has(gridKey(e.targetCol, e.targetRow))) {
        retarget(e);
        if (!e.alive) return;
    }

    if (e.pathIdx >= e.path.length) {
        // About to start attacking — do one final re-evaluation in case
        // something closer was placed while we were walking
        const best = pickTarget(Math.round(e.x), Math.round(e.y));
        if (best && (best.col !== e.targetCol || best.row !== e.targetRow)) {
            retarget(e);
            return;
        }
        // Arrived at the cell adjacent to the target — start attacking
        e.attacking  = true;
        e.attackTimer = 0;
        return;
    }

    const waypoint = e.path[e.pathIdx];
    const dx       = waypoint.col - e.x;
    const dy       = waypoint.row - e.y;
    const dist     = Math.sqrt(dx * dx + dy * dy);

    if (dist <= step) {
        e.x = waypoint.col;
        e.y = waypoint.row;
        e.pathIdx++;

        // Re-evaluate target + path on every waypoint snap.
        // This catches newly placed structures that are now closer.
        if (!e.attacking) {
            const best = pickTarget(Math.round(e.x), Math.round(e.y));
            if (best && (best.col !== e.targetCol || best.row !== e.targetRow)) {
                // A closer (or different) target appeared — switch to it
                e.targetCol = best.col;
                e.targetRow = best.row;
            }
            const newPath = findPathToAdjacent(
                Math.round(e.x), Math.round(e.y),
                e.targetCol, e.targetRow
            );
            if (newPath) {
                e.path    = newPath;
                e.pathIdx = 0;
            }
        }
    } else {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
    }
}

// ─── Attack tick ─────────────────────────────────────────────────────────────
function tickAttack(e, delta) {
    // Verify the target is still there
    if (!structureMap.has(gridKey(e.targetCol, e.targetRow))) {
        e.attacking = false;
        retarget(e);
        return;
    }

    // Check if something closer was placed since we started attacking
    const best = pickTarget(Math.round(e.x), Math.round(e.y));
    if (best && (best.col !== e.targetCol || best.row !== e.targetRow)) {
        e.attacking = false;
        retarget(e);
        return;
    }

    e.attackTimer += delta;
    if (e.attackTimer >= ENEMY_ATTACK_RATE) {
        e.attackTimer -= ENEMY_ATTACK_RATE;

        const destroyed = damageStructure(e.targetCol, e.targetRow, ENEMY_DAMAGE);
        if (destroyed) {
            e.attacking = false;
            retarget(e);
        }
    }
}

// ─── Re-target after a kill ───────────────────────────────────────────────────
function retarget(e) {
    const newTarget = pickTarget(Math.round(e.x), Math.round(e.y));
    if (!newTarget) {
        // Nothing left to attack — stall in place (or could remove enemy here)
        e.alive = false;
        return;
    }

    const newPath = findPathToAdjacent(
        Math.round(e.x), Math.round(e.y),
        newTarget.col, newTarget.row
    );
    if (!newPath) {
        e.alive = false; // no route
        return;
    }

    e.targetCol   = newTarget.col;
    e.targetRow   = newTarget.row;
    e.path        = newPath;
    e.pathIdx     = 0;
    e.attacking   = false;
    e.attackTimer = 0;
}

// ─── Target selection ─────────────────────────────────────────────────────────
// Returns the nearest non-tree structure (woodshop or hq) by Euclidean distance.
// Falls back to HQ if nothing else exists.
function pickTarget(fromCol, fromRow) {
    let best     = null;
    let bestDist = Infinity;

    structureMap.forEach((entry) => {
        if (entry.type === 'tree') return; // ignore trees

        const d = Math.sqrt(
            (entry.col - fromCol) ** 2 + (entry.row - fromRow) ** 2
        );
        if (d < bestDist) {
            bestDist = d;
            best     = entry;
        }
    });

    return best; // null if map is empty
}

// ─── Pathfinding ─────────────────────────────────────────────────────────────
// Finds a path to any cell ADJACENT to (goalCol, goalRow) — not into it.
// Treats all occupied non-tree cells (except the goal itself) as walls.
function findPathToAdjacent(startCol, startRow, goalCol, goalRow) {
    // The enemy stands in a neighbour of the goal, so collect all free neighbours
    const adjacentGoals = getAdjacentCells(goalCol, goalRow).filter(({ col, row }) => {
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
        // The destination cell must be free (or already be where the enemy is)
        const entry = structureMap.get(gridKey(col, row));
        return !entry || (col === startCol && row === startRow);
    });

    if (adjacentGoals.length === 0) return null; // target is completely walled in

    // BFS from start; stop when we reach any adjacent-goal cell
    const goalSet = new Set(adjacentGoals.map(({ col, row }) => gridKey(col, row)));

    const key     = (c, r) => gridKey(c, r);
    const queue   = [{ col: startCol, row: startRow, path: [] }];
    const visited = new Set([key(startCol, startRow)]);

    const dirs = [
        { dc:  0, dr: -1 }, { dc: 0, dr: 1 },
        { dc: -1, dr:  0 }, { dc: 1, dr: 0 },
        { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
        { dc: -1, dr:  1 }, { dc: 1, dr:  1 },
    ];

    while (queue.length > 0) {
        const { col, row, path } = queue.shift();

        if (goalSet.has(key(col, row))) {
            return path; // path ends AT the adjacent cell, not inside the structure
        }

        for (const { dc, dr } of dirs) {
            const nc = col + dc;
            const nr = row + dr;
            const k  = key(nc, nr);

            if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
            if (visited.has(k)) continue;

            // Block occupied cells UNLESS it's one of our adjacent-goal cells
            const entry = structureMap.get(k);
            if (entry && !goalSet.has(k)) continue;

            visited.add(k);
            queue.push({ col: nc, row: nr, path: [...path, { col: nc, row: nr }] });
        }
    }

    return null;
}

function getAdjacentCells(col, row) {
    return [
        { col: col - 1, row },
        { col: col + 1, row },
        { col, row: row - 1 },
        { col, row: row + 1 },
        { col: col - 1, row: row - 1 },
        { col: col + 1, row: row - 1 },
        { col: col - 1, row: row + 1 },
        { col: col + 1, row: row + 1 },
    ];
}

// ─── Drawing ─────────────────────────────────────────────────────────────────
function drawEnemies() {
    enemyLayer.clear();

    for (const e of enemies) {
        const s = ENEMY_SIZE / 2;
        // Flash red/orange while attacking
        enemyLayer.fillStyle(e.attacking ? 0xff8800 : ENEMY_COLOR, 1);
        enemyLayer.fillTriangle(
            e.pixelX,     e.pixelY - s,
            e.pixelX - s, e.pixelY,
            e.pixelX + s, e.pixelY
        );
        enemyLayer.fillTriangle(
            e.pixelX - s, e.pixelY,
            e.pixelX + s, e.pixelY,
            e.pixelX,     e.pixelY + s
        );
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBorderCells() {
    const cells = [];
    for (let c = 0; c < COLS; c++) {
        cells.push({ col: c, row: 0 });
        cells.push({ col: c, row: ROWS - 1 });
    }
    for (let r = 1; r < ROWS - 1; r++) {
        cells.push({ col: 0,        row: r });
        cells.push({ col: COLS - 1, row: r });
    }
    return cells;
}