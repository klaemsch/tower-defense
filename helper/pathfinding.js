const helper = {};

// returns array of (col, row)-pairs that are adjacent to the given (col, row)-pair
helper.adjacentCells = (iCol, iRow) => {
    return [
        { col: iCol - 1, row: iRow }, { col: iCol + 1, row: iRow },
        { col: iCol, row: iRow - 1 }, { col: iCol, row: iRow + 1 },
        { col: iCol - 1, row: iRow - 1 }, { col: iCol + 1, row: iRow - 1 },
        { col: iCol - 1, row: iRow + 1 }, { col: iCol + 1, row: iRow + 1 },
    ];
}

helper.findPath = (startCol, startRow, goalCol, goalRow) => {
    const { numCols, numRows } = config.world;
    const walkableAdjacent = helper.adjacentCells(goalCol, goalRow).filter(({ col, row }) => {
        if (col < 0 || col >= numCols || row < 0 || row >= numRows) return false;
        const entry = structureMap.get(gridKey(col, row));
        return !entry || (col === startCol && row === startRow);
    });
    if (walkableAdjacent.length === 0) return null;

    const goalSet = new Set(walkableAdjacent.map(({ col, row }) => gridKey(col, row)));
    const queue = [{ col: startCol, row: startRow, path: [] }];
    const visited = new Set([gridKey(startCol, startRow)]);
    const dirs = [
        { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
        { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
        { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
        { dc: -1, dr: 1 }, { dc: 1, dr: 1 },
    ];

    while (queue.length > 0) {
        const { col, row, path } = queue.shift();
        if (goalSet.has(gridKey(col, row))) return path;

        for (const { dc, dr } of dirs) {
            const nc = col + dc, nr = row + dr;
            const k = gridKey(nc, nr);
            if (nc < 0 || nc >= numCols || nr < 0 || nr >= numRows) continue;
            if (visited.has(k)) continue;
            const entry = structureMap.get(k);
            if (entry && !goalSet.has(k)) continue;
            visited.add(k);
            queue.push({ col: nc, row: nr, path: [...path, { col: nc, row: nr }] });
        }
    }
    return null;
}