const globalStyles = {
    text: {
        colors: {
            base: '#a8dadc',
            highlight: '#ffffff',
            warning: '#e63946',
        },
        sizes: {
            small: '11px',
            medium: '15px',
            large: '18px',
            title: '48px',
        }
    },
    buttons: {
        small: {
            width: 100,
            height: 36,
        },
        medium: {
            width: 160,
            height: 44,
        }
    },
    colors: {
        popularBadge: '#e6f4fb',
        resourceBackground: '#00000066',
        cardDescription: '#8fa8c4',
    },
    depthMap: {
        // TODO: apparently depth is dependent on scenes, so not comparable between scenes
        // scenes that are launched later, are put on top of the previous
        // 1. Normal Game
        structureRadius: 0,
        enemyPath: 1,
        hoverGrid: 5,
        bullet: 8,
        structureProductionFx: 10,
        risingFx: 10,
        // 2. HUD
        resourceContainer: 111,
        progressBar: 15,
        // 3. Shop and Game Over (MutEx)
        gameOverRect: 50,
        gameOverText: 51,
        shopBackgroundBlur: 50,
        shopText: 51,
    }
}