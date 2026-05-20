// ─── createWorld ─────────────────────────────────────────────────────────────
// Called from game.js create(). Draws the grid, places HQ and trees.
function createWorld(scene) {
    drawGrid(scene);
    if(!scene.add.hq()) console.error('Placing HQ failed');
    placeTrees(scene);
}

function drawGrid(scene) {
    const { tileSize, numCols, numRows } = config.world;

    const gfx = scene.add.graphics();
    gfx.lineStyle(1, 0xffffff, 0.07);
    for (let c = 0; c <= numCols; c++)
        gfx.lineBetween(c * tileSize, 0, c * tileSize, numRows * tileSize);
    for (let r = 0; r <= numRows; r++)
        gfx.lineBetween(0, r * tileSize, numCols * tileSize, r * tileSize);
}

function placeTrees(scene) {
    const { numCols, numRows } = config.world;

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
