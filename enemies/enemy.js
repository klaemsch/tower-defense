class Enemy extends Phaser.GameObjects.GameObject {
    #config;

    #path;
    #pathIdx;
    #target;

    #attacking;
    #attackTimer;
    #isStunned;
    #stunTimer = null;

    #image;
    #gfx;
    #pathGfx;

    constructor(scene, col, row, path, target, eConfig = enemyConfig.baseEnemy) {
        super(scene, 'enemy');

        this.#config = eConfig;

        this.gridX = col;
        this.gridY = row;

        const pos = helper.gridToWorld(col, row);
        this.pixelX = pos.x;
        this.pixelY = pos.y;

        // init path and target finding
        this.#path = path;
        this.#pathIdx = 0;
        this.#target = target;

        this.#attacking = false;
        this.#attackTimer = 0;
        this.#isStunned = false; // target can move and attack

        this.#image = scene.add.image(0, 0, eConfig.imageKey);
        // scale image according to tileSize (image.height should be 48px)
        this.#image.scale = globalConfig.world.tileSize / this.#image.height;

        this.#gfx = scene.add.graphics();
        this.#pathGfx = scene.add.graphics().setDepth(globalStyles.depthMap.enemyPath);

        scene.sys.updateList.add(this);

        if (globalConfig.debug) this.#drawPath();
        this.#draw();

        // trigger destroy event for other scenes to check status
        this.once('destroy', () => {
            //console.log('enemy destroy event');

            // get drop
            const drop = globalConfig.resources.getRandomDrop();
            if (drop) {
                console.log('an enemy died and randomly dropped', drop.amount, drop.resource.label);

                // do FX
                this.#spawnDropFx(drop.resource.label, drop.amount);
            }

            // emit death event and hand over drop
            this.scene.game.events.emit(globalConfig.eventKeys.enemyDestroyed, drop);
        });
    }

    // ── Phaser lifecycle ──────────────────────────────────────────────────────

    preUpdate(_time, delta) {
        delta = delta * this.scene.time.timeScale;  // TODO check if this works
        if (this.#isStunned) return;
        const step = this.#config.speed * (delta / 1000);

        if (this.#attacking) {
            this.#tickAttack(delta);
        } else {
            this.#tickMove(step);
        }

        const tileSize = globalConfig.world.tileSize;
        this.pixelX = this.gridX * tileSize + tileSize / 2;
        this.pixelY = this.gridY * tileSize + tileSize / 2;

        this.#draw();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // Apply damage to this enemy. Destroys self if health reaches zero. Returns true if killed
    doDamage(amount) {
        // TODO: maybe let the enemy flicker or turn white for a second or so to indicate damage
        this.#config.health -= amount;
        if (this.#config.health <= 0) {
            this.destroy();
            return true;
        }
        console.log('did', amount, 'damage, new health', this.#config.health);
        return false;
    }

    // stun this enemy, it cant move or attack for 'timeInMs'
    stun(timeInMs, bulletDamage) {
        // check if bullet damage would kill this enemy, if so no stun
        if (this.#config.health - bulletDamage <= 0) {
            return;
        }

        //console.log('enemy stunned for', timeInMs, 'ms');
        this.#isStunned = true;
        this.#spawnStunFx();

        // cancel existing stun timer if already stunned
        if (this.#stunTimer) {
            this.#stunTimer.remove();
            this.#stunTimer = null;
        }

        // after timeInMS unstunn and set stunTimer to null
        this.#stunTimer = this.scene.time.addEvent({
            delay: timeInMs,
            callback: () => {
                this.#isStunned = false;
                this.#stunTimer = null;
                //console.log('enemy unstunned after', timeInMs, 'ms');
            }
        });
    }

    destroy(fromScene) {
        //console.log(this.scene)
        this.#image.destroy();
        this.#pathGfx.destroy();
        this.#gfx.destroy();
        super.destroy(fromScene);
    }

    // ── Movement ──────────────────────────────────────────────────────────────

    #tickMove(step) {
        if (!this.#targetIsAlive()) {
            this.#retarget();
            return;
        }

        // Path exhausted or target in range → reached attack position
        if (this.#pathIdx >= this.#path.length || this.#targetInRange()) {
            //console.log(`target in range? ${this.#targetInRange()}`)
            this.#attacking = true;
            this.#attackTimer = 0;
            return;
        }

        // get next waypoint in path
        const waypoint = this.#path[this.#pathIdx];
        const dx = waypoint.col - this.gridX;
        const dy = waypoint.row - this.gridY;
        // distance to next waypoint
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= step) {
            // step would overshoot next waypoint
            // -> snap to next waypoint, advance, then re-evaluate
            this.gridX = waypoint.col;
            this.gridY = waypoint.row;
            this.#pathIdx++;
            // check wether the current path is still the best path
            this.#recalcPath();
            // TODO: this is a bit weird, Claude increases the pathIdx and then recalculates the path which resets the pathIdx
        } else {
            // step is ok -> do it
            this.gridX += (dx / dist) * step;
            this.gridY += (dy / dist) * step;
        }
    }

    // ── Attack ────────────────────────────────────────────────────────────────

    #tickAttack(delta) {
        if (!this.#targetIsAlive() || !this.#targetInRange()) {
            console.log('target change (target dead or out of range)');
            this.#attacking = false;
            this.#retarget();
            return;
        }

        this.#attackTimer += delta;
        if (this.#attackTimer >= this.#config.attackRate) {
            this.#attackTimer -= this.#config.attackRate;
            // apply damage to target, if destroyed -> retarget
            /*const destroyed = this.#target.doDamage(this.#config.damage);
            if (destroyed) {
                this.#attacking = false;
                this.#retarget();
            }*/
            this.scene.add.bullet(this, this.#target, 400, this.#config.damage);
        }
    }

    // ── Pathfinding ───────────────────────────────────────────────────────────

    /**
     * Re-evaluate best target and repath from current position.
     * Called on every waypoint snap so enemies react to newly placed buildings.
     */
    #recalcPath() {
        const best = structureStorage.getNearestTarget(Math.round(this.gridX), Math.round(this.gridY));
        if (best && best !== this.#target) this.#target = best;

        const newPath = helper.findPath(
            Math.round(this.gridX), Math.round(this.gridY),
            this.#target.col, this.#target.row,
        );
        if (newPath) {
            this.#path = newPath;
            this.#pathIdx = 0;
            if (globalConfig.debug) this.#drawPath();
        }
    }

    /** Pick a new target and path from scratch. Destroys self if none found. */
    #retarget() {
        const best = structureStorage.getNearestTarget(Math.round(this.gridX), Math.round(this.gridY));
        if (!best) { this.destroy(); return; }

        const newPath = helper.findPath(
            Math.round(this.gridX), Math.round(this.gridY),
            best.col, best.row,
        );
        if (!newPath) { this.destroy(); return; }

        this.#target = best;
        this.#path = newPath;
        this.#pathIdx = 0;
        this.#attacking = false;
        this.#attackTimer = 0;
        if (globalConfig.debug) this.#drawPath();
    }

    // ── Target selection ──────────────────────────────────────────────────────

    // returns true if this.#target is alive
    #targetIsAlive() {
        return this.#target && structureStorage.isOccupied(this.#target.col, this.#target.row);
    }

    // returns true if this.#target is in range
    #targetInRange() {
        if (this.#config.radiusType === RadiusType.Rectangular) {
            const dx = Math.abs(this.gridX - this.#target.col);
            const dy = Math.abs(this.gridY - this.#target.row);
            return dx <= this.#config.radiusInTiles && dy <= this.#config.radiusInTiles;
        } else if (this.#config.radiusType === RadiusType.Circular) {
            const radiusInPixels = this.#config.radiusInTiles * globalConfig.world.tileSize;
            return helper.distanceInPixels(this, this.#target) <= radiusInPixels;
        }
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    #draw() {
        //this.#gfx.clear();
        //this.#config.draw(this.#gfx, this.pixelX, this.pixelY, this.#config, this.#attacking);
        this.#image.x = this.pixelX;
        this.#image.y = this.pixelY;

        // get next waypoint
        const waypoint = this.#path[this.#pathIdx];
        if (!waypoint) return;

        const { x, y } = helper.gridToWorld(waypoint.col, waypoint.row);

        const angle = Phaser.Math.Angle.Between(this.pixelX, this.pixelY, x, y);
        this.#image.setRotation(angle - Math.PI / 2); // +90° since sprite faces "down"
    }

    #drawPath() {
        this.#pathGfx.clear();
        if (!this.#path || this.#path.length < 2) return;

        this.#pathGfx.lineStyle(1, this.#config.color, 0.3);
        this.#pathGfx.beginPath();

        const start = helper.gridToWorld(Math.round(this.gridX), Math.round(this.gridY));
        this.#pathGfx.moveTo(start.x, start.y);

        this.#path.slice(this.#pathIdx).forEach(({ col, row }) => {
            const { x, y } = helper.gridToWorld(col, row);
            this.#pathGfx.lineTo(x, y);
        });

        this.#pathGfx.strokePath();
    }

    // TODO: this is used in structure.js as well for produce fx, maybe put into common helper function?
    #spawnDropFx(label, amount) {
        const labelText = `${label} +${amount}`;
        helper.spawnRisingFxAtGrid(this.scene, this.gridX, this.gridY, labelText, this.#config.dropFxDuration);
    }

    #spawnStunFx() {
        const labelText = globalConfig.items.freeze.fxLabel;
        helper.spawnRisingFxAtGrid(this.scene, this.gridX, this.gridY, labelText, this.#config.dropFxDuration);
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'enemy',
    function (col, row, path, target, eConfig) {
        // clone incoming enemy config
        const clonedConfig = { ...eConfig };
        const enemy = new Enemy(this.scene, col, row, path, target, clonedConfig);
        return enemy;
    },
);