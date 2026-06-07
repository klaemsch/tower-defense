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
            if (typeof resource === 'function') return;
            const { registryKey, label } = resource;
            const x = this.#paddingLeft;
            const y = this.#paddingTop + i * this.#betweenGap;
            //console.debug(`Creating HUD Text for resource ${label}`);

            this.#newResourceDisplay(x, y, registryKey, label);
        });

        // set depth of container
        this.setDepth(globalStyles.depthMap.resourceContainer);

        scene.add.existing(this);
    }

    #newResourceDisplay(x, y, registryKey, label) {
        const initValue = this.#hudScene.registry.get(registryKey);

        const textElement = this.#hudScene.add.text(x, y, `${label} ${initValue}`, {
            fontSize: globalStyles.text.sizes.medium,
            color: globalStyles.text.colors.base,
            fontStyle: 'bold',
            backgroundColor: globalStyles.colors.resourceBackground,
            padding: { x: 6, y: 3 },
        })

        this.add(textElement);

        this.#hudScene.registry.events.on(`changedata-${registryKey}`, (parent, value) => {
            textElement.setText(`${label} ${value}`);
        });
    }
}