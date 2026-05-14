function initHUD(scene) {

    scene.registry.set('wood', 0);
    scene.registry.set('hq-health', 200);

    // HUD wood counter
    _woodText = scene.add.text(8, 8, 'Wood: 0', {
        fontSize: '13px',
        color: '#a8dadc',
        fontStyle: 'bold',
        backgroundColor: '#00000066',
        padding: { x: 6, y: 3 },
    }).setDepth(10);

    // HUD HQ Health counter
    _hqHealthText = scene.add.text(8, 30, 'HQ Health: 200', {
        fontSize: '13px',
        color: '#a8dadc',
        fontStyle: 'bold',
        backgroundColor: '#00000066',
        padding: { x: 6, y: 3 },
    }).setDepth(10);

    scene.registry.events.on('changedata-wood', (parent, value) => {
        _woodText.setText(`Wood: ${value}`);
    });

    scene.registry.events.on('changedata-hq-health', (parent, value) => {
        _hqHealthText.setText(`HQ Health: ${value}`);
    });
}
