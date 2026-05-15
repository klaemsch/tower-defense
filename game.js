// ─── Shared Constants ─────────────────────────────────────────────────────────
const TILE = config.world.tileSize;
const COLS = config.world.numCols;
const ROWS = config.world.numRows;

// ─── Shared State ─────────────────────────────────────────────────────────────

// Central lookup: "col,row" -> gameObject
const structureMap = new Map();

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

class GameScene extends Phaser.Scene {

    constructor() {
        super('gameScene');

        this.gameOver = false;
    }

    preload() { }

    create() {
        // launch the HUD
        this.scene.launch('hudScene');

        createWorld(this);       // world.js

        this.enemyManager = new EnemyManager(this);

        const placer = new Placer(this);
        this.registry.set('placer', placer);
    }

    update(time, delta) {
        if (this.gameOver) return;
        this.registry.set('enemies', this.enemyManager.enemies.length); // doing this every loop is a bit unnecessary
    }

    // Called by enemies.js — returns true if the structure was destroyed
    // TODO: move somewhere else
    _damageStructure(col, row, amount) {
        const key = gridKey(col, row);
        const structure = structureMap.get(key);
        if (!structure) return true;

        // damage structure
        structure.doDamage(amount);
    }

    triggerGameOver() {
        console.log('game over triggered');
        this.gameOver = true;
        const cx = (COLS * TILE) / 2;
        const cy = (ROWS * TILE) / 2;
        this.add.rectangle(cx, cy, COLS * TILE, ROWS * TILE, 0x000000, 0.65).setDepth(50);
        this.add.text(cx, cy - 30, 'GAME OVER', {
            fontSize: '48px', color: '#e63946', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(51);
        this.add.text(cx, cy + 24, 'Your HQ was destroyed', {
            fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5).setDepth(51);
        this.time.paused = true;

        // set structures and enemies to inactive to stop animations -> TODO: maybe game.pause() can do this more elegantly
        this.enemyManager.enemies.forEach((enemy) => enemy.active = false);
        structureMap.forEach((structure) => structure.active = false);
    }

}

// add scenes to config -> TODO: maybe there is a better way to do this
phaserConfig.scene = [GameScene, HudScene]

// ─── Boot (last file loaded fires this) ──────────────────────────────────────
// Called from the bottom of the last script in load order.
function startGame() {
    new Phaser.Game(phaserConfig);
}