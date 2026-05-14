class Tower extends Structure {

    constructor(scene, col, row) {
        super(scene, col, row, 'tower', 0xFF0000, 'T');

        // Register with the scene so preUpdate() fires every frame
        scene.sys.updateList.add(this);
    }

    preUpdate(_time, delta) {
        
    }
}

Phaser.GameObjects.GameObjectFactory.register(
    'tower',
    function (col, row) {
        const tower = new Tower(this.scene, col, row);
        return tower;
    }
);
