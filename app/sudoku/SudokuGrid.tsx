'use client'

import React from 'react';
import SudokuCell from './SudokuCell';

type CellNote = {
    [key: number]: boolean
}

type Grid = (string | CellNote)[][]

type Highlight = {
    type: 'cell' | 'row' | 'column' | 'box';
    index: number;
    subIndex?: number;
}

interface SudokuGridProps {
    grid: Grid;
    onInputChange: (row: number, col: number, value: string) => void;
    highlight: Highlight;
    error: { row: number; col: number } | null;
    cellColors: { [key: string]: boolean };
    currentCheck: { row: number; col: number } | null;
    handleInputChange: (row: number, col: number, value: string) => void;
    editable: boolean;
    filledCount: number; // Add this line
}

const SudokuGrid: React.FC<SudokuGridProps> = ({
    grid,
    onInputChange,
    highlight,
    error,
    cellColors,
    currentCheck,
    handleInputChange,
    editable,
    filledCount // Add this line
}) => {
    const handleChange = (row: number, col: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange(row, col, event.target.value);
    };

    const getCountColor = () => {
        if (filledCount < 10) return 'text-red-500';
        if (filledCount < 17) return 'text-orange-500';
        if (filledCount < 81) return 'text-blue-500';
        return 'text-green-500';
    };

    return (
        <div>
            <div className={`text-lg font-bold ${getCountColor()}`}>
                Filled Cells: {filledCount}
            </div>
            <div
                className="grid grid-cols-9 gap-0 border-2 border-black dark:border-white"
                role="grid"
                aria-label="Sudoku Grid"
                style={{ width: '100%', maxWidth: '500px', aspectRatio: '1 / 1' }}
            >
                {grid.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map((cell, colIndex) => (
                            <SudokuCell
                                key={`${rowIndex}-${colIndex}`}
                                cell={cell}
                                row={rowIndex}
                                col={colIndex}
                                highlight={highlight as Highlight}
                                error={error}
                                cellColors={cellColors}
                                currentCheck={currentCheck}
                                handleInputChange={handleInputChange}
                                editable={editable}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

export default SudokuGrid;