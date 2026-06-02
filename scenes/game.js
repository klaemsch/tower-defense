class GameScene extends Phaser.Scene {

    constructor() {
        super(globalConfig.sceneKeys.game);
    }

    preload() { }

    create() {
        // register event listeners
        this.#registerEventListeners();

        // Initialize inventory manager and move it to registry
        const inventoryManager = new InventoryManager(this);
        this.registry.set(globalConfig.registryKeys.inventoryManager, inventoryManager);

        // launch the HUD scene
        this.scene.launch(globalConfig.sceneKeys.hud);

        // launch the shop scene (and sleep immediately)
        this.scene.launch(globalConfig.sceneKeys.shop);
        this.scene.sleep(globalConfig.sceneKeys.shop);

        createWorld(this);       // world.js

        // Initialize enemy manager and move it to registry
        const enemyManager = new EnemyManager(this);
        this.registry.set(globalConfig.registryKeys.enemyManager, enemyManager);

        // Initialize placer and move it to registry
        const placer = new Placer(this);
        this.registry.set(globalConfig.registryKeys.placer, placer);

        // Initialize game flow manager and move it to registry
        const gameFlowManager = new GameFlowManager(this);
        this.registry.set(globalConfig.registryKeys.gameFlowManager, gameFlowManager);

    }

    destroy() {
        this.#destroyEventListeners();
    }

    #registerEventListeners() {
        this.game.events.on(globalConfig.eventKeys.gameResume, () => this.scene.wake());
        this.game.events.on(globalConfig.eventKeys.gamePause, () => this.scene.sleep());
        this.game.events.on(globalConfig.eventKeys.gameOver, () => this.scene.pause());
        this.game.events.on(globalConfig.eventKeys.gameWon, () => this.scene.pause());
    }

    #destroyEventListeners() {
        this.game.events.off(globalConfig.eventKeys.gamePause);
        this.game.events.off(globalConfig.eventKeys.gamePause);
        this.game.events.off(globalConfig.eventKeys.gameOver);
        this.game.events.off(globalConfig.eventKeys.gameWon);
    }
}

// add scenes to config -> TODO: maybe there is a better way to do this
phaserConfig.scene = [GameScene, HudScene, ShopScene]

// ─── Boot (last file loaded fires this) ──────────────────────────────────────
// Called from the bottom of the last script in load order.
function startGame() {
    const game = new Phaser.Game(phaserConfig);
    if (globalConfig.debug) window.__game = game;
}