'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import SudokuGrid from './SudokuGrid';
import usePuzzle from './usePuzzle';
import { getPuzzles, Grid, EMPTY_PUZZLE } from '../../components/puzzles';
import { solvers } from '../../components/algorithms';

// const GRID_SIZE = 9;

type Highlight = {
    type: 'cell' | 'row' | 'column' | 'box'
    index: number
    subIndex?: number
}

export default function SudokuSolver() {
    const {
        grid,
        setGrid,
        handleInputChange,
        undo,
        redo,
        historyIndex,
        history
    } = usePuzzle(EMPTY_PUZZLE);

    // const [selectedPuzzle, setSelectedPuzzle] = useState<Grid>(EMPTY_PUZZLE);
    // const [solving, setSolving] = useState(false);
    const [highlight, setHighlight] = useState<Highlight>({ type: 'cell', index: -1 });
    // const [solvingMethod, setSolvingMethod] = useState<string>('defaultSolver');

    useEffect(() => {
        setGrid(EMPTY_PUZZLE);
    }, [setGrid]);

    const handlePuzzleSelect = (puzzle: Grid) => {
        // setSelectedPuzzle(puzzle);
        setGrid(puzzle);
    }

    // const solveSudoku = async () => {
    //     setSolving(true);
    //     const newGrid = grid.map(row => row.slice());
    //     const solver = solvers.find(s => s.name === 'defaultSolver');
    //     if (solver) {
    //         for await (const updatedGrid of solver.solve(newGrid)) {
    //             setGrid(updatedGrid);
    //             await new Promise(resolve => setTimeout(resolve, 50));
    //         }
    //     }
    //     setSolving(false);
    // }

    const solveNextStep = async () => {
        const newGrid = grid.map(row => row.slice());
        const solver = solvers[0];
        const step = await solver.solve(newGrid).next();
        if (!step.done) {
            setGrid(step.value);
            setHighlight({ type: 'cell', index: -1 });
        }
    }

    const countFilledCells = (grid: Grid) => {
        return grid.flat().filter(cell => typeof cell === 'string' && cell !== '').length;
    }

    const filledCount = countFilledCells(grid);

    return (
        <div className="flex">
            <div className="w-1/4 p-4 bg-gray-100">
                <h2 className="text-xl font-bold mb-4">Puzzles</h2>
                <h3 className="font-semibold mb-2">Predefined</h3>
                {getPuzzles().map((puzzle, index) => (
                    <Button key={index} onClick={() => handlePuzzleSelect(puzzle.grid)} className="block mb-2 w-full">
                        {puzzle.name}
                    </Button>
                ))}
            </div>
            <div className="w-3/4 p-4">
                <h1 className="text-2xl font-bold">🧩 Sudoku Solver</h1>
                
                <div className="flex space-x-2 bg-gray-100 p-2 rounded-lg">
                    <Button onClick={solveNextStep} disabled={false}>▶️ Solve Next Step</Button>
                    <Button onClick={undo} disabled={historyIndex === 0}>⏪ Undo</Button>
                    <Button onClick={redo} disabled={historyIndex === history.length - 1}>⏩ Redo</Button>
                </div>
                
                <SudokuGrid 
                    grid={grid} 
                    handleInputChange={handleInputChange}  
                    onInputChange={handleInputChange}
                    highlight={highlight} 
                    error={{ row: -1, col: -1 }}
                    cellColors={{}}
                    currentCheck={null}
                    editable={true}
                    filledCount={filledCount} // Add this line
                />
            </div>
        </div>
    )
}


