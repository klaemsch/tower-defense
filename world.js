// ─── createWorld ─────────────────────────────────────────────────────────────
// Called from game.js create(). Draws the grid, places HQ and trees.
function createWorld(scene) {
    drawGrid(scene);
    scene.add.hq();
    placeTrees(scene);
}

function drawGrid(scene) {
    const tileSize = config.world.tileSize;
    const numRows = config.world.numRows;
    const numCols = config.world.numCols;

    const gfx = scene.add.graphics();
    gfx.lineStyle(1, 0xffffff, 0.07);
    for (let c = 0; c <= numCols; c++)
        gfx.lineBetween(c * tileSize, 0, c * tileSize, numRows * tileSize);
    for (let r = 0; r <= numRows; r++)
        gfx.lineBetween(0, r * tileSize, numCols * tileSize, r * tileSize);
}

function placeTrees(scene) {
    const numRows = config.world.numRows;
    const numCols = config.world.numCols;

    let placed = 0, attempts = 0;
    while (placed < config.world.generation.numTrees && attempts < 500) {
        attempts++;
        const col = Phaser.Math.Between(0, numCols - 1);
        const row = Phaser.Math.Between(0, numRows - 1);
        if (isCellOccupied(col, row)) continue;

        scene.add.tree(col, row);
        placed++;
    }
}
