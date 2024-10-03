import { SudokuMaster } from "@/components/sudoku-master"; // Import the SudokuMaster component
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <SudokuMaster /> {/* Render the SudokuMaster component */}
      <Link href="/sudoku">sudoku</Link>
      <Link href="/sudoku/create">sudoku create</Link>
    </div>
  );
}
