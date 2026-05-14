class Tower extends Structure {
    #findNearestEnemy

    constructor(scene, col, row) {
        super(scene, col, row, 'tower', 0xFF0000, 'T');

        this.fireRateMs = 1000;
        this.lastFired = 0;

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);
    }

    preUpdate(time, delta) {
        if (time > this.lastFired + this.fireRateMs) {
            this.lastFired = time;
            const target = this.findNearestEnemy();
            if (target) this.scene.add.bullet(this, target);
        }
    }

    findNearestEnemy() {
        var closestEnemy = null;
        var closestDistance = Infinity;
        this.scene.enemyManager.enemies.forEach((entry) => {
            if (entry.type !== 'enemy') return;
            const dx = entry.pixelX - this.pixelX;
            const dy = entry.pixelY - this.pixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDistance) {
                closestDistance = dist;
                closestEnemy = entry;
            }
        });
        return closestEnemy;
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'tower',
    function (col, row) {
        const tower = new Tower(this.scene, col, row);
        return tower;
    }
);
