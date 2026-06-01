class ResourceContainer extends Phaser.GameObjects.Container {
    #hudScene;
    #paddingLeft = 8;
    #paddingTop = 8;
    #betweenGap = 22;

    /**
     * @param {Phaser.Scene} scene
     * @param {number}       cx      - Center x
     * @param {number}       cy      - Center y
     */
    constructor(scene, cx, cy) {
        super(scene, cx, cy);
        this.#hudScene = scene;

        const resources = Object.values(globalConfig.resources);

        resources.forEach((resource, i) => {
            const { registryKey, label } = resource;
            const x = this.#paddingLeft;
            const y = this.#paddingTop + i * this.#betweenGap;
            //console.debug(`Creating HUD Text for resource ${label}`);

            this.#newResourceDisplay(x, y, registryKey, label);
        });

        scene.add.existing(this);
    }

    #newResourceDisplay(x, y, registryKey, label) {
        const initValue = this.#hudScene.registry.get(registryKey);

        const textElement = this.#hudScene.add.text(x, y, `${label} ${initValue}`, {
            fontSize: '13px',
            color: '#a8dadc',
            fontStyle: 'bold',
            backgroundColor: '#00000066',
            padding: { x: 6, y: 3 },
        }).setDepth(globalConfig.depthMap.resourceLabel);

        this.add(textElement);

        this.#hudScene.registry.events.on(`changedata-${registryKey}`, (parent, value) => {
            textElement.setText(`${label} ${value}`);
        });
    }
}