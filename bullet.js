class Bullet extends Phaser.GameObjects.GameObject {

    constructor(scene, origin, target, cfg = {}) {
        super(scene, 'bullet');

        this.x = origin.pixelX;
        this.y = origin.pixelY;

        this._target = target;

        this._speed = 400;
        this._color = 0xf1faee;
        this._radius = 4;
        this._damage = 10;
        this._trail = true;
        this._destroyDistance = 2;

        // Trail history (ring buffer of last N positions)
        this._trail_positions = [{ x: this.x, y: this.y }];

        // Graphics — one shared object per bullet
        this._gfx = scene.add.graphics().setDepth(8);

        scene.sys.updateList.add(this);
        this._draw();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    preUpdate(_time, delta) {
        if (!this.active) return;

        const targetX = this._target.pixelX;
        const targetY = this._target.pixelY;

        // Arrived (or overshot)?
        if (Math.abs(this.x - targetX) < this._target.hitBoxRadius && Math.abs(this.y - targetY) < this._target.hitBoxRadius) {
            this._arrive();
            return;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : 0;  // make sure to not div0
        const dirY = dist > 0 ? dy / dist : 0;  // make sure to not div0

        const step = this._speed * (delta / 1000);

        // Advance along direction vector
        this.x += dirX * step;
        this.y += dirY * step;

        if (this._trail) {
            this._trail_positions.push({ x: this.x, y: this.y });
            if (this._trail_positions.length > 6) this._trail_positions.shift();
        }

        this._draw();
    }

    destroy(fromScene) {
        this._gfx.destroy();
        super.destroy(fromScene);
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    _draw() {
        const g = this._gfx;
        g.clear();

        // Trail — fading dots behind the bullet
        if (this._trail && this._trail_positions.length > 1) {
            const len = this._trail_positions.length;
            for (let i = 0; i < len - 1; i++) {
                const alpha = (i / len) * 0.5;
                const scale = (i / len) * 0.8;
                g.fillStyle(this._color, alpha);
                g.fillCircle(
                    this._trail_positions[i].x,
                    this._trail_positions[i].y,
                    this._radius * scale,
                );
            }
        }

        // Main bullet circle
        g.fillStyle(this._color, 1);
        g.fillCircle(this.x, this.y, this._radius);

        // Small bright core
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(this.x, this.y, this._radius * 0.4);
    }

    // ── Arrival ───────────────────────────────────────────────────────────────

    _arrive() {
        //console.log('bullet arrived, health:', this._target.health)
        this._target.health -= this._damage;
        //console.log('bullet arrived, health:', this._target.health)
        this.setActive(false);
        this.destroy();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Factory Registration
//
//  Call registerBulletFactory() once before new Phaser.Game(config).
//
//  Usage:
//    const bullet = scene.add.bullet(origin, target);
//    const bullet = scene.add.bullet(origin, target, {
//        speed: 600, color: 0xff4444,
//        onHit: (t) => damageStructure(t.col, t.row, 25),
//    });
//
//  `origin` and `target` can be any object with .x / .y  (GameObjects,
//  plain coordinate objects, etc.)
// ─────────────────────────────────────────────────────────────────────────────
function registerBulletFactory() {
    Phaser.GameObjects.GameObjectFactory.register(
        'bullet',
        function (origin, target, cfg) {
            const bullet = new Bullet(this.scene, origin, target, cfg);
            //this.scene.sys.updateList.add(bullet);
            return bullet;
        },
    );
}

registerBulletFactory();

// ─────────────────────────────────────────────────────────────────────────────
//  BulletPool — optional object pool to avoid GC churn at high fire rates
//
//  Usage:
//    create() { this.bullets = new BulletPool(this, 64); }
//    // fire:
//    this.bullets.fire(turret, enemy, { onHit: (e) => e.takeDamage(10) });
// ─────────────────────────────────────────────────────────────────────────────
class BulletPool {

    /**
     * @param {Phaser.Scene} scene
     * @param {number} [maxSize=64]  — pool capacity
     */
    constructor(scene, maxSize = 64) {
        this.scene = scene;
        this.maxSize = maxSize;
        this._pool = [];   // inactive Bullet instances waiting for reuse
        this._active = [];   // currently live bullets
    }

    /**
     * Fire a bullet from `origin` toward `target`.
     * Reuses a pooled instance if available, otherwise creates a new one.
     */
    fire(origin, target, cfg = {}) {
        // Prune finished bullets back into the pool
        for (let i = this._active.length - 1; i >= 0; i--) {
            if (!this._active[i].active) {
                this._pool.push(this._active.splice(i, 1)[0]);
            }
        }

        // For now pooling re-creates (Bullet destroys its gfx on arrival).
        // To truly reuse, refactor Bullet to have a reset() method instead.
        // Left as an exercise — the pool still provides the management layer.
        const bullet = this.scene.add.bullet(origin, target, cfg);
        this._active.push(bullet);
        return bullet;
    }

    get liveCount() { return this._active.filter(b => b.active).length; }
}