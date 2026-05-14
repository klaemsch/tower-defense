// ─── Shared Constants ─────────────────────────────────────────────────────────
const TILE = 40;
const COLS = 20;  // 800 / 40
const ROWS = 15;  // 600 / 40

// ─── Shared State ─────────────────────────────────────────────────────────────
// Central lookup: "col,row" -> gameObject
const structureMap = new Map();

let _scene = null;  // set in create(), available to all files
let gameOver = false;

// ─── Grid Helpers ─────────────────────────────────────────────────────────────
function worldToGrid(x, y) {
    return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}
function gridToWorld(col, row) {
    return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}
function gridKey(col, row) { return `${col},${row}`; }
function isCellOccupied(col, row) { return structureMap.has(gridKey(col, row)); }

function placeInMap(col, row, gameObject) {
    structureMap.set(gridKey(col, row), gameObject);
}

// Called by enemies.js — returns true if the structure was destroyed
function damageStructure(col, row, amount) {
    const key = gridKey(col, row);
    const structure = structureMap.get(key);
    if (!structure) return true;

    // damage structure
    structure.health -= amount;

    // TEST TEST TEST
    if (structure.type === 'HQ') {
        _scene.registry.set('hq-health', structure.health);
    }
    

    // check if structure was destroyed (health below zero)
    if (structure.health <= 0) {
        console.log('structure of type', structure.type, 'was destroyed');
        // destroy structure and remove it from structure map
        structure.destroy(true);
        structureMap.delete(key);
        // check if destroyed structure is HQ
        if (structure.type === 'HQ') triggerGameOver();
        return true;
    }
    return false;
}

function triggerGameOver() {
    console.log('game over triggered');
    gameOver = true;
    const cx = (COLS * TILE) / 2;
    const cy = (ROWS * TILE) / 2;
    _scene.add.rectangle(cx, cy, COLS * TILE, ROWS * TILE, 0x000000, 0.65).setDepth(50);
    _scene.add.text(cx, cy - 30, 'GAME OVER', {
        fontSize: '48px', color: '#e63946', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(51);
    _scene.add.text(cx, cy + 24, 'Your HQ was destroyed', {
        fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(51);
    _scene.time.paused = true;
}

// ─── Phaser Config ────────────────────────────────────────────────────────────
const config = {
    type: Phaser.AUTO,
    width: COLS * TILE,
    height: ROWS * TILE,
    backgroundColor: '#1a1a2e',
    scene: { preload, create, update }
};

// ─── Scene Lifecycle ──────────────────────────────────────────────────────────
function preload() { }

function create() {
    _scene = this;

    createWorld(this);       // world.js
    this.woodShops = new WoodShopManager(this);
    this.enemyManager = new EnemyManager(this);

    // resources
    initHUD(this)
}

function update(time, delta) {
    if (gameOver) return;
    this.enemyManager.update(delta);
}

// ─── Boot (last file loaded fires this) ──────────────────────────────────────
// Called from the bottom of the last script in load order.
function startGame() {
    new Phaser.Game(config);
}