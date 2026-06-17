const helper = {};

// spawns rising text animation at x, y
helper.spawnRisingFx = (scene, x, y, fxText, duration) => {

    const labelElement = scene.add.text(x, y, fxText, {
        fontSize: globalStyles.text.sizes.medium,
        fontStyle: 'bold',
        color: globalStyles.text.colors.base,
    })
        .setOrigin(0.5, 1)
        .setDepth(globalStyles.depthMap.risingFx)
        .setAlpha(1);

    scene.tweens.add({
        targets: labelElement,
        y: y - 40,
        alpha: 0,
        duration: duration,
        ease: 'Cubic.Out',
        onComplete: () => labelElement.destroy(),
    });
}

// spawns rising text animation at given grid position
helper.spawnRisingFxAtGrid = (scene, gridX, gridY, fxText, duration) => {
    const tileSize = globalConfig.world.tileSize;
    const x = gridX * tileSize + tileSize / 2;
    const y = gridY * tileSize;
    return helper.spawnRisingFx(scene, x, y, fxText, duration);
}

// calculates distance in pixels between to objects
// both have to have their coordinates in pixelX, pixelY
helper.squaredDistanceInPixels = (fromObject, toObject) => {
    const dx = fromObject.pixelX - toObject.pixelX;
    const dy = fromObject.pixelY - toObject.pixelY;
    return dx * dx + dy * dy;
}