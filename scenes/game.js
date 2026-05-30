// ─── Shared State ─────────────────────────────────────────────────────────────

// Central lookup: "col,row" -> gameObject
const structureMap = new Map();

// ─── Grid Helpers ─────────────────────────────────────────────────────────────
function worldToGrid(x, y) {
    const { tileSize } = config.world;
    return { col: Math.floor(x / tileSize), row: Math.floor(y / tileSize) };
}
function gridToWorld(col, row) {
    const { tileSize } = config.world;
    return { x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 };
}
function gridKey(col, row) { return `${col},${row}`; }
function isCellOccupied(col, row) { return structureMap.has(gridKey(col, row)); }

function placeInMap(col, row, gameObject) {
    structureMap.set(gridKey(col, row), gameObject);
}

function removeFromMap(col, row) {
    structureMap.delete(gridKey(col, row));
}

class GameScene extends Phaser.Scene {

    constructor() {
        super(config.sceneKeys.game);
    }

    preload() { }

    create() {
        // register event listeners
        this.#registerEventListeners();

        // Initialize progress manager and move it to registry
        const progressManager = new ProgressManager(this);
        this.registry.set(config.registryKeys.progressManager, progressManager);

        // launch the HUD scene
        this.scene.launch(config.sceneKeys.hud);

        // launch the shop scene (and sleep immediately)
        this.scene.launch(config.sceneKeys.shop);
        this.scene.sleep(config.sceneKeys.shop);

        createWorld(this);       // world.js

        // Initialize enemy manager and move it to registry
        const enemyManager = new EnemyManager(this);
        this.registry.set(config.registryKeys.enemyManager, enemyManager);

        // Initialize placer and move it to registry
        const placer = new Placer(this);
        this.registry.set(config.registryKeys.placer, placer);

        // Initialize game flow manager and move it to registry
        const gameFlowManager = new GameFlowManager(this);
        this.registry.set(config.registryKeys.gameFlowManager, gameFlowManager);

    }

    destroy() {
        this.#destroyEventListeners();
    }

    #registerEventListeners() {
        this.game.events.on(config.eventKeys.gameResume, () => this.scene.wake());
        this.game.events.on(config.eventKeys.gamePause, () => this.scene.sleep());
        this.game.events.on(config.eventKeys.gameOver, () => this.scene.pause());
        this.game.events.on(config.eventKeys.gameWon, () => this.scene.pause());
    }

    #destroyEventListeners() {
        this.game.events.off(config.eventKeys.gamePause);
        this.game.events.off(config.eventKeys.gamePause);
        this.game.events.off(config.eventKeys.gameOver);
        this.game.events.off(config.eventKeys.gameWon);
    }
}

// add scenes to config -> TODO: maybe there is a better way to do this
phaserConfig.scene = [GameScene, HudScene, ShopScene]

// ─── Boot (last file loaded fires this) ──────────────────────────────────────
// Called from the bottom of the last script in load order.
function startGame() {
    new Phaser.Game(phaserConfig);
}