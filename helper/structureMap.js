class StructureStorage {
    // Central lookup: "col,row" -> gameObject
    #structureMap = new Map();

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
        return true;
    }

    remove(col, row) {
        if (!this.isOccupied(col, row)) {
            return false;
        }

        this.#structureMap.delete(this.#getKey(col, row));
        return true;
    }

    getNearestTarget(fromCol, fromRow) {
        let best = null;
        let bestDist = Infinity;

        this.#structureMap.forEach((structure) => {
            if (structure.attackable === false) return;
            const d = Math.sqrt((structure.col - fromCol) ** 2 + (structure.row - fromRow) ** 2);
            if (d < bestDist) { bestDist = d; best = structure; }
        });
        return best;
    }

    getBorderCells() {
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

    // TODO: maybe adapt so structures in range > 1 can be queried
    getStructuresInRange(fromCol, fromRow, radius = 1, filterFunc = () => true) {
        return helper.adjacentCells(fromCol, fromRow)
            .map(cell => this.#structureMap.get(this.#getKey(cell.col, cell.row)))
            .filter(structure => structure && filterFunc(structure));
    }

    #getKey(col, row) {
        return `${col},${row}`;
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