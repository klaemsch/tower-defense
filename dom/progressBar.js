class ProgressBar extends Phaser.GameObjects.Container {

    /**
     * @param {Phaser.Scene} scene
     * @param {object}       [options]
     * @param {number}       [options.progress=0]             - Initial progress 0..1
     * @param {string}       [options.leftIcon='▶']           - Icon in left circle
     * @param {string}       [options.rightIcon='⚑']          - Icon in right circle
     * @param {number}       [options.height=4]               - Bar track height in px
     * @param {number}       [options.circleRadius=18]        - Radius of end circles
     * @param {number}       [options.paddingY=16]            - Distance from bottom edge
     * @param {number}       [options.colorStart=0x1d9e75]   - Fill color at 0%
     * @param {number}       [options.colorEnd=0xe24b4a]     - Fill color at 100%
     */
    constructor(scene, options = {}) {
        const {
            progress     = 0,
            leftIcon     = '▶',
            rightIcon    = '⚑',
            height       = 4,
            circleRadius = 18,
            paddingY     = 16,
            colorStart   = 0x1d9e75,
            colorEnd     = 0xe24b4a,
        } = options;

        const W  = scene.scale.width;
        const cy = scene.scale.height - paddingY - circleRadius;

        // Container origin at (0, 0) — all children use absolute world coords
        super(scene, 0, 0);

        this._height      = height;
        this._circleRadius = circleRadius;
        this._colorStart  = colorStart;
        this._colorEnd    = colorEnd;

        // Bar runs between the inner edges of the two circles
        this._barX     = circleRadius * 2 + 8;
        this._barEndX  = W - circleRadius * 2 - 8;
        this._barWidth = this._barEndX - this._barX;
        this._barCy    = cy;

        // ── Track ─────────────────────────────────────────────────────────────
        const track = scene.add.graphics();
        track.fillStyle(0x1a2a3a, 1);
        track.fillRoundedRect(this._barX, cy - height / 2, this._barWidth, height, height / 2);
        this.add(track);

        // ── Fill ──────────────────────────────────────────────────────────────
        this._fill = scene.add.graphics();
        this.add(this._fill);

        // ── Left circle ───────────────────────────────────────────────────────
        const leftCircle = scene.add.graphics();
        this._drawCircle(leftCircle, circleRadius, cy);
        this.add(leftCircle);

        this.add(scene.add.text(circleRadius, cy, leftIcon, {
            fontSize: globalStyles.text.sizes.medium,
            color: globalStyles.text.colors.base,
        }).setOrigin(0.5));

        // ── Right circle ──────────────────────────────────────────────────────
        const rightCircle = scene.add.graphics();
        this._drawCircle(rightCircle, W - circleRadius, cy);
        this.add(rightCircle);

        this.add(scene.add.text(W - circleRadius, cy, rightIcon, {
            fontSize: globalStyles.text.sizes.medium,
            color: globalStyles.text.colors.base,
        }).setOrigin(0.5));

        this._drawFill(progress);

        scene.add.existing(this);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Update the bar; value is clamped to 0..1 */
    setProgress(value) {
        this._drawFill(value);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    _drawCircle(gfx, cx, cy) {
        gfx.fillStyle(0x12233a, 1);
        gfx.lineStyle(1.5, 0x2a4a6a, 1);
        gfx.fillCircle(cx, cy, this._circleRadius);
        gfx.strokeCircle(cx, cy, this._circleRadius);
    }

    _drawFill(value) {
        const clamped   = Phaser.Math.Clamp(value, 0, 1);
        const fillW     = this._barWidth * clamped;
        const fillColor = this._lerpColor(this._colorStart, this._colorEnd, clamped);

        this._fill.clear();
        if (fillW <= 0) return;
        this._fill.fillStyle(fillColor, 1);
        this._fill.fillRoundedRect(
            this._barX,
            this._barCy - this._height / 2,
            fillW,
            this._height,
            this._height / 2
        );
    }

    _lerpColor(hexA, hexB, t) {
        const rA = (hexA >> 16) & 0xff, gA = (hexA >> 8) & 0xff, bA = hexA & 0xff;
        const rB = (hexB >> 16) & 0xff, gB = (hexB >> 8) & 0xff, bB = hexB & 0xff;
        const r  = Math.round(rA + (rB - rA) * t);
        const g  = Math.round(gA + (gB - gA) * t);
        const b  = Math.round(bA + (bB - bA) * t);
        return (r << 16) | (g << 8) | b;
    }
}