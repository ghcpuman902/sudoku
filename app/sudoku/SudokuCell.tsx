'use client'

import React from 'react';

type CellNote = {
    [key: number]: boolean
}

type HighlightType = 'cell' | 'row' | 'column' | 'box';

interface Highlight {
    type: HighlightType;
    index: number;
    subIndex?: number;
}

interface SudokuCellProps {
    cell: string | CellNote;
    row: number;
    col: number;
    highlight: Highlight;
    error: { row: number; col: number } | null;
    cellColors: { [key: string]: boolean };  // Update type to boolean
    currentCheck: { row: number; col: number } | null;
    handleInputChange: (row: number, col: number, value: string) => void;
    editable: boolean;
}

const SudokuCell: React.FC<SudokuCellProps> = ({
    cell,
    row,
    col,
    highlight,
    error,
    cellColors,
    currentCheck,
    handleInputChange,
    editable
}) => {
    const getCellClassName = () => {
        let className = "w-10 h-10 text-center"
        if (highlight.type === 'cell' && highlight.index === row && highlight.subIndex === col) {
            className += " bg-yellow-200"
        } else if (highlight.type === 'row' && highlight.index === row) {
            className += " bg-yellow-100"
        } else if (highlight.type === 'column' && highlight.index === col) {
            className += " bg-yellow-100"
        } else if (highlight.type === 'box' && Math.floor(row / 3) * 3 + Math.floor(col / 3) === highlight.index) {
            className += " bg-yellow-100"
        }
        if (typeof cell === 'string' && cell !== '') {
            className += " font-extrabold"
        }
        if (error && error.row === row && error.col === col) {
            className += " bg-red-200"
        }
        const cellKey = `${row}-${col}`
        if (cellColors[cellKey]) {
            className += " bg-red-200";  // Highlight conflicting cells
        }
        if (Math.floor(row / 3) % 2 === Math.floor(col / 3) % 2) {
            className += " bg-gray-200 dark:bg-gray-700"
        } else {
            className += " bg-transparent"
        }
        if (currentCheck && (currentCheck.row === row || currentCheck.col === col)) {
            className += " bg-blue-100"
        }
        return className
    }

    const getCellStyle = (): React.CSSProperties => ({
        appearance: 'none',
        border: '1px solid #ccc',
        padding: 0,
        margin: 0,
        textAlign: 'center',
        width: '100%',
        height: '100%',
        fontSize: '1.25rem',
        lineHeight: '1.5rem'
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^[1-9]?$/.test(value)) {
            handleInputChange(row, col, value);
        }
    }

    if (typeof cell === 'string') {
        return (
            <input
                type="text"
                value={cell}
                onChange={handleChange}
                className={`${getCellClassName()} border border-black dark:border-white`}
                maxLength={1}
                disabled={!editable}
                aria-label={`Cell ${row + 1},${col + 1}`}
                style={getCellStyle()}
            />
        )
    } else {
        return (
            <div
                className={`${getCellClassName()} border border-black dark:border-white flex flex-wrap items-center justify-center text-xs`}
                aria-label={`Cell ${row + 1},${col + 1} notes`}
                style={getCellStyle()}
            >
                {Object.entries(cell).map(([num, isValid]) => (
                    isValid && <span key={num} className="w-3 h-3">{num}</span>
                ))}
            </div>
        )
    }
}

export default SudokuCell;