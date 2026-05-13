// ─── Enemy Configuration ────────────────────────────────────────────────────
const ENEMY_SPEED       = 0.5;   // cells per second (modify this)
const ENEMY_SPAWN_RATE  = 2000;  // ms between spawns
const ENEMY_COLOR       = 0xe63946;
const ENEMY_SIZE        = TILE * 0.5;

// ─── Enemy Manager ───────────────────────────────────────────────────────────
// Call initEnemies(scene) from your create(), then updateEnemies(scene, delta)
// from your update(). Requires: structureMap, TILE, COLS, ROWS, gridToWorld,
// worldToGrid, gridKey to be in scope from game.js.

let enemies = [];       // { gameObject, x, y (float, cell coords) }
let enemyLayer;         // graphics object for drawing all enemies
let hqCol, hqRow;       // set by initEnemies

function initEnemies(scene, hqGridCol, hqGridRow) {
    hqCol = hqGridCol;
    hqRow = hqGridRow;

    enemyLayer = scene.add.graphics();

    scene.time.addEvent({
        delay: ENEMY_SPAWN_RATE,
        callback: () => spawnEnemy(scene),
        loop: true
    });
}

function spawnEnemy(scene) {
    // Pick a random unoccupied border cell to spawn from
    const candidates = getBorderCells();
    Phaser.Utils.Array.Shuffle(candidates);

    for (const { col, row } of candidates) {
        if (isCellOccupied(col, row)) continue;

        const pos = gridToWorld(col, row);

        // Enemy is a red diamond (rotated square) drawn via graphics
        // We store float cell position for sub-cell movement
        const enemy = {
            x: col,         // float cell position
            y: row,
            pixelX: pos.x,  // cached for drawing
            pixelY: pos.y,
            alive: true
        };
        enemies.push(enemy);
        return;
    }
}

function updateEnemies(scene, delta) {
    const dt = delta / 1000; // ms → seconds
    const step = ENEMY_SPEED * dt;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.alive) {
            enemies.splice(i, 1);
            continue;
        }

        // Direction vector toward HQ (cell space)
        const dx = hqCol - e.x;
        const dy = hqRow - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= step) {
            // Would reach or pass through HQ — destroy enemy
            e.alive = false;
            enemies.splice(i, 1);
            continue;
        }

        // Normalize and move
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;

        // Convert back to pixel space for rendering
        e.pixelX = e.x * TILE + TILE / 2;
        e.pixelY = e.y * TILE + TILE / 2;
    }

    drawEnemies();
}

function drawEnemies() {
    enemyLayer.clear();
    enemyLayer.fillStyle(ENEMY_COLOR, 1);
    enemyLayer.lineStyle(1, 0xffffff, 0.4);

    for (const e of enemies) {
        const s = ENEMY_SIZE / 2;
        // Draw a diamond shape
        enemyLayer.fillTriangle(
            e.pixelX,     e.pixelY - s,   // top
            e.pixelX - s, e.pixelY,        // left
            e.pixelX + s, e.pixelY         // right
        );
        enemyLayer.fillTriangle(
            e.pixelX - s, e.pixelY,        // left
            e.pixelX + s, e.pixelY,        // right
            e.pixelX,     e.pixelY + s     // bottom
        );
    }
}

// Returns all cells on the outer border of the grid
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