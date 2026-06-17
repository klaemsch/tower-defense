class StructureStorage {
    // Central lookup: "col,row" -> gameObject
    #structureMap = new Map();
    #version = 0;
    #borderCells;

    constructor() {
        this.#borderCells = this.getBorderCells();
    }

    getByCell(col, row) {
        return this.#structureMap.get(this.#getKey(col, row));
    }

    isOccupied(col, row) {
        return this.#structureMap.has(this.#getKey(col, row));
    }

    place(col, row, gameObject) {

        if (this.isOccupied(col, row)) {
            return false;
        }

        this.#structureMap.set(this.#getKey(col, row), gameObject);
        this.#commit();
        return true;
    }

    remove(col, row) {
        if (!this.isOccupied(col, row)) {
            return false;
        }

        this.#structureMap.delete(this.#getKey(col, row));
        this.#commit();
        return true;
    }

    getClosestTarget(fromCol, fromRow) {
        let best = null;
        let bestSquaredDist = Infinity;

        this.#structureMap.forEach((structure) => {
            if (structure.attackable === false) return;
            const squaredDist = (structure.col - fromCol) ** 2 + (structure.row - fromRow) ** 2;
            if (squaredDist < bestSquaredDist) { bestSquaredDist = squaredDist; best = structure; }
        });
        return best;
    }

    // first call: gets all border cells and saves them
    // every other call: just returns them
    getBorderCells() {
        if (this.#borderCells) {
            //console.log('border cells array was generated previously, just return them');
            return this.#borderCells;
        }
        //console.log('generate border cells array');
        const { numCols, numRows } = globalConfig.world;
        const cells = [];
        for (let c = 0; c < numCols; c++) {
            cells.push({ col: c, row: 0 });
            cells.push({ col: c, row: numRows - 1 });
        }
        for (let r = 1; r < numRows - 1; r++) {
            cells.push({ col: 0, row: r });
            cells.push({ col: numCols - 1, row: r });
        }
        return cells;
    }

    // returns a random UNOCCUPIED border cell, with .col, .row
    getRandomBorderCell() {
        const borderCells = structureStorage.getBorderCells();
        const randomBorderCell = borderCells[Math.floor(Math.random() * borderCells.length)];
        if (this.isOccupied(randomBorderCell.col, randomBorderCell.row)) return this.getRandomBorderCell();
        return randomBorderCell;
        // TODO: recursive can go wrong if every border cell is occupied, maybe forbid to build there?
    }

    // TODO: maybe adapt so structures in range > 1 can be queried
    getStructuresInRange(fromCol, fromRow, radius = 1, filterFunc = () => true) {
        return helper.adjacentCells(fromCol, fromRow)
            .map(cell => this.#structureMap.get(this.#getKey(cell.col, cell.row)))
            .filter(structure => structure && filterFunc(structure));
    }

    getCurrentVersion() {
        return this.#version;
    }

    hasNewerVersion(oldVersion) {
        console.log('hasNewerVersion call, this.#version', this.#version, 'oldVersion', oldVersion);
        this.#version > oldVersion;
    }

    #getKey(col, row) {
        return `${col},${row}`;
    }

    #commit() {
        this.#version++;
    }
}

helper.worldToGrid = (x, y) => {
    const { tileSize } = globalConfig.world;
    return { col: Math.floor(x / tileSize), row: Math.floor(y / tileSize) };
}

helper.gridToWorld = (col, row) => {
    const { tileSize } = globalConfig.world;
    return { x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 };
}

const structureStorage = new StructureStorage();