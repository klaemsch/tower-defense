class Card extends Phaser.GameObjects.Container {
    #buttonCallback;

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       cx      - Center x
     * @param {number}       cy      - Center y
     * @param {object}       data
     * @param {string}       data.title
     * @param {string}       data.description
     * @param {number}       data.color       - Hex color for the icon placeholder
     * @param {number}       data.cost
     * @param {function}     data.buttonCallback
     * @param {boolean}      [data.popular]
     */
    constructor(scene, cx, cy, data) {
        super(scene, cx, cy);

        this.#buttonCallback = data.buttonCallback ?? function () { console.log('default card button callback') };

        const CW = globalConfig.shop.layout.cardWidth;
        const CH = globalConfig.shop.layout.cardHeight;
        const IS = globalConfig.shop.layout.imgSize;
        const RADIUS = 12;

        // Local top-left (container origin is center)
        const left = -CW / 2;
        const top = -CH / 2;

        // ── Card background ───────────────────────────────────────────────────
        const bgGfx = scene.add.graphics();
        this._drawRoundedRect(
            bgGfx, left, top, CW, CH, RADIUS,
            0x12233a, 1,
            data.popular ? 0x3b8bba : 0x2a4a6a,
            data.popular ? 2 : 1
        );
        this.add(bgGfx);

        // ── Popular badge ─────────────────────────────────────────────────────
        if (data.popular) {
            const PBW = 64, PBH = 20;
            const badgeGfx = scene.add.graphics();
            this._drawRoundedRect(badgeGfx, -PBW / 2, top - PBH / 2, PBW, PBH, 6, 0x3b8bba, 1, null, 0);
            this.add(badgeGfx);

            this.add(
                scene.add.text(0, top, 'Popular', {
                    fontSize: globalStyles.text.sizes.small,
                    color: globalStyles.colors.popularBadge,
                }).setOrigin(0.5, 0.5)
            );
        }

        // ── Card title ────────────────────────────────────────────────────────
        this.add(
            scene.add.text(0, top + 28, data.title, {
                fontSize: globalStyles.text.sizes.medium,
                color: globalStyles.text.colors.highlight,
                fontStyle: 'bold',
            }).setOrigin(0.5)
        );

        // ── Image placeholder ─────────────────────────────────────────────────
        const imgY = -16; // relative to container center

        const imgBgGfx = scene.add.graphics();
        this._drawRoundedRect(imgBgGfx, -IS / 2, imgY - IS / 2, IS, IS, 8, 0x1d3a5f, 1, null, 0);
        this.add(imgBgGfx);

        const iconSize = IS * 0.55;

        const imageKey = data.itemConfig.imageKey ? data.itemConfig.imageKey : 'temp';
        const image = scene.add.image(-IS / 2, imgY - IS / 2, imageKey);
        image.setOrigin(-0.25)
        //const iconGfx = scene.add.graphics();
        //this._drawRoundedRect(iconGfx, -iconSize / 2, imgY - iconSize / 2, iconSize, iconSize, 6, data.color, 0.85, null, 0);
        this.add(image);

        // ── Description ───────────────────────────────────────────────────────
        this.add(
            scene.add.text(0, top + CH - 62, data.description, {
                fontSize: '12px',  // TODO: replace via styles.js
                color: globalStyles.colors.cardDescription,
                align: 'center',
                lineSpacing: 4,
                wordWrap: { width: CW }
            }).setOrigin(0.5)
        );

        // ── Buy button ────────────────────────────────────────────────────────
        const btnText = `${data.cost} ${globalConfig.resources.token.label}`;
        this.add(
            new RoundedButton(scene, 0, top + CH - 22, btnText, {
                width: CW - 24,
                height: 28, 
                fontSize: '13px', // TODO: replace via styles.js
                textColor: globalStyles.text.colors.base,
            }).on('pointerdown', () => {
                this.#buttonCallback();
            })
        );

        this.setSize(CW, CH);
        scene.add.existing(this);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    _drawRoundedRect(gfx, x, y, w, h, r, fillColor, fillAlpha, strokeColor, strokeWidth) {
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