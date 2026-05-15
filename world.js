// ─── World Config ─────────────────────────────────────────────────────────────
const TREE_COUNT = config.world.generation.numTrees;

// ─── createWorld ─────────────────────────────────────────────────────────────
// Called from game.js create(). Draws the grid, places HQ and trees.
function createWorld(scene) {
    drawGrid(scene);
    placeHQ(scene);
    placeTrees(scene);
}

function drawGrid(scene) {
    const g = scene.add.graphics();
    g.lineStyle(1, 0xffffff, 0.07);
    for (let c = 0; c <= COLS; c++)
        g.lineBetween(c * TILE, 0, c * TILE, ROWS * TILE);
    for (let r = 0; r <= ROWS; r++)
        g.lineBetween(0, r * TILE, COLS * TILE, r * TILE);
}

function placeHQ(scene) {
    const col = Math.floor(COLS / 2);
    const row = Math.floor(ROWS / 2);
    scene.add.structure(col, row, 'HQ', config.hq.color, config.hq.label, config.hq.health);
}

function placeTrees(scene) {
    let placed = 0, attempts = 0;
    while (placed < TREE_COUNT && attempts < 500) {
        attempts++;
        const col = Phaser.Math.Between(0, COLS - 1);
        const row = Phaser.Math.Between(0, ROWS - 1);
        if (isCellOccupied(col, row)) continue;

        scene.add.tree(col, row);
        placed++;
    }
}
