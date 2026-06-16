// ─────────────────────────────────────────────────────────────────────────────
//  Bullet (Star Wars-style blaster bolt)
// ─────────────────────────────────────────────────────────────────────────────
class Bullet extends Phaser.GameObjects.GameObject {
    #target;
    #config;
    #color;
    #speed;
    #damage;

    #coreColor;
    #width;
    #boltLength;
    #gfx;
    #angle;

    constructor(scene, origin, target, bulletConfig, onArrive = (target, damage) => { }) {
        super(scene, 'bullet');

        this.x = origin.pixelX;
        this.y = origin.pixelY;

        this.#target = target;
        this.#config = bulletConfig;

        this.#speed = bulletConfig.speed;
        this.#damage = bulletConfig.damage;

        // Bolt body color (e.g. green/red laser tint)
        this.#color = bulletConfig.color;
        // Bright "hot core" color, usually white or near-white
        this.#coreColor = bulletConfig.coreColor || 0xffffff;
        this.#width = bulletConfig.width || 4;
        this.#boltLength = bulletConfig.boltLength || 14;

        // Start angle pointing toward target so first frame draws correctly
        this.#angle = Math.atan2(target.pixelY - this.y, target.pixelX - this.x);

        // Graphics — one shared object per bullet
        this.#gfx = scene.add.graphics().setDepth(globalStyles.depthMap.bullet);

        scene.sys.updateList.add(this);
        this.#draw();

        this.onArrive = onArrive;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    preUpdate(time, delta) {
        delta = delta * this.scene.time.timeScale;

        const targetX = this.#target.pixelX;
        const targetY = this.#target.pixelY;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 0;

        this.#angle = Math.atan2(dy, dx);

        const step = this.#speed * (delta / 1000);

        // If remaining distance is less than one step, snap to arrival
        if (dist <= step) {
            this.x = targetX;
            this.y = targetY;
            this.#arrive();
            return;
        }

        // Advance along direction vector
        this.x += dirX * step;
        this.y += dirY * step;

        this.#draw();
    }

    destroy(fromScene) {
        this.#gfx.destroy();
        super.destroy(fromScene);
    }

    // ── Drawing ───────────────────────────────────────────────────────────────
    #draw() {
        const gfx = this.#gfx;
        gfx.clear();

        // Bolt is a short capsule shape oriented along the travel direction.
        // We draw it as a line from "tail" to "head" (current position is the head).
        const halfLen = this.#boltLength / 2;
        const dx = Math.cos(this.#angle) * halfLen;
        const dy = Math.sin(this.#angle) * halfLen;

        const tailX = this.x - dx;
        const tailY = this.y - dy;
        const headX = this.x + dx;
        const headY = this.y + dy;

        // 1. Outer glow — soft, wide, low alpha
        gfx.lineStyle(this.#width * 2.5, this.#color, 0.25);
        gfx.beginPath();
        gfx.moveTo(tailX, tailY);
        gfx.lineTo(headX, headY);
        gfx.strokePath();

        // 2. Main bolt body — solid color, full width
        gfx.lineStyle(this.#width, this.#color, 1);
        gfx.beginPath();
        gfx.moveTo(tailX, tailY);
        gfx.lineTo(headX, headY);
        gfx.strokePath();

        // 3. Bright core line — thin, hot-colored center
        gfx.lineStyle(this.#width * 0.4, this.#coreColor, 1);
        gfx.beginPath();
        gfx.moveTo(tailX, tailY);
        gfx.lineTo(headX, headY);
        gfx.strokePath();

        // 4. Glowing tip at the front of the bolt
        gfx.fillStyle(this.#color, 0.6);
        gfx.fillCircle(headX, headY, this.#width * 1.3);
        gfx.fillStyle(this.#coreColor, 0.9);
        gfx.fillCircle(headX, headY, this.#width * 0.6);
    }

    // ── Arrival ───────────────────────────────────────────────────────────────
    #arrive() {
        this.onArrive(this.#target, this.#damage);
        const destroyed = this.#target.doDamage(this.#damage);
        this.setActive(false);
        this.destroy();
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'bullet',
    function (origin, target, speed, damage, onArrive) {
        const bullet = new Bullet(this.scene, origin, target, speed, damage, onArrive);
        return bullet;
    },
);