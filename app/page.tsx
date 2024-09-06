import { SudokuMaster } from "@/components/sudoku-master"; // Import the SudokuMaster component

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <SudokuMaster /> {/* Render the SudokuMaster component */}
    </div>
  );
}
