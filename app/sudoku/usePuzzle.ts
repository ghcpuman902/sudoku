import { useState, useCallback } from 'react';
import { Grid } from '../../components/puzzles';

const GRID_SIZE = 9;

const cloneGrid = (puzzle: Grid): Grid => JSON.parse(JSON.stringify(puzzle)) as Grid;

const usePuzzle = (initialPuzzle: Grid) => {
    const snapshotKey = JSON.stringify(initialPuzzle);
    const [appliedKey, setAppliedKey] = useState(snapshotKey);

    const [grid, setGrid] = useState<Grid>(() => cloneGrid(initialPuzzle));
    const [history, setHistory] = useState<Grid[]>(() => [cloneGrid(initialPuzzle)]);
    const [historyIndex, setHistoryIndex] = useState(0);

    if (snapshotKey !== appliedKey) {
        setAppliedKey(snapshotKey);
        const next = cloneGrid(initialPuzzle);
        setGrid(next);
        setHistory([cloneGrid(initialPuzzle)]);
        setHistoryIndex(0);
    }

    const isValid = useCallback((row: number, col: number, value: string): boolean => {
        if (!/^[1-9]$/.test(value)) {
            return false;
        }

        for (let i = 0; i < GRID_SIZE; i++) {
            if ((i !== col && grid[row][i] === value) || (i !== row && grid[i][col] === value)) {
                return false;
            }
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (boxRow + i !== row && boxCol + j !== col && grid[boxRow + i][boxCol + j] === value) {
                    return false;
                }
            }
        }

        return true;
    }, [grid]);

    const handleInputChange = useCallback((row: number, col: number, value: string) => {
        if (value === '' || isValid(row, col, value)) {
            setGrid(prevGrid => {
                const newGrid = prevGrid.map(r => r.slice());
                newGrid[row][col] = value;
                return newGrid;
            });
            setHistory(prevHistory => [...prevHistory.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(grid))]);
            setHistoryIndex(prevIndex => prevIndex + 1);
        }
    }, [grid, historyIndex, isValid]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prevIndex => prevIndex - 1);
            setGrid(history[historyIndex - 1]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prevIndex => prevIndex + 1);
            setGrid(history[historyIndex + 1]);
        }
    }, [history, historyIndex]);

    return {
        grid,
        setGrid,
        handleInputChange,
        undo,
        redo,
        historyIndex,
        history
    };
};

export default usePuzzle;