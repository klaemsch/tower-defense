// ─── Shared Constants ─────────────────────────────────────────────────────────
const TILE = 40;
const COLS = 20;  // 800 / 40
const ROWS = 15;  // 600 / 40

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
        new Placer(this);
        this.enemyManager = new EnemyManager(this);

        // resources
        //initHUD(this)
    }

    update(time, delta) {
        if (this.gameOver) return;
        this.enemyManager.update(delta);
        this.registry.set('enemies', this.enemyManager.enemies.length); // doing this every loop is a bit unnecessary
    }

    // Called by enemies.js — returns true if the structure was destroyed
    _damageStructure(col, row, amount) {
        const key = gridKey(col, row);
        const structure = structureMap.get(key);
        if (!structure) return true;

        // damage structure
        structure.health -= amount;

        // TEST TEST TEST
        if (structure.type === 'HQ') {
            this.registry.set('hq-health', structure.health);
        }


        // check if structure was destroyed (health below zero)
        if (structure.health <= 0) {
            console.log('structure of type', structure.type, 'was destroyed');
            // destroy structure and remove it from structure map
            structure.destroy(true);
            structureMap.delete(key);
            // check if destroyed structure is HQ
            if (structure.type === 'HQ') this._triggerGameOver();
            return true;
        }
        return false;
    }

    _triggerGameOver() {
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

        // set structures and enemies to inactive to stop animations
        this.enemyManager.enemies.forEach((enemy) => enemy.active = false);
        structureMap.forEach((structure) => structure.active = false);
    }

}


// ─── Phaser Config ────────────────────────────────────────────────────────────
const config = {
    type: Phaser.AUTO,
    width: COLS * TILE,
    height: ROWS * TILE,
    backgroundColor: '#1a1a2e',
    scene: [GameScene, HudScene]
};

// ─── Boot (last file loaded fires this) ──────────────────────────────────────
// Called from the bottom of the last script in load order.
function startGame() {
    new Phaser.Game(config);
}