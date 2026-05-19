// ─── Shared Constants ─────────────────────────────────────────────────────────
// TODO: remove this
const { tileSize, numCols, numRows } = config.world;

// ─── Shared State ─────────────────────────────────────────────────────────────

// Central lookup: "col,row" -> gameObject
const structureMap = new Map();

// ─── Grid Helpers ─────────────────────────────────────────────────────────────
function worldToGrid(x, y) {
    return { col: Math.floor(x / tileSize), row: Math.floor(y / tileSize) };
}
function gridToWorld(col, row) {
    return { x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 };
}
function gridKey(col, row) { return `${col},${row}`; }
function isCellOccupied(col, row) { return structureMap.has(gridKey(col, row)); }

function placeInMap(col, row, gameObject) {
    structureMap.set(gridKey(col, row), gameObject);
}

class GameScene extends Phaser.Scene {

    constructor() {
        super(config.sceneKeys.game);
        this.gameOver = false;
        this.gameFlowManager = null;
    }

    preload() { }

    create() {
        // launch the HUD scene
        this.scene.launch(config.sceneKeys.hud);

        // launch the shop scene (and sleep immediately)
        this.scene.launch(config.sceneKeys.shop);
        this.scene.sleep(config.sceneKeys.shop);

        createWorld(this);       // world.js

        this.enemyManager = new EnemyManager(this);

        const placer = new Placer(this);
        this.registry.set('placer', placer);

        // Initialize game flow manager
        this.gameFlowManager = new GameFlowManager(this);
        this.registry.set('gameFlowManager', this.gameFlowManager);

        // initialise resources, TODO: maybe do this somewhere else
        this.registry.set(config.resources.wood.registryKey, config.resources.wood.initialValue);
    }

    update(time, delta) {
        if (this.gameOver) return;
        this.registry.set('enemies', this.enemyManager.enemies.getLength()); // doing this every loop is a bit unnecessary
    }

    // TODO: rework and move overlay to HUD
    triggerGameOver() {
        console.log('game over triggered');
        this.gameOver = true;
        const cx = (numCols * tileSize) / 2;
        const cy = (numRows * tileSize) / 2;
        this.add.rectangle(cx, cy, numCols * tileSize, numRows * tileSize, 0x000000, 0.65).setDepth(50);
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

    createTimeline() {
        var timeline = this.add.timeline([
            {
                // Time condition
                at: 0,
                //in:
                //from:

                // Enable condition
                if(event) {
                    // this: target parameter
                    return true;  // false
                },

                set: {
                    key: 'value',
                },

                run() {
                    // this: target parameter
                    console.log('timeline event fired run')
                },

                loop() {
                    console.log('timeline event fired loop')
                },

                sound: '',

                event: 'test-event',

                // target: this,

                // once: false,
                // stop: false,
            },

            // ...
        ])
        timeline.on('test-event', ()=>console.log('test-event recieved'));
        timeline.play();
    }

}

// add scenes to config -> TODO: maybe there is a better way to do this
phaserConfig.scene = [GameScene, HudScene, ShopScene]

// ─── Boot (last file loaded fires this) ──────────────────────────────────────
// Called from the bottom of the last script in load order.
function startGame() {
    new Phaser.Game(phaserConfig);
}