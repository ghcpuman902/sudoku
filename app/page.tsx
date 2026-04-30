import Link from "next/link"
import { SudokuMaster } from "@/components/sudoku-master";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <header className="flex max-w-md flex-col items-center gap-1 text-center">
        <h1 className="text-balance text-lg font-semibold tracking-tight text-foreground">
          Sudoku
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          Classic 9×9 puzzles with notes, hints, and saved games — all in your browser.
        </p>
      </header>
      <SudokuMaster />
      <div className="text-xs text-muted-foreground">
        <Link
          href="/sudoku/create"
          className="underline underline-offset-4"
          aria-label="Open advanced Sudoku tools: puzzle editor and solvers"
        >
          Puzzle editor & solvers
        </Link>
      </div>
    </div>
  );
}
