'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlayIcon, PauseIcon, RotateCcwIcon, CheckIcon, MenuIcon } from 'lucide-react'
import { getPuzzles, type Grid } from './puzzles'
import { solvers } from './algorithms'

export function SudokuMaster() {
  const puzzles = getPuzzles()
  const [board, setBoard] = useState<Grid>(Array(9).fill(Array(9).fill('')))
  const [initialBoard, setInitialBoard] = useState<Grid>(Array(9).fill(Array(9).fill('')))
  const [timer, setTimer] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPuzzleListOpen, setIsPuzzleListOpen] = useState(false)
  const puzzleListRef = useRef<HTMLDivElement>(null)
  const [isBoardFilled, setIsBoardFilled] = useState(false)
  const [isSolving, setIsSolving] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && !isBoardFilled) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isBoardFilled])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (puzzleListRef.current && !puzzleListRef.current.contains(event.target as Node)) {
        setIsPuzzleListOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (initialBoard[rowIndex][colIndex] === '') {
      if (value === '' || (value.length === 1 && /^[1-9]$/.test(value))) {
        const newBoard = board.map((row) => [...row]) as Grid
        newBoard[rowIndex][colIndex] = value
        setBoard(newBoard)

        // Check if the board is filled after updating
        const filled = newBoard.every(row => row.every(cell => cell !== ''))
        setIsBoardFilled(filled)
        if (filled) {
          setIsPlaying(false)
        }
      }
    }
  }

  const startNewGame = (selectedPuzzle: Grid) => {
    setBoard(selectedPuzzle)
    setInitialBoard(selectedPuzzle)
    setTimer(0)
    setIsPlaying(true)
    setIsPuzzleListOpen(false)
    setIsBoardFilled(false)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const resetGame = () => {
    setBoard([...initialBoard])
    setTimer(0)
    setIsPlaying(true)
  }

  const checkSolution = async () => {
    // Check if the puzzle is complete
    if (!board.every(row => row.every(cell => cell !== ''))) {
      setIsCorrect(null)
      setCheckMessage("Keep going! Fill in all the cells to complete the puzzle.")
      return
    }

    setIsSolving(true)
    setIsCorrect(null)
    setCheckMessage(null)
    const superIntelligenceSolver = solvers.find(solver => solver.name === 'Super Intelligence')
    if (!superIntelligenceSolver) {
      console.error('Super Intelligence solver not found')
      setIsSolving(false)
      return
    }

    const solverGenerator = superIntelligenceSolver.solve(initialBoard)
    let solvedGrid: Grid | undefined

    for await (const grid of solverGenerator) {
      solvedGrid = grid
    }

    if (solvedGrid) {
      const isCorrect = board.every((row, i) => 
        row.every((cell, j) => cell === solvedGrid![i][j])
      )
      setIsCorrect(isCorrect)
    } else {
      setIsCorrect(false)
    }

    setIsSolving(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const renderSudokuGrid = () => {
    return (
      <div className="grid grid-cols-9 bg-gray-800 p-px rounded-lg aspect-square w-full max-w-[450px] mx-auto">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <Input
              key={`${rowIndex}-${colIndex}`}
              type="text"
              inputMode="numeric"
              pattern="[1-9]"
              maxLength={1}
              value={cell as string}
              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
              className={`w-full h-full aspect-square text-center p-0 rounded-none focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none
                          text-lg font-semibold border border-gray-300
                          ${initialBoard[rowIndex][colIndex] ? 'bg-gray-100 text-gray-700' : 'bg-white text-blue-600'}
                          ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-r-2 border-r-gray-800' : ''}
                          ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-b-2 border-b-gray-800' : ''}
                          ${colIndex === 0 ? 'border-l-2 border-l-gray-800' : ''}
                          ${rowIndex === 0 ? 'border-t-2 border-t-gray-800' : ''}
                          ${colIndex === 8 ? 'border-r-2 border-r-gray-800' : ''}
                          ${rowIndex === 8 ? 'border-b-2 border-b-gray-800' : ''}`}
              readOnly={initialBoard[rowIndex][colIndex] !== ''}
            />
          ))
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="relative">
        <Card className="w-full max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-3xl font-bold">Sudoku Master</CardTitle>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsPuzzleListOpen(!isPuzzleListOpen)}
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-3xl font-mono font-bold">{formatTime(timer)}</div>
            </div>
            {renderSudokuGrid()}
            <div className="flex justify-between gap-2 flex-wrap">
              <Button onClick={togglePlay} className="flex-grow">
                {isPlaying ? <PauseIcon className="mr-2 h-4 w-4" /> : <PlayIcon className="mr-2 h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Resume'}
              </Button>
              <Button onClick={resetGame} variant="outline" className="flex-grow">
                <RotateCcwIcon className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button 
                onClick={checkSolution} 
                variant="outline" 
                className="flex-grow"
                disabled={isSolving}
              >
                {isSolving ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <CheckIcon className="mr-2 h-4 w-4" />
                )}
                Check
              </Button>
            </div>
            {isCorrect === true && (
              <div className="text-center font-bold text-green-600">
                Correct solution!
              </div>
            )}
            {isCorrect === false && (
              <div className="text-center font-bold text-red-600">
                Incorrect solution. Keep trying!
              </div>
            )}
            {checkMessage && (
              <div className="text-center font-bold text-blue-600">
                {checkMessage}
              </div>
            )}
          </CardContent>
        </Card>
        
        {isPuzzleListOpen && (
          <div 
            ref={puzzleListRef}
            className="absolute top-0 right-0 mt-16 w-[250px] bg-white shadow-lg rounded-lg overflow-hidden"
          >
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Puzzle List</h2>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-4">
                {puzzles.map((puzzle) => (
                  <Button
                    key={puzzle.name}
                    onClick={() => startNewGame(puzzle.grid)}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    {puzzle.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}