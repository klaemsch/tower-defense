// TODO: maybe use a NineSlice here: https://docs.phaser.io/phaser/concepts/gameobjects/nine-slice
class ShopScene extends Phaser.Scene {
    #cardWidth = config.shop.layout.cardWidth;
    #cardHeight = config.shop.layout.cardHeight;
    #cardGap = config.shop.layout.cardGap;
    #imgSize = config.shop.layout.imgSize;

    constructor() {
        super(config.sceneKeys.shop);
    }

    preload() { }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ── Overlay with opacity to "blur" the game in the background ────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(100);

        // ── Title ────────────────────────────────────────────────────────────
        this.add.text(W / 2, 72, config.shop.title, {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(101);

        // ── Subtitle ─────────────────────────────────────────────────────────
        this.add.text(W / 2, 116, config.shop.subtitle, {
            fontSize: '16px',
            color: '#7ecfc2',
        }).setOrigin(0.5).setDepth(101);

        // ── Cards ─────────────────────────────────────────────────────────────
        const totalWidth =
            cards.length * this.#cardWidth +
            (cards.length - 1) * this.#cardGap;
        const startX = (W - totalWidth) / 2;
        const cardY = H / 2 - 20; // vertical center of card area

        cards.forEach((card, i) => {
            const cx = startX + i * (this.#cardWidth + this.#cardGap) + this.#cardWidth / 2;
            this.#createCard(cx, cardY, card);
        });

        // ── Continue button ───────────────────────────────────────────────────
        const btnY = cardY + config.shop.layout.cardHeight / 2 + 40;
        new RoundedButton(this, W / 2, btnY, 160, 44, 'Continue  →', {
            radius: 10,
            fontSize: '18px',
        })
            .setDepth(101)
            .on('pointerdown', () => this.scene.sleep());
    }

    // ── Card builder ──────────────────────────────────────────────────────────
    #createCard(cx, cy, card) {
        const DEPTH = 101;
        const CW = this.#cardWidth;
        const CH = this.#cardHeight;
        const IS = this.#imgSize;
        const left = cx - CW / 2;
        const top = cy - CH / 2;
        const RADIUS = 12;

        // Card background (rounded)
        const bg = this.#roundedRect(
            left, top, CW, CH, RADIUS,
            0x12233a, 1,
            card.popular ? 0x3b8bba : 0x2a4a6a,
            card.popular ? 2 : 1,
            DEPTH
        );

        // Make card interactive for hover highlight
        bg.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, CW, CH),
            Phaser.Geom.Rectangle.Contains
        )
            //.on('pointerover', () => { bg.clear(); this.#drawRoundedRect(bg, 0, 0, CW, CH, RADIUS, 0x1a2f4a, 1, card.popular ? 0x3b8bba : 0x2a4a6a, card.popular ? 2 : 1); })
            //.on('pointerout', () => { bg.clear(); this.#drawRoundedRect(bg, 0, 0, CW, CH, RADIUS, 0x12233a, 1, card.popular ? 0x3b8bba : 0x2a4a6a, card.popular ? 2 : 1); });

        // "Popular" badge (rounded)
        if (card.popular) {
            const PBW = 64, PBH = 20;
            this.#roundedRect(
                cx - PBW / 2, top - PBH / 2, PBW, PBH, 6,
                0x3b8bba, 1, null, 0, DEPTH + 1
            );
            this.add.text(cx, top, 'Popular', {
                fontSize: '11px',
                color: '#e6f4fb',
            }).setOrigin(0.5, 0.5).setDepth(DEPTH + 2);
        }

        // Card title (centered near top)
        this.add.text(cx, top + 28, card.title, {
            fontSize: '15px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(DEPTH + 1);

        // Image placeholder — rounded background
        const imgY = cy - 16;
        this.#roundedRect(
            cx - IS / 2, imgY - IS / 2, IS, IS, 8,
            0x1d3a5f, 1, null, 0,
            DEPTH + 1
        );

        // Colored icon square inside the placeholder
        const iconSize = IS * 0.55;
        this.#roundedRect(
            cx - iconSize / 2, imgY - iconSize / 2, iconSize, iconSize, 6,
            card.color, 0.85, null, 0,
            DEPTH + 2
        );

        // Description text (centered at bottom)
        this.add.text(cx, top + CH - 62, card.description, {
            fontSize: '12px',
            color: '#8fa8c4',
            align: 'center',
            lineSpacing: 4,
        }).setOrigin(0.5).setDepth(DEPTH + 1);

        // Buy button (rounded)
        new RoundedButton(this, cx, top + CH - 22, CW - 24, 28, `${card.cost} coins`, {
            fontSize: '13px',
            textColor: '#a8dadc',
        }).setDepth(DEPTH + 2);
    }

    // ── Rounded rect helpers ──────────────────────────────────────────────────

    // Creates a Graphics object, draws a rounded rect, positions it, returns it.
    // x/y are the top-left corner in world space.
    #roundedRect(x, y, w, h, r, fillColor, fillAlpha, strokeColor, strokeWidth, depth) {
        const gfx = this.add.graphics().setDepth(depth);
        // Position the Graphics so local (0,0) == world (x, y)
        gfx.setPosition(x, y);
        this.#drawRoundedRect(gfx, 0, 0, w, h, r, fillColor, fillAlpha, strokeColor, strokeWidth);
        return gfx;
    }

    // Draws into an existing Graphics object using local coords.
    #drawRoundedRect(gfx, x, y, w, h, r, fillColor, fillAlpha, strokeColor, strokeWidth) {
        gfx.clear();
        if (strokeColor != null && strokeWidth > 0) {
            gfx.lineStyle(strokeWidth, strokeColor, 1);
        }
        gfx.fillStyle(fillColor, fillAlpha);
        gfx.fillRoundedRect(x, y, w, h, r);
        if (strokeColor != null && strokeWidth > 0) {
            gfx.strokeRoundedRect(x, y, w, h, r);
        }
    }
}