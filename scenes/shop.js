class ShopScene extends Phaser.Scene {
    #title = 'Wave Complete!';
    #subtitle = 'You earned resources! Upgrade your towers.';

    constructor() {
        super(config.sceneKeys.shop);
    }

    preload() { }

    create() {

        // create overlay rectangle
        const overlayRect = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.7
        ).setDepth(100);

        // create overlay title
        const titleElement = this.add.text(this.scale.width / 2, 100, this.#title, {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(101);

        // create overlay subtitle
        const subtitle = this.add.text(this.scale.width / 2, 150, this.#subtitle, {
            fontSize: '18px',
            color: '#a8dadc',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(101);

        // Add continue button
        const continueBtn = this.add.text(this.scale.width / 2, 250, 'Continue', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#1d3557',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5)
            .setDepth(101)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.sleep();
            });
    }
}