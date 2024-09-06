import { Grid } from './puzzles';

export type Solver = {
    name: string;
    solve: (grid: Grid) => AsyncGenerator<Grid, boolean, unknown>;
    countSolutions?: (grid: Grid) => Promise<number>;
}

const GRID_SIZE = 9;

export const humanLikeSolve = async function* (grid: Grid): AsyncGenerator<Grid, boolean, unknown> {
    let progress = true;
    while (progress) {
        progress = false;
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === '') {
                    const possibilities = getPossibilities(grid, row, col);
                    if (possibilities.length === 1) {
                        grid[row][col] = possibilities[0];
                        yield grid.map(row => row.slice());
                        await new Promise(resolve => setTimeout(resolve, 100));
                        progress = true;
                    }
                }
            }
        }
        if (!progress) {
            for (let num = 1; num <= 9; num++) {
                for (let row = 0; row < GRID_SIZE; row++) {
                    const cells: number[] = [];
                    for (let col = 0; col < GRID_SIZE; col++) {
                        if (grid[row][col] === '' && isValid(grid, row, col, num.toString())) {
                            cells.push(col);
                        }
                    }
                    if (cells.length === 1) {
                        grid[row][cells[0]] = num.toString();
                        yield grid.map(row => row.slice());
                        await new Promise(resolve => setTimeout(resolve, 100));
                        progress = true;
                    }
                }
                for (let col = 0; col < GRID_SIZE; col++) {
                    const cells: number[] = [];
                    for (let row = 0; row < GRID_SIZE; row++) {
                        if (grid[row][col] === '' && isValid(grid, row, col, num.toString())) {
                            cells.push(row);
                        }
                    }
                    if (cells.length === 1) {
                        grid[cells[0]][col] = num.toString();
                        yield grid.map(row => row.slice());
                        await new Promise(resolve => setTimeout(resolve, 100));
                        progress = true;
                    }
                }
            }
        }
    }
    return true;
}

const bruteForceSolve = async function* (grid: Grid): AsyncGenerator<Grid, boolean, unknown> {
    const findEmpty = (grid: Grid): [number, number] | null => {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === '') {
                    return [row, col];
                }
            }
        }
        return null;
    }

    const solve = async function* (grid: Grid): AsyncGenerator<Grid, boolean, unknown> {
        const empty = findEmpty(grid);
        if (!empty) return true;

        const [row, col] = empty;
        for (let num = 1; num <= 9; num++) {
            if (isValid(grid, row, col, num.toString())) {
                grid[row][col] = num.toString();
                yield grid.map(row => row.slice());
                await new Promise(resolve => setTimeout(resolve, 50));
                if (yield* solve(grid)) {
                    return true;
                }
                grid[row][col] = '';
            }
        }
        return false;
    }

    yield* solve(grid);
    return true;
}

export const countSolutions = async (grid: Grid): Promise<number> => {
    let count = 0;

    const findEmpty = (grid: Grid): [number, number] | null => {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === '') {
                    return [row, col];
                }
            }
        }
        return null;
    }

    const solve = async function (grid: Grid): Promise<boolean> {
        const empty = findEmpty(grid);
        if (!empty) {
            count++;
            if (count > 100) return true;
            return false;
        }

        const [row, col] = empty;
        for (let num = 1; num <= 9; num++) {
            if (isValid(grid, row, col, num.toString())) {
                grid[row][col] = num.toString();
                if (await solve(grid)) {
                    return true;
                }
                grid[row][col] = '';
            }
        }
        return false;
    }

    await solve(grid);
    return count > 100 ? Infinity : count;
}

const superIntelligenceSolve = async function* (grid: Grid): AsyncGenerator<Grid, boolean, unknown> {
    const findEmpty = (grid: Grid): [number, number] | null => {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === '') {
                    return [row, col];
                }
            }
        }
        return null;
    }

    const solve = async function* (grid: Grid): AsyncGenerator<Grid, boolean, unknown> {
        const empty = findEmpty(grid);
        if (!empty) return true;

        const [row, col] = empty;
        const possibilities = getPossibilities(grid, row, col);
        for (const num of possibilities) {
            grid[row][col] = num;
            yield grid.map(row => row.slice());
            await new Promise(resolve => setTimeout(resolve, 50));
            if (yield* solve(grid)) {
                return true;
            }
            grid[row][col] = '';
        }
        return false;
    }

    yield* solve(grid);
    return true;
}

const forwardCheckingSolve = async function* (grid: Grid): AsyncGenerator<Grid, boolean, unknown> {
    const findEmpty = (grid: Grid): [number, number] | null => {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === '') {
                    return [row, col];
                }
            }
        }
        return null;
    }

    const isValidWithForwardChecking = (grid: Grid, row: number, col: number, value: string): boolean => {
        if (!isValid(grid, row, col, value)) return false;
        grid[row][col] = value;
        const empty = findEmpty(grid);
        grid[row][col] = '';
        return empty === null || getPossibilities(grid, empty[0], empty[1]).length > 0;
    }

    const solve = async function* (grid: Grid): AsyncGenerator<Grid, boolean, unknown> {
        const empty = findEmpty(grid);
        if (!empty) return true;

        const [row, col] = empty;
        for (let num = 1; num <= 9; num++) {
            if (isValidWithForwardChecking(grid, row, col, num.toString())) {
                grid[row][col] = num.toString();
                yield grid.map(row => row.slice());
                await new Promise(resolve => setTimeout(resolve, 50));
                if (yield* solve(grid)) {
                    return true;
                }
                grid[row][col] = '';
            }
        }
        return false;
    }

    yield* solve(grid);
    return true;
}


const getPossibilities = (grid: Grid, row: number, col: number): string[] => {
    const possibilities: string[] = [];
    for (let num = 1; num <= 9; num++) {
        if (isValid(grid, row, col, num.toString())) {
            possibilities.push(num.toString());
        }
    }
    return possibilities;
}

const isValid = (grid: Grid, row: number, col: number, value: string): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
        if (grid[row][i] === value || grid[i][col] === value) {
            return false;
        }
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[boxRow + i][boxCol + j] === value) {
                return false;
            }
        }
    }
    return true;
}

export const solvers: Solver[] = [
    { name: 'Human-like', solve: humanLikeSolve },
    { name: 'Brute Force', solve: bruteForceSolve, countSolutions: countSolutions },
    { name: 'Super Intelligence', solve: superIntelligenceSolve },
    { name: 'Forward Checking', solve: forwardCheckingSolve },
]