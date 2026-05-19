class ShopScene extends Phaser.Scene {
    #title = 'Wave Complete!';
    #subtitle = 'You earned resources! Upgrade your towers.';

    // Layout constants
    #CARD_WIDTH  = 200;
    #CARD_HEIGHT = 280;
    #CARD_GAP    = 24;
    #IMG_SIZE    = 72;

    constructor() {
        super(config.sceneKeys.shop);
    }

    preload() { }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ── Overlay ──────────────────────────────────────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(100);

        // ── Title ────────────────────────────────────────────────────────────
        this.add.text(W / 2, 72, this.#title, {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(101);

        // ── Subtitle ─────────────────────────────────────────────────────────
        this.add.text(W / 2, 116, this.#subtitle, {
            fontSize: '16px',
            color: '#7ecfc2',
        }).setOrigin(0.5).setDepth(101);

        // ── Cards ─────────────────────────────────────────────────────────────
        const totalWidth =
            cards.length * this.#CARD_WIDTH +
            (cards.length - 1) * this.#CARD_GAP;
        const startX = (W - totalWidth) / 2;
        const cardY  = H / 2 - 20; // vertical center of card area

        cards.forEach((card, i) => {
            const cx = startX + i * (this.#CARD_WIDTH + this.#CARD_GAP) + this.#CARD_WIDTH / 2;
            this.#createCard(cx, cardY, card);
        });

        // ── Continue button ───────────────────────────────────────────────────
        const btnY   = cardY + this.#CARD_HEIGHT / 2 + 40;
        const CBW    = 160;
        const CBH    = 44;
        const contBg = this.#roundedRect(
            W / 2 - CBW / 2, btnY - CBH / 2, CBW, CBH, 10,
            0x1d3557, 1, 0x2a4a6a, 1, 101
        );
        this.add.text(W / 2, btnY, 'Continue  →', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(102);

        contBg.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, CBW, CBH),
            Phaser.Geom.Rectangle.Contains
        )
            .on('pointerover', () => { contBg.clear(); this.#drawRoundedRect(contBg, 0, 0, CBW, CBH, 10, 0x2a4a7a, 1, 0x2a4a6a, 1); })
            .on('pointerout',  () => { contBg.clear(); this.#drawRoundedRect(contBg, 0, 0, CBW, CBH, 10, 0x1d3557, 1, 0x2a4a6a, 1); })
            .on('pointerdown', () => this.scene.sleep());
    }

    // ── Card builder ──────────────────────────────────────────────────────────
    #createCard(cx, cy, card) {
        const DEPTH  = 101;
        const CW     = this.#CARD_WIDTH;
        const CH     = this.#CARD_HEIGHT;
        const IS     = this.#IMG_SIZE;
        const left   = cx - CW / 2;
        const top    = cy - CH / 2;
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
            .on('pointerover', () => { bg.clear(); this.#drawRoundedRect(bg, 0, 0, CW, CH, RADIUS, 0x1a2f4a, 1, card.popular ? 0x3b8bba : 0x2a4a6a, card.popular ? 2 : 1); })
            .on('pointerout',  () => { bg.clear(); this.#drawRoundedRect(bg, 0, 0, CW, CH, RADIUS, 0x12233a, 1, card.popular ? 0x3b8bba : 0x2a4a6a, card.popular ? 2 : 1); });

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
        const BW = CW - 24;
        const BH = 28;
        const btnLeft = cx - BW / 2;
        const btnTop  = top + CH - 22 - BH / 2;

        const btnGfx = this.#roundedRect(
            btnLeft, btnTop, BW, BH, 6,
            0x1d3557, 1, 0x2a4a6a, 1,
            DEPTH + 1
        );

        btnGfx.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, BW, BH),
            Phaser.Geom.Rectangle.Contains
        )
            .on('pointerover', () => { btnGfx.clear(); this.#drawRoundedRect(btnGfx, 0, 0, BW, BH, 6, 0x2a4a7a, 1, 0x2a4a6a, 1); })
            .on('pointerout',  () => { btnGfx.clear(); this.#drawRoundedRect(btnGfx, 0, 0, BW, BH, 6, 0x1d3557, 1, 0x2a4a6a, 1); });

        this.add.text(cx, top + CH - 22, `${card.cost} coins`, {
            fontSize: '13px',
            color: '#a8dadc',
        }).setOrigin(0.5).setDepth(DEPTH + 2);
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