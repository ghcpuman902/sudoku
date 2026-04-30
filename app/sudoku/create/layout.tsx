import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puzzle editor & solvers",
  description:
    "Build custom Sudoku grids, validate uniqueness, and experiment with solving algorithms.",
  alternates: {
    canonical: "/sudoku/create",
  },
  openGraph: {
    url: "/sudoku/create",
    title: "Puzzle editor & solvers · Sudoku",
    description:
      "Build custom Sudoku grids, validate uniqueness, and experiment with solving algorithms.",
  },
};

export default function SudokuCreateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
