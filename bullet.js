class Bullet extends Phaser.GameObjects.GameObject {
    #target;
    #speed;
    #color;
    #radius;
    #damage;
    #trailPositions;
    #gfx;

    constructor(scene, origin, target, speed, damage) {
        super(scene, 'bullet');

        this.x = origin.pixelX;
        this.y = origin.pixelY;

        this.#target = target;

        this.#speed = speed;
        this.#damage = damage;

        this.#color = globalConfig.bullet.color;
        this.#radius = globalConfig.bullet.size;

        // Trail history (ring buffer of last N positions)
        this.#trailPositions = [{ x: this.x, y: this.y }];

        // Graphics — one shared object per bullet
        this.#gfx = scene.add.graphics().setDepth(globalConfig.depthMap.bullet);

        scene.sys.updateList.add(this);
        this.#draw();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    preUpdate(time, delta) {
        //if (!this.active) return;

        const targetX = this.#target.pixelX;
        const targetY = this.#target.pixelY;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const dirX = dist > 0 ? dx / dist : 0;  // make sure to not div0
        const dirY = dist > 0 ? dy / dist : 0;  // make sure to not div0

        const step = this.#speed * (delta / 1000);

        // if remaining distance is less than one step, or the target is now behind the bullet (dist is negative), snap to arrival and call arrive
        if (dist <= step) {
            this.x = targetX;
            this.y = targetY;
            this.#arrive();
            return;
        }

        // advance along direction vector
        this.x += dirX * step;
        this.y += dirY * step;

        this.#trailPositions.push({ x: this.x, y: this.y });
        if (this.#trailPositions.length > 6) this.#trailPositions.shift();

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

        // Trail — fading dots behind the bullet
        if (this.#trailPositions.length > 1) {
            const len = this.#trailPositions.length;
            for (let i = 0; i < len - 1; i++) {
                const alpha = (i / len) * 0.5;
                const scale = (i / len) * 0.8;
                gfx.fillStyle(this.#color, alpha);
                gfx.fillCircle(
                    this.#trailPositions[i].x,
                    this.#trailPositions[i].y,
                    this.#radius * scale,
                );
            }
        }

        // Main bullet circle
        gfx.fillStyle(this.#color, 1);
        gfx.fillCircle(this.x, this.y, this.#radius);

        // Small bright core inside the bullet circle
        gfx.fillStyle(0xffffff, 0.9);
        gfx.fillCircle(this.x, this.y, this.#radius * 0.4);
    }

    // ── Arrival ───────────────────────────────────────────────────────────────

    #arrive() {
        //console.log('bullet arrived, health:', this.#target.health)
        const destroyed = this.#target.doDamage(this.#damage);
        //console.log('bullet arrived, health:', this.#target.health, destroyed)
        this.setActive(false);
        this.destroy();
    }
}

function registerBulletFactory() {
    Phaser.GameObjects.GameObjectFactory.register(
        'bullet',
        function (origin, target, speed, damage) {
            const bullet = new Bullet(this.scene, origin, target, speed, damage);
            return bullet;
        },
    );
}

registerBulletFactory();
