class HudScene extends Phaser.Scene {

    constructor() {
        super('hudScene');
    }

    preload() {

    }

    create() {
        this._newHUDText(8, 8, 'wood', 0, 'Wood');
        this._newHUDText(8, 30, 'hq-health', 200, 'HQ Health');
        this._newHUDText(8, 52, 'enemies', 0, 'Enemies');
    }

    _newHUDText(x, y, label, initValue, text) {

        const textElement = this.add.text(x, y, `${text}: ${initValue}`, {
            fontSize: '13px',
            color: '#a8dadc',
            fontStyle: 'bold',
            backgroundColor: '#00000066',
            padding: { x: 6, y: 3 },
        }).setDepth(10);

        this.registry.events.on(`changedata-${label}`, (parent, value) => {
            textElement.setText(`${text}: ${value}`);
        });
    }

}
