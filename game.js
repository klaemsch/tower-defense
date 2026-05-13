const TILE = 40; // grid cell size in pixels
const COLS = 20;  // 800 / 40
const ROWS = 15;  // 600 / 40

// Central lookup: "col,row" -> { type, gameObject, ... }
const structureMap = new Map();

// Helper: convert world coords to grid cell
function worldToGrid(x, y) {
    return {
        col: Math.floor(x / TILE),
        row: Math.floor(y / TILE)
    };
}

// Helper: get top-left world position of a grid cell
function gridToWorld(col, row) {
    return {
        x: col * TILE + TILE / 2,
        y: row * TILE + TILE / 2
    };
}

function gridKey(col, row) {
    return `${col},${row}`;
}

function isCellOccupied(col, row) {
    return structureMap.has(gridKey(col, row));
}

function placeInMap(col, row, type, gameObject) {
    structureMap.set(gridKey(col, row), { type, gameObject, col, row });
}

// ─────────────────────────────────────────────

const config = {
    type: Phaser.AUTO,
    width: COLS * TILE,
    height: ROWS * TILE,
    backgroundColor: '#1a1a2e',
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let trees;
let woodShops;
let wood = 0;
let woodText;
let collectionRadius = 1; // in grid cells
let gridGraphics;
let hoverGraphics;

function preload() { }

function create() {
    // ── Draw grid ──────────────────────────────────────
    gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0xffffff, 0.07);
    for (let c = 0; c <= COLS; c++) {
        gridGraphics.lineBetween(c * TILE, 0, c * TILE, ROWS * TILE);
    }
    for (let r = 0; r <= ROWS; r++) {
        gridGraphics.lineBetween(0, r * TILE, COLS * TILE, r * TILE);
    }

    // ── HQ (center) ────────────────────────────────────
    const hqCol = Math.floor(COLS / 2);
    const hqRow = Math.floor(ROWS / 2);
    const hqPos = gridToWorld(hqCol, hqRow);
    const hq = this.add.rectangle(hqPos.x, hqPos.y, TILE - 2, TILE - 2, 0x888888);
    this.add.text(hqPos.x, hqPos.y, 'HQ', {
        fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    placeInMap(hqCol, hqRow, 'hq', hq);
    initEnemies(this, hqCol, hqRow);

    // ── Trees ───────────────────────────────────────────
    trees = this.add.group();
    let placed = 0;
    let attempts = 0;
    while (placed < 15 && attempts < 500) {
        attempts++;
        const col = Phaser.Math.Between(0, COLS - 1);
        const row = Phaser.Math.Between(0, ROWS - 1);
        if (isCellOccupied(col, row)) continue;

        const pos = gridToWorld(col, row);

        const geom = Phaser.Geom.Triangle.BuildEquilateral(pos.x, pos.y - TILE/4, TILE-8);
        const tree = this.add.graphics();
        tree.fillStyle(0x2d6a4f);
        tree.fillTriangleShape(geom);

        // store position manually since Graphics has no built-in x/y for your lookup
        tree.setData('col', col);
        tree.setData('row', row);
        trees.add(tree);
        placeInMap(col, row, 'tree', tree);
        placed++;
    }

    // ── Wood shops group ────────────────────────────────
    woodShops = this.add.group();

    // ── Hover highlight ────────────────────────────────
    hoverGraphics = this.add.graphics();

    // ── Resource display ───────────────────────────────
    woodText = this.add.text(8, 8, 'Wood: 0', {
        fontSize: '14px',
        color: '#a8dadc',
        fontStyle: 'bold',
        backgroundColor: '#00000066',
        padding: { x: 6, y: 3 }
    }).setDepth(10);

    // ── Pointer move: highlight hovered cell ───────────
    this.input.on('pointermove', (pointer) => {
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        hoverGraphics.clear();
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

        const occupied = isCellOccupied(col, row);
        hoverGraphics.lineStyle(2, occupied ? 0xff4444 : 0xffffff, 0.6);
        hoverGraphics.strokeRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2);
    });

    // ── Click: place wood shop ──────────────────────────
    this.input.on('pointerdown', (pointer) => {
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        if (isCellOccupied(col, row)) return; // blocked

        const pos = gridToWorld(col, row);
        const shop = this.add.rectangle(pos.x, pos.y, TILE - 4, TILE - 4, 0x1d3557);
        this.add.text(pos.x, pos.y, '🏪', { fontSize: '16px' }).setOrigin(0.5);
        woodShops.add(shop);
        placeInMap(col, row, 'woodshop', shop);

        // Draw collection radius overlay
        const radiusGraphics = this.add.graphics();
        radiusGraphics.lineStyle(1, 0xa8dadc, 0.25);
        radiusGraphics.strokeRect(
            (col - collectionRadius) * TILE,
            (row - collectionRadius) * TILE,
            (collectionRadius * 2 + 1) * TILE,
            (collectionRadius * 2 + 1) * TILE
        );
        shop.setData('col', col);
        shop.setData('row', row);
    });

    // ── Wood collection timer ───────────────────────────
    this.time.addEvent({
        delay: 1000,
        callback: collectWood,
        callbackScope: this,
        loop: true
    });
}

function update(time, delta) {
    updateEnemies(this, delta);
}

function collectWood() {
    woodShops.getChildren().forEach(shop => {
        const sCol = shop.getData('col');
        const sRow = shop.getData('row');

        structureMap.forEach((entry) => {
            if (entry.type !== 'tree') return;
            const dist = Math.max(Math.abs(entry.col - sCol), Math.abs(entry.row - sRow));
            if (dist <= collectionRadius) {
                wood++;
            }
        });
    });
    woodText.setText(`Wood: ${wood}`);
}