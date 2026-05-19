class RoundedButton extends Phaser.GameObjects.Container {
    #width;
    #height;
    #radius;
    #fillColor;
    #fillHover;
    #strokeColor;
    #strokeWidth;
    #textColor;
    #fontSize;
    #fontStyle;

    #label;
    #bg;

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       x       - Center x
     * @param {number}       y       - Center y
     * @param {number}       width
     * @param {number}       height
     * @param {string}       text
     * @param {object}       [options]
     * @param {number}       [options.radius=8]            - Corner radius
     * @param {number}       [options.fillColor=0x1d3557]
     * @param {number}       [options.fillHover=0x2a4a7a]
     * @param {number}       [options.strokeColor=0x2a4a6a]
     * @param {number}       [options.strokeWidth=1]
     * @param {string}       [options.textColor='#fffff']
     * @param {string}       [options.fontSize='14px']
     * @param {string}       [options.fontStyle='bold']
     */
    constructor(scene, x, y, width, height, text, options = {}) {
        super(scene, x, y);

        this.#width = width;
        this.#height = height;
        this.#radius = options.radius ?? 8;
        this.#fillColor = options.fillColor ?? 0x1d3557;
        this.#fillHover = options.fillHover ?? 0x2a4a7a;
        this.#strokeColor = options.strokeColor ?? 0x2a4a6a;
        this.#strokeWidth = options.strokeWidth ?? 1;
        this.#textColor = options.textColor ?? '#ffffff';  // for some reason we need to use #, cant use hex (0x)
        this.#fontSize = options.fontSize ?? '14px';
        this.#fontStyle = options.fontStyle ?? 'bold';

        // Background
        this.#bg = scene.add.graphics();
        this.#drawBg(this.#fillColor);
        this.add(this.#bg);

        // Label
        this.#label = scene.add.text(0, 0, text, {
            fontSize: this.#fontSize,
            fontStyle: this.#fontStyle,
            color: this.#textColor,
        }).setOrigin(0.5);
        this.add(this.#label);

        // Hit area centered on the container origin
        this.setSize(width, height);
        this.setInteractive({ useHandCursor: true });

        this.on('pointerover', () => this.#drawBg(this.#fillHover));
        this.on('pointerout', () => this.#drawBg(this.#fillColor));
        this.on('pointerup', () => this.#drawBg(this.#fillColor));
        this.on('pointerdown', () => this.#drawBg(this.#fillColor));

        scene.add.existing(this);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    #drawBg(fillColor) {
        const g = this.#bg;
        const w = this.#width;
        const h = this.#height;
        const r = this.#radius;

        g.clear();
        g.fillStyle(fillColor, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, r);

        if (this.#strokeWidth > 0) {
            g.lineStyle(this.#strokeWidth, this.#strokeColor, 1);
            g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Change the button label at runtime */
    setText(text) {
        this.#label.setText(text);
        return this;
    }

    /** Swap fill/hover/stroke colors at runtime */
    setColors({ fillColor, fillHover, strokeColor } = {}) {
        if (fillColor !== undefined) this.#fillColor = fillColor;
        if (fillHover !== undefined) this.#fillHover = fillHover;
        if (strokeColor !== undefined) this.#strokeColor = strokeColor;
        this.#drawBg(this.#fillColor);
        return this;
    }

    /** Disable the button visually and functionally */
    disable() {
        this.disableInteractive();
        this.#bg.setAlpha(0.4);
        this.#label.setAlpha(0.4);
        return this;
    }

    /** Re-enable after disable() */
    enable() {
        this.setInteractive({ useHandCursor: true });
        this.#bg.setAlpha(1);
        this.#label.setAlpha(1);
        return this;
    }
}