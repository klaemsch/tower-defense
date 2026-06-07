// TODO: maybe use a NineSlice here: https://docs.phaser.io/phaser/concepts/gameobjects/nine-slice
class ShopScene extends Phaser.Scene {
    #cardWidth = globalConfig.shop.layout.cardWidth;
    #cardHeight = globalConfig.shop.layout.cardHeight;
    #cardGap = globalConfig.shop.layout.cardGap;

    #inventoryManager;
    #cardMap = new Map(); // maps card config to card elements
    // TODO: instead of creating and deleting the cards each time the shop opens
    // better: create the cards once and overwrite the title, subtitle, image, callback

    constructor() {
        super(globalConfig.sceneKeys.shop);
    }

    preload() { }

    create() {
        this.#registerEventListeners();

        this.#inventoryManager = this.registry.get(globalConfig.registryKeys.inventoryManager);

        const W = this.scale.width;
        const H = this.scale.height;
        const cardY = H / 2 - 20;

        // ── Overlay with opacity to "blur" the game in the background ────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(globalStyles.depthMap.shopBackgroundBlur);

        // ── Title ────────────────────────────────────────────────────────────
        this.add.text(W / 2, 90, globalConfig.shop.title, {
            fontSize: globalStyles.text.sizes.title,
            color: globalStyles.text.colors.highlight,
            fontStyle: 'bold',
            //stroke: '#000000',
            //strokeThickness: 3,
        }).setOrigin(0.5).setDepth(globalStyles.depthMap.shopText);

        // ── Subtitle ──────────────────────────────────────────────────────────
        this.add.text(W / 2, 144, globalConfig.shop.subtitle, {
            fontSize: globalStyles.text.sizes.large,
            color: globalStyles.colors.cardDescription,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(globalStyles.depthMap.shopText);

        this.#createCards();

        const btnY = cardY + this.#cardHeight / 2 + 40;

        const rerollResourceConfig = globalConfig.resources[globalConfig.shop.reroll.costResourceRegistryKey];
        const rerollButtonText = `🎲 Reroll (${globalConfig.shop.reroll.cost} ${rerollResourceConfig.label})`;

        new RoundedButton(this, W / 2 - 100, btnY, rerollButtonText, {
            width: globalStyles.buttons.medium.width,
            height: globalStyles.buttons.medium.height,
            radius: 10,
            fontSize: globalStyles.text.sizes.medium,
        })
            .setDepth(globalStyles.depthMap.shopText)
            .on('pointerdown', () => {
                console.log('reroll');
                if (this.registry.get(globalConfig.shop.reroll.costResourceRegistryKey) >= globalConfig.shop.reroll.cost) {
                    this.registry.inc(globalConfig.shop.reroll.costResourceRegistryKey, -globalConfig.shop.reroll.cost);
                    this.#createCards();
                } else {
                    console.warn('not enough funds to reroll');
                }
            });

        new RoundedButton(this, W / 2 + 100, btnY, 'Continue  →', {
            width: globalStyles.buttons.medium.width,
            height: globalStyles.buttons.medium.height,
            radius: 10,
            fontSize: globalStyles.text.sizes.medium,
        })
            .setDepth(globalStyles.depthMap.shopText)
            .on('pointerdown', () => {
                this.#closeShop();
            });

        // create resource container, so the player sees its resources while shopping
        new ResourceContainer(this, 0, 0);
    }

    destroy() {
        this.#destroyCardElements();
        this.#destroyEventListeners();
    }

    #destroyCardElements() {
        this.#cardMap.forEach((cardElement, _cardConfig, _map) => {
            cardElement.destroy();
        });
    }

    // (re-)creates cards when the shop is opened
    #createCards() {

        this.#destroyCardElements();

        const numCardsInShop = 3;  // TODO
        //const totalWidth = cards.length * this.#cardWidth + (cards.length - 1) * this.#cardGap;
        const totalWidth = numCardsInShop * this.#cardWidth + (numCardsInShop - 1) * this.#cardGap;
        const startX = (this.scale.width - totalWidth) / 2;
        const cardY = this.scale.height / 2 - 20;

        const shuffledCards = Phaser.Utils.Array.Shuffle(cards);

        for (let i = 0; i < 3; i++) {
            const cardConfig = shuffledCards[i];
            const cx = startX + i * (this.#cardWidth + this.#cardGap) + this.#cardWidth / 2;

            // attach a callback to the cards config that is fired in the Card when the button is pressed
            cardConfig.buttonCallback = () => {
                //console.log('buttonCallback for', cardConfig.title);
                this.#buyCard(cardConfig);
            }

            // create card and attach the resulting container element to the config for later usage
            const cardElement = new Card(this, cx, cardY, cardConfig).setDepth(globalStyles.depthMap.shopText);

            this.#cardMap.set(cardConfig, cardElement);
        };
    }

    #buyCard(cardConfig) {
        //console.log('#buyCard for', cardConfig.title);
        if (this.registry.get(cardConfig.costResourceRegistryKey) - cardConfig.cost >= 0) {
            this.registry.inc(cardConfig.costResourceRegistryKey, -cardConfig.cost);
            this.#inventoryManager.addItem(cardConfig.itemConfig);
            const cardElement = this.#cardMap.get(cardConfig);
            if (!cardElement) {
                console.error('#buyCard: could not find cardElement from cardConfig in cardMap');
                return;
            }
            cardElement.destroy();
            this.#cardMap.delete(cardConfig);
            return true;
        } else {
            console.log('not enough funds to buy', cardConfig.title);
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
        this.events.on('wake', () => {
            this.#createCards();
        });
    }

    #destroyEventListeners() {
        this.game.events.off(globalConfig.eventKeys.shopOpen);
        this.game.events.off(globalConfig.eventKeys.shopClose);
        this.events.off('wake');
    }
}