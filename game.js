const TILE = 40;
const COLS = 20;  // 800 / 40
const ROWS = 15;  // 600 / 40

// ─── Structure Health Config ──────────────────────────────────────────────────
const STRUCTURE_HEALTH = {
    hq:       200,   // modify these
    woodshop: 60,
};

// Central lookup: "col,row" -> { type, gameObject, col, row, health, maxHealth }
const structureMap = new Map();

// ─── Grid helpers ─────────────────────────────────────────────────────────────
function worldToGrid(x, y) {
    return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}
function gridToWorld(col, row) {
    return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}
function gridKey(col, row) { return `${col},${row}`; }
function isCellOccupied(col, row) { return structureMap.has(gridKey(col, row)); }

function placeInMap(col, row, type, gameObject) {
    const maxHealth = STRUCTURE_HEALTH[type] ?? 100;
    structureMap.set(gridKey(col, row), {
        type, gameObject, col, row,
        health: maxHealth, maxHealth
    });
}

// Called by enemies.js — returns true if the structure was destroyed
function damageStructure(col, row, amount) {
    const key   = gridKey(col, row);
    const entry = structureMap.get(key);
    if (!entry) return true; // already gone

    entry.health -= amount;
    if (entry.health <= 0) {
        // Destroy the game object(s) attached to this cell
        if (entry.gameObject && entry.gameObject.destroy) {
            entry.gameObject.destroy();
        }
        // Also destroy any child label stored on the entry
        if (entry.label && entry.label.destroy) {
            entry.label.destroy();
        }
        structureMap.delete(key);
        return true; // destroyed
    }
    return false;
}

// ─────────────────────────────────────────────────────────────────────────────

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
let collectionRadius = 3;
let gridGraphics;
let hoverGraphics;

function preload() {}

function create() {
    // ── Grid lines ────────────────────────────────────
    gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0xffffff, 0.07);
    for (let c = 0; c <= COLS; c++)
        gridGraphics.lineBetween(c * TILE, 0, c * TILE, ROWS * TILE);
    for (let r = 0; r <= ROWS; r++)
        gridGraphics.lineBetween(0, r * TILE, COLS * TILE, r * TILE);

    // ── HQ ───────────────────────────────────────────
    const hqCol = Math.floor(COLS / 2);
    const hqRow = Math.floor(ROWS / 2);
    const hqPos = gridToWorld(hqCol, hqRow);
    const hq    = this.add.rectangle(hqPos.x, hqPos.y, TILE - 2, TILE - 2, 0x888888);
    const hqLabel = this.add.text(hqPos.x, hqPos.y, 'HQ', {
        fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    placeInMap(hqCol, hqRow, 'hq', hq);
    structureMap.get(gridKey(hqCol, hqRow)).label = hqLabel;

    // ── Trees ─────────────────────────────────────────
    trees = this.add.group();
    let placed = 0, attempts = 0;
    while (placed < 15 && attempts < 500) {
        attempts++;
        const col = Phaser.Math.Between(0, COLS - 1);
        const row = Phaser.Math.Between(0, ROWS - 1);
        if (isCellOccupied(col, row)) continue;
        const pos  = gridToWorld(col, row);
        const half = TILE / 2 - 2;
        const tree = this.add.triangle(
            pos.x, pos.y,
            0, -half, -half * 0.75, half * 0.6, half * 0.75, half * 0.6,
            0x2d6a4f
        );
        trees.add(tree);
        placeInMap(col, row, 'tree', tree);
        placed++;
    }

    // ── Wood shops ────────────────────────────────────
    woodShops = this.add.group();

    // ── Hover highlight ───────────────────────────────
    hoverGraphics = this.add.graphics();

    // ── HUD ───────────────────────────────────────────
    woodText = this.add.text(8, 8, 'Wood: 0', {
        fontSize: '13px', color: '#a8dadc', fontStyle: 'bold',
        backgroundColor: '#00000066', padding: { x: 6, y: 3 }
    }).setDepth(10);

    // ── Input ─────────────────────────────────────────
    this.input.on('pointermove', (pointer) => {
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        hoverGraphics.clear();
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        const occupied = isCellOccupied(col, row);
        hoverGraphics.lineStyle(2, occupied ? 0xff4444 : 0xffffff, 0.6);
        hoverGraphics.strokeRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2);
    });

    this.input.on('pointerdown', (pointer) => {
        const { col, row } = worldToGrid(pointer.x, pointer.y);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        if (isCellOccupied(col, row)) return;

        const pos  = gridToWorld(col, row);
        const shop = this.add.rectangle(pos.x, pos.y, TILE - 4, TILE - 4, 0x1d3557);
        const icon = this.add.text(pos.x, pos.y, '🏪', { fontSize: '16px' }).setOrigin(0.5);
        woodShops.add(shop);
        placeInMap(col, row, 'woodshop', shop);
        structureMap.get(gridKey(col, row)).label = icon;

        const rg = this.add.graphics();
        rg.lineStyle(1, 0xa8dadc, 0.25);
        rg.strokeRect(
            (col - collectionRadius) * TILE, (row - collectionRadius) * TILE,
            (collectionRadius * 2 + 1) * TILE, (collectionRadius * 2 + 1) * TILE
        );
        shop.setData('col', col);
        shop.setData('row', row);
    });

    // ── Wood collection ───────────────────────────────
    this.time.addEvent({
        delay: 1000, callback: collectWood, callbackScope: this, loop: true
    });

    // ── Enemies ───────────────────────────────────────
    initEnemies(this, hqCol, hqRow);
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
            if (dist <= collectionRadius) wood++;
        });
    });
    woodText.setText(`Wood: ${wood}`);
}