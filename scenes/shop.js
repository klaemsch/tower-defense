// TODO: maybe use a NineSlice here: https://docs.phaser.io/phaser/concepts/gameobjects/nine-slice
class ShopScene extends Phaser.Scene {
    #cardWidth = globalConfig.shop.layout.cardWidth;
    #cardHeight = globalConfig.shop.layout.cardHeight;
    #cardGap = globalConfig.shop.layout.cardGap;

    #progressManager;

    constructor() {
        super(globalConfig.sceneKeys.shop);
    }

    preload() { }

    create() {
        this.#registerEventListeners();

        this.#progressManager = this.registry.get(globalConfig.registryKeys.progressManager);

        const W = this.scale.width;
        const H = this.scale.height;

        // ── Overlay with opacity to "blur" the game in the background ────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(globalConfig.depthMap.shopBackgroundBlur);

        // ── Title ────────────────────────────────────────────────────────────
        this.add.text(W / 2, 72, globalConfig.shop.title, {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(globalConfig.depthMap.shopText);

        // ── Subtitle ──────────────────────────────────────────────────────────
        this.add.text(W / 2, 116, globalConfig.shop.subtitle, {
            fontSize: '16px',
            color: '#7ecfc2',
        }).setOrigin(0.5).setDepth(globalConfig.depthMap.shopText);

        // ── Cards ─────────────────────────────────────────────────────────────
        const totalWidth = cards.length * this.#cardWidth + (cards.length - 1) * this.#cardGap;
        const startX = (W - totalWidth) / 2;
        const cardY = H / 2 - 20;

        cards.forEach((card, i) => {
            const cx = startX + i * (this.#cardWidth + this.#cardGap) + this.#cardWidth / 2;

            // attach a callback to the cards config that is fired in the Card when the button is pressed
            card.buttonCallback = () => {
                this.#buyCard(card);
            }

            // create card and attach the resulting container element to the config for later usage
            card.cardElement = new Card(this, cx, cardY, card).setDepth(globalConfig.depthMap.shopText);
        });

        // ── Continue button ───────────────────────────────────────────────────
        const btnY = cardY + this.#cardHeight / 2 + 40;
        new RoundedButton(this, W / 2, btnY, 160, 44, 'Continue  →', {
            radius: 10,
            fontSize: '18px',
        })
            .setDepth(globalConfig.depthMap.shopText)
            .on('pointerdown', () => {
                this.#closeShop();
            });
    }

    destroy() {
        this.#destroyEventListeners();
    }

    #buyCard(card) {
        if (this.registry.get(card.costResourceRegistryKey) - card.cost >= 0) {
            this.registry.inc(card.costResourceRegistryKey, -card.cost);
            this.#progressManager.unlock(card.configEntry.internalType);
            card.cardElement.destroy();
            return true;
        } else {
            console.log('not enough funds');
            return false;
        }

    }

    #closeShop() {
        // send shop to sleep and wake game
        this.game.events.emit(globalConfig.eventKeys.shopClose);
        this.game.events.emit(globalConfig.eventKeys.gameResume);
    }

    #registerEventListeners() {
        this.game.events.on(globalConfig.eventKeys.shopOpen, () => this.scene.wake());
        this.game.events.on(globalConfig.eventKeys.shopClose, () => this.scene.sleep());
    }

    #destroyEventListeners() {
        this.game.events.off(globalConfig.eventKeys.shopOpen);
        this.game.events.off(globalConfig.eventKeys.shopClose);
    }
}