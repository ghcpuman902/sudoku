'use client'

import { type FocusEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  CheckIcon,
  Clock3Icon,
  FolderClockIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react'
import {
  cloneGrid,
  generatePuzzleChoices,
  getDifficultyDetails,
  type GeneratedPuzzle,
  type SudokuGrid,
} from './puzzle-engine'
import {
  deleteRecord,
  getActiveGameRecord,
  getLatestInProgressGame,
  loadSudokuState,
  setActiveGame,
  upsertRecord,
  type SudokuGameRecord,
} from './sudoku-storage'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const EMPTY_GRID: SudokuGrid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ""))

const hasProgress = (puzzle: SudokuGrid, currentGrid: SudokuGrid): boolean =>
  JSON.stringify(puzzle) !== JSON.stringify(currentGrid)

const buildRecordId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `game-${Date.now()}-${Math.random().toString(16).slice(2)}`

const formatDate = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

/** True if `value` duplicates another filled cell in the same row, column, or 3×3 box (clues count). */
const cellConflictsWithPeers = (
  grid: SudokuGrid,
  rowIndex: number,
  colIndex: number,
  value: string,
): boolean => {
  if (value === "") {
    return false
  }

  for (let c = 0; c < 9; c++) {
    if (c !== colIndex && grid[rowIndex][c] === value) {
      return true
    }
  }

  for (let r = 0; r < 9; r++) {
    if (r !== rowIndex && grid[r][colIndex] === value) {
      return true
    }
  }

  const boxRow = Math.floor(rowIndex / 3) * 3
  const boxCol = Math.floor(colIndex / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== rowIndex || c !== colIndex) && grid[r][c] === value) {
        return true
      }
    }
  }

  return false
}

export function SudokuMaster() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [board, setBoard] = useState<SudokuGrid>(cloneGrid(EMPTY_GRID))
  const [initialBoard, setInitialBoard] = useState<SudokuGrid>(cloneGrid(EMPTY_GRID))
  const [solutionBoard, setSolutionBoard] = useState<SudokuGrid>(cloneGrid(EMPTY_GRID))
  const [activeRecord, setActiveRecord] = useState<SudokuGameRecord | null>(null)
  const [records, setRecords] = useState<SudokuGameRecord[]>([])
  const [timer, setTimer] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBoardFilled, setIsBoardFilled] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [choices, setChoices] = useState<GeneratedPuzzle[]>([])
  const [showMistakeColors, setShowMistakeColors] = useState(true)
  const [showRelatedHighlight, setShowRelatedHighlight] = useState(true)
  const [showSameDigitHighlight, setShowSameDigitHighlight] = useState(true)
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)

  const statsLabel = useMemo(() => {
    if (!activeRecord) {
      return "No active game"
    }
    return `${activeRecord.difficulty} • ${activeRecord.estimatedSteps} est. steps • ${activeRecord.strongestTechnique}`
  }, [activeRecord])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const media = window.matchMedia("(max-width: 767px)")
    const handleResize = () => setIsMobile(media.matches)
    handleResize()
    media.addEventListener("change", handleResize)

    const savedState = loadSudokuState()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate local storage snapshot once on mount
    setRecords(savedState.records)

    const current = getActiveGameRecord() ?? getLatestInProgressGame()
    if (current) {
      setActiveRecord(current)
      setBoard(cloneGrid(current.currentGrid))
      setInitialBoard(cloneGrid(current.puzzle))
      setSolutionBoard(cloneGrid(current.solution))
      setTimer(current.elapsedSeconds)
      setIsPlaying(true)
      setIsBoardFilled(current.currentGrid.every((row) => row.every((cell) => cell !== "")))
    } else {
      setChooserOpen(true)
    }

    setIsHydrated(true)
    return () => media.removeEventListener("change", handleResize)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isPlaying && !isBoardFilled && activeRecord) {
      interval = setInterval(() => {
        setTimer((previous) => {
          const next = previous + 1
          const nextRecord: SudokuGameRecord = {
            ...activeRecord,
            elapsedSeconds: next,
            currentGrid: cloneGrid(board),
          }
          const nextState = upsertRecord(nextRecord)
          setRecords(nextState.records)
          setActiveRecord(nextRecord)
          return next
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [activeRecord, board, isBoardFilled, isPlaying])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const generateChoices = async (): Promise<void> => {
    setIsGenerating(true)
    setChoices([])
    await new Promise((resolve) => setTimeout(resolve, 0))
    const nextChoices = generatePuzzleChoices(3, 40)
    setChoices(nextChoices)
    setIsGenerating(false)
  }

  useEffect(() => {
    if (!chooserOpen || !isHydrated || choices.length > 0 || isGenerating) {
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lazily generate choice cards after panel opens
    void generateChoices()
  }, [choices.length, chooserOpen, isGenerating, isHydrated])

  const persistCurrentRecord = (record: SudokuGameRecord): void => {
    const nextState = upsertRecord(record)
    setActiveRecord(record)
    setRecords(nextState.records)
  }

  const handleStartNewGame = (choice: GeneratedPuzzle): void => {
    const now = new Date().toISOString()
    const difficultyDetails = getDifficultyDetails(choice.difficulty)
    const record: SudokuGameRecord = {
      id: buildRecordId(),
      puzzle: cloneGrid(choice.puzzle),
      solution: cloneGrid(choice.solution),
      currentGrid: cloneGrid(choice.puzzle),
      difficulty: choice.difficulty.label,
      startedAt: now,
      completedAt: null,
      elapsedSeconds: 0,
      status: "in-progress",
      clueCount: choice.clueCount,
      strongestTechnique: difficultyDetails.techniqueLabel,
      estimatedSteps: difficultyDetails.estimatedSteps,
    }

    setBoard(cloneGrid(choice.puzzle))
    setInitialBoard(cloneGrid(choice.puzzle))
    setSolutionBoard(cloneGrid(choice.solution))
    setTimer(0)
    setIsCorrect(null)
    setCheckMessage(null)
    setIsBoardFilled(false)
    setIsPlaying(true)
    setChooserOpen(false)
    persistCurrentRecord(record)
  }

  const openNewGameChooser = (): void => {
    if (activeRecord && activeRecord.status === "in-progress" && hasProgress(activeRecord.puzzle, board)) {
      const shouldProceed = window.confirm("Start a new game and keep your current game in history?")
      if (!shouldProceed) {
        return
      }
    }
    setChooserOpen(true)
    setChoices([])
  }

  const handleLoadRecord = (record: SudokuGameRecord): void => {
    setActiveRecord(record)
    setBoard(cloneGrid(record.currentGrid))
    setInitialBoard(cloneGrid(record.puzzle))
    setSolutionBoard(cloneGrid(record.solution))
    setTimer(record.elapsedSeconds)
    setIsBoardFilled(record.currentGrid.every((row) => row.every((cell) => cell !== "")))
    setIsCorrect(null)
    setCheckMessage(null)
    setIsPlaying(record.status !== "completed")
    setActiveGame(record.status === "in-progress" ? record.id : null)
    setHistoryOpen(false)
  }

  const handleDeleteRecord = (recordId: string): void => {
    const nextState = deleteRecord(recordId)
    setRecords(nextState.records)
    if (activeRecord?.id === recordId) {
      setActiveRecord(null)
      setBoard(cloneGrid(EMPTY_GRID))
      setInitialBoard(cloneGrid(EMPTY_GRID))
      setSolutionBoard(cloneGrid(EMPTY_GRID))
      setTimer(0)
      setIsPlaying(false)
      setChooserOpen(true)
    }
  }

  const handleCellChange = (rowIndex: number, colIndex: number, value: string): void => {
    if (!activeRecord || initialBoard[rowIndex][colIndex] !== "") {
      return
    }
    if (value !== "" && !/^[1-9]$/.test(value)) {
      return
    }

    const nextBoard = cloneGrid(board)
    nextBoard[rowIndex][colIndex] = value
    const filled = nextBoard.every((row) => row.every((cell) => cell !== ""))
    const updatedRecord: SudokuGameRecord = {
      ...activeRecord,
      currentGrid: cloneGrid(nextBoard),
      elapsedSeconds: timer,
      status: activeRecord.status,
    }

    setBoard(nextBoard)
    setIsBoardFilled(filled)
    setIsCorrect(null)
    setCheckMessage(null)
    persistCurrentRecord(updatedRecord)

    if (filled) {
      setIsPlaying(false)
    }
  }

  const togglePlay = (): void => {
    if (!activeRecord || activeRecord.status === "completed") {
      return
    }
    setIsPlaying((previous) => !previous)
  }

  const resetGame = (): void => {
    if (!activeRecord) {
      return
    }
    const confirmed = window.confirm(
      "Clear all numbers you entered? Starting clues stay. The timer resets to 0:00.",
    )
    if (!confirmed) {
      return
    }
    const nextBoard = cloneGrid(initialBoard)
    const updatedRecord: SudokuGameRecord = {
      ...activeRecord,
      currentGrid: cloneGrid(nextBoard),
      elapsedSeconds: 0,
      status: "in-progress",
      completedAt: null,
    }
    setBoard(nextBoard)
    setTimer(0)
    setIsPlaying(true)
    setIsBoardFilled(false)
    setIsCorrect(null)
    setCheckMessage(null)
    persistCurrentRecord(updatedRecord)
  }

  const checkSolution = (): void => {
    if (!activeRecord) {
      return
    }
    const isFilled = board.every((row) => row.every((cell) => cell !== ""))
    if (!isFilled) {
      setIsCorrect(null)
      setCheckMessage("Keep going! Fill in all the cells to complete the puzzle.")
      return
    }

    const solved = board.every((row, rowIndex) =>
      row.every((cell, colIndex) => cell === solutionBoard[rowIndex][colIndex]),
    )

    setIsCorrect(solved)
    if (!solved) {
      setCheckMessage("Incorrect solution. Keep trying!")
      return
    }

    const completedRecord: SudokuGameRecord = {
      ...activeRecord,
      currentGrid: cloneGrid(board),
      elapsedSeconds: timer,
      status: "completed",
      completedAt: new Date().toISOString(),
    }
    setCheckMessage("Great work! Puzzle solved.")
    setIsPlaying(false)
    persistCurrentRecord(completedRecord)
  }

  const isSameBox = (r1: number, c1: number, r2: number, c2: number): boolean =>
    Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3)

  const isRelatedToFocus = (rowIndex: number, colIndex: number): boolean => {
    if (!focusedCell) {
      return false
    }
    const { row: fr, col: fc } = focusedCell
    return rowIndex === fr || colIndex === fc || isSameBox(rowIndex, colIndex, fr, fc)
  }

  const handleGridContainerBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget as Node | null
    if (next && event.currentTarget.contains(next)) {
      return
    }
    setFocusedCell(null)
  }

  const getCellClassName = (rowIndex: number, colIndex: number, cell: string): string => {
    const isClue = initialBoard[rowIndex][colIndex] !== ""
    const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex
    const inCross = Boolean(showRelatedHighlight && focusedCell && isRelatedToFocus(rowIndex, colIndex))

    let focusDigit = ""
    if (focusedCell) {
      const atFocus = board[focusedCell.row][focusedCell.col]
      const rawFocus = typeof atFocus === "string" ? atFocus : ""
      if (/^[1-9]$/.test(rawFocus)) {
        focusDigit = rawFocus
      }
    }

    const sameDigitGlow =
      showSameDigitHighlight &&
      focusDigit !== "" &&
      cell !== "" &&
      cell === focusDigit

    let bgTone = ""
    let textTone = ""

    if (!isClue && showMistakeColors && cell !== "") {
      const hasConflict = cellConflictsWithPeers(board, rowIndex, colIndex, cell)
      bgTone = hasConflict ? "bg-red-50" : "bg-emerald-50"
      textTone = hasConflict ? "text-red-800" : "text-emerald-800"
    } else if (inCross) {
      if (isFocused) {
        bgTone = "bg-sky-200"
        textTone = isClue ? "text-gray-800" : "text-blue-700"
      } else if (isClue) {
        bgTone = "bg-sky-100"
        textTone = "text-gray-700"
      } else {
        bgTone = "bg-sky-50/90"
        textTone = "text-blue-600"
      }
    } else if (isClue) {
      bgTone = "bg-gray-100"
      textTone = "text-gray-700"
    } else {
      bgTone = "bg-white"
      textTone = "text-blue-600"
    }

    return cn(
      "w-full h-full aspect-square text-center p-0 rounded-none focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none",
      "text-lg font-semibold border border-gray-300",
      bgTone,
      textTone,
      sameDigitGlow &&
        "[text-shadow:0_0_12px_rgb(236_72_153_/_0.99),0_0_8px_rgb(192_38_211_/_0.95),0_0_18px_rgb(253_0_255_/_0.85)]",
   
      colIndex % 3 === 2 && colIndex !== 8 ? "border-r-2 border-r-gray-800" : "",
      rowIndex % 3 === 2 && rowIndex !== 8 ? "border-b-2 border-b-gray-800" : "",
      colIndex === 0 ? "border-l-2 border-l-gray-800" : "",
      rowIndex === 0 ? "border-t-2 border-t-gray-800" : "",
      colIndex === 8 ? "border-r-2 border-r-gray-800" : "",
      rowIndex === 8 ? "border-b-2 border-b-gray-800" : "",
    )
  }

  const renderSudokuGrid = () => (
    <div
      className="grid grid-cols-9 bg-gray-800 p-px rounded-lg aspect-square w-full max-w-[450px] mx-auto"
      onBlur={handleGridContainerBlur}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const raw = typeof cell === "string" ? cell : ""
          return (
            <Input
              key={`${rowIndex}-${colIndex}`}
              type="text"
              inputMode="numeric"
              pattern="[1-9]"
              value={raw}
              onChange={(event) => handleCellChange(rowIndex, colIndex, event.target.value)}
              onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
              className={getCellClassName(rowIndex, colIndex, raw)}
              readOnly={initialBoard[rowIndex][colIndex] !== ""}
              aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
            />
          )
        }),
      )}
    </div>
  )

  const chooserContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pick Your Next Puzzle</h3>
        <Button variant="outline" onClick={() => void generateChoices()} disabled={isGenerating}>
          <SparklesIcon className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>
      {isGenerating ? (
        <p className="text-sm text-muted-foreground">Generating puzzles...</p>
      ) : (
        <div className="space-y-3">
          {choices.map((choice, index) => (
            <Card key={`${choice.difficulty.label}-${index}`}>
              <CardContent className="py-4 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{choice.difficulty.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {getDifficultyDetails(choice.difficulty).estimatedSteps} est. steps
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uses {getDifficultyDetails(choice.difficulty).techniqueLabel}
                  </p>
                </div>
                <Button onClick={() => handleStartNewGame(choice)}>Start</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const historyContent = (
    <div className="space-y-3">
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved games yet.</p>
      ) : (
        <ScrollArea className="h-[380px] pr-2">
          <div className="space-y-3">
            {records.map((record) => (
              <Card key={record.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{record.difficulty}</p>
                    <span className="text-xs text-muted-foreground">{record.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Started {formatDate(record.startedAt)}</p>
                  <p className="text-xs text-muted-foreground">Time {formatTime(record.elapsedSeconds)}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.estimatedSteps} est. steps • {record.strongestTechnique}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleLoadRecord(record)}
                    >
                      {record.status === "completed" ? "View" : "Resume"}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-3"
                      onClick={() => handleDeleteRecord(record.id)}
                      aria-label="Delete game record"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  const renderDesktopOverlay = (
    open: boolean,
    title: string,
    description: string,
    onClose: () => void,
    content: ReactNode,
  ) =>
    open ? (
      <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
        <Card className="w-full max-w-xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Close panel">Close</Button>
          </CardHeader>
          <CardContent>{content}</CardContent>
        </Card>
      </div>
    ) : null

  return (
    <div className="bg-background flex items-center justify-center p-4 w-full">
      <div className="relative w-full">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-3xl font-bold">Sudoku Master</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={openNewGameChooser}>
                  New Game
                </Button>
                <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                  History
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-0.5">
                <Clock3Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="tabular-nums text-foreground font-medium">{formatTime(timer)}</span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="shrink-0"
                  onClick={togglePlay}
                  disabled={!activeRecord || activeRecord.status === "completed"}
                  aria-label={isPlaying ? "Pause timer" : "Resume timer"}
                >
                  {isPlaying ? (
                    <PauseIcon className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <PlayIcon className="h-3.5 w-3.5" aria-hidden />
                  )}
                </Button>
              </span>
              <span className="min-w-0">{statsLabel}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderSudokuGrid()}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Label className="flex cursor-pointer items-center gap-2 font-normal text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={showMistakeColors}
                    onChange={(event) => setShowMistakeColors(event.target.checked)}
                    aria-describedby="hint-conflicts"
                  />
                  <span>Tint conflicts</span>
                </Label>
                <span id="hint-conflicts" className="sr-only">
                  Green or red tint on your entries when they break or satisfy Sudoku duplicate rules versus the rest of the grid.
                </span>
                <Label className="flex cursor-pointer items-center gap-2 font-normal text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={showRelatedHighlight}
                    onChange={(event) => setShowRelatedHighlight(event.target.checked)}
                    aria-describedby="hint-cross"
                  />
                  <span>Tint cross</span>
                </Label>
                <span id="hint-cross" className="sr-only">
                  Soft tint on the focused cell’s row, column, and three-by-three box.
                </span>
                <Label className="flex cursor-pointer items-center gap-2 font-normal text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={showSameDigitHighlight}
                    onChange={(event) => setShowSameDigitHighlight(event.target.checked)}
                    aria-describedby="hint-digits"
                  />
                  <span>Glow digits</span>
                </Label>
                <span id="hint-digits" className="sr-only">
                  Text shadow on every cell that shows the same digit as the focused cell, when that cell holds a digit one through nine.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={resetGame}
                  disabled={!activeRecord}
                  className="gap-1.5"
                  aria-label="Clear entries — removes your numbers and resets the timer"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden />
                  Clear entries
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={checkSolution}
                  disabled={!activeRecord}
                  className="gap-1.5"
                >
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                  Check
                </Button>
              </div>
            </div>
            {isCorrect === true && <div className="text-center font-bold text-green-600">Correct solution!</div>}
            {isCorrect === false && <div className="text-center font-bold text-red-600">Incorrect solution. Keep trying!</div>}
            {checkMessage && <div className="text-center font-bold text-blue-600">{checkMessage}</div>}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <FolderClockIcon className="h-3.5 w-3.5" />
                Progress is saved automatically in this browser.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isMobile && renderDesktopOverlay(
        chooserOpen,
        "Choose Puzzle",
        "Select one of three generated unique puzzles.",
        () => setChooserOpen(false),
        chooserContent,
      )}
      {!isMobile && renderDesktopOverlay(
        historyOpen,
        "Game History",
        "Resume an in-progress game or review completed games.",
        () => setHistoryOpen(false),
        historyContent,
      )}

      {isMobile && (
        <Sheet open={chooserOpen} onOpenChange={setChooserOpen}>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Choose Puzzle</SheetTitle>
              <SheetDescription>Select one of three generated unique puzzles.</SheetDescription>
            </SheetHeader>
            {chooserContent}
          </SheetContent>
        </Sheet>
      )}
      {isMobile && (
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Game History</SheetTitle>
              <SheetDescription>Resume in-progress games or view completed sessions.</SheetDescription>
            </SheetHeader>
            {historyContent}
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}