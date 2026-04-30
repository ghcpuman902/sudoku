import { type Grid } from "./puzzles";

export type SudokuCell = string;
export type SudokuGrid = SudokuCell[][];
export type SudokuDifficulty = "Easy" | "Medium" | "Hard" | "Expert";
export type TechniqueName = "nakedSingle" | "hiddenSingle" | "nakedPair" | "backtracking";

export type DifficultyReport = {
  label: SudokuDifficulty;
  strongestTechnique: TechniqueName;
  singlesApplied: number;
  hiddenSinglesApplied: number;
  nakedPairsApplied: number;
  backtrackingNodes: number;
  backtrackingDepth: number;
  backtrackingCount: number;
};

export type DifficultyDetails = {
  techniqueLabel: string;
  estimatedSteps: number;
  reasoning: string;
};

export type GeneratedPuzzle = {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
  clueCount: number;
  difficulty: DifficultyReport;
};

const GRID_SIZE = 9;
const BOX_SIZE = 3;

const buildEmptyGrid = (): SudokuGrid =>
  Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => ""));

export const normalizeGrid = (grid: Grid): SudokuGrid =>
  grid.map((row) => row.map((cell) => (typeof cell === "string" ? cell : "")));

export const cloneGrid = (grid: SudokuGrid): SudokuGrid => grid.map((row) => row.slice());

const countClues = (grid: SudokuGrid): number =>
  grid.flat().filter((cell) => cell !== "").length;

const getBoxStart = (index: number): number => Math.floor(index / BOX_SIZE) * BOX_SIZE;

const shuffle = <T,>(items: T[]): T[] => {
  const cloned = items.slice();
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const isValidPlacement = (grid: SudokuGrid, row: number, col: number, value: string): boolean => {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (grid[row][i] === value || grid[i][col] === value) {
      return false;
    }
  }

  const boxRow = getBoxStart(row);
  const boxCol = getBoxStart(col);
  for (let r = boxRow; r < boxRow + BOX_SIZE; r += 1) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c += 1) {
      if (grid[r][c] === value) {
        return false;
      }
    }
  }
  return true;
};

const getCandidates = (grid: SudokuGrid, row: number, col: number): string[] => {
  if (grid[row][col] !== "") {
    return [];
  }

  const candidates: string[] = [];
  for (let value = 1; value <= GRID_SIZE; value += 1) {
    const candidate = String(value);
    if (isValidPlacement(grid, row, col, candidate)) {
      candidates.push(candidate);
    }
  }
  return candidates;
};

const findBestEmptyCell = (grid: SudokuGrid): [number, number] | null => {
  let bestCell: [number, number] | null = null;
  let smallestCandidateCount = GRID_SIZE + 1;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] !== "") {
        continue;
      }

      const candidates = getCandidates(grid, row, col);
      if (candidates.length < smallestCandidateCount) {
        smallestCandidateCount = candidates.length;
        bestCell = [row, col];
      }

      if (smallestCandidateCount <= 1) {
        return bestCell;
      }
    }
  }

  return bestCell;
};

const solveGrid = (grid: SudokuGrid, randomized: boolean): boolean => {
  const emptyCell = findBestEmptyCell(grid);
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;
  const orderedCandidates = randomized
    ? shuffle(getCandidates(grid, row, col))
    : getCandidates(grid, row, col);

  if (orderedCandidates.length === 0) {
    return false;
  }

  for (const candidate of orderedCandidates) {
    grid[row][col] = candidate;
    if (solveGrid(grid, randomized)) {
      return true;
    }
    grid[row][col] = "";
  }

  return false;
};

export const generateSolvedGrid = (): SudokuGrid => {
  const solved = buildEmptyGrid();
  solveGrid(solved, true);
  return solved;
};

export const countSolutionsUpTo = (grid: SudokuGrid, limit = 2): number => {
  const workingGrid = cloneGrid(grid);
  let solutionCount = 0;

  const search = (): void => {
    if (solutionCount >= limit) {
      return;
    }

    const emptyCell = findBestEmptyCell(workingGrid);
    if (!emptyCell) {
      solutionCount += 1;
      return;
    }

    const [row, col] = emptyCell;
    const candidates = getCandidates(workingGrid, row, col);
    if (candidates.length === 0) {
      return;
    }

    for (const candidate of candidates) {
      if (solutionCount >= limit) {
        return;
      }
      workingGrid[row][col] = candidate;
      search();
      workingGrid[row][col] = "";
    }
  };

  search();
  return solutionCount;
};

export const hasUniqueSolution = (grid: SudokuGrid): boolean => countSolutionsUpTo(grid, 2) === 1;

const applyNakedSingles = (grid: SudokuGrid): number => {
  let applied = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] !== "") {
        continue;
      }
      const candidates = getCandidates(grid, row, col);
      if (candidates.length === 1) {
        grid[row][col] = candidates[0];
        applied += 1;
      }
    }
  }
  return applied;
};

const applyHiddenSingles = (grid: SudokuGrid): number => {
  let applied = 0;

  for (let number = 1; number <= GRID_SIZE; number += 1) {
    const candidate = String(number);

    for (let row = 0; row < GRID_SIZE; row += 1) {
      const possibleCols: number[] = [];
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (grid[row][col] === "" && isValidPlacement(grid, row, col, candidate)) {
          possibleCols.push(col);
        }
      }
      if (possibleCols.length === 1) {
        grid[row][possibleCols[0]] = candidate;
        applied += 1;
      }
    }

    for (let col = 0; col < GRID_SIZE; col += 1) {
      const possibleRows: number[] = [];
      for (let row = 0; row < GRID_SIZE; row += 1) {
        if (grid[row][col] === "" && isValidPlacement(grid, row, col, candidate)) {
          possibleRows.push(row);
        }
      }
      if (possibleRows.length === 1) {
        grid[possibleRows[0]][col] = candidate;
        applied += 1;
      }
    }
  }

  return applied;
};

const applyNakedPairs = (grid: SudokuGrid): number => {
  let eliminations = 0;

  const processUnit = (cells: Array<[number, number]>): void => {
    const pairMap = new Map<string, Array<[number, number]>>();

    for (const [row, col] of cells) {
      if (grid[row][col] !== "") {
        continue;
      }
      const candidates = getCandidates(grid, row, col);
      if (candidates.length !== 2) {
        continue;
      }
      const key = candidates.slice().sort().join(",");
      const existing = pairMap.get(key) ?? [];
      existing.push([row, col]);
      pairMap.set(key, existing);
    }

    pairMap.forEach((positions, key) => {
      if (positions.length !== 2) {
        return;
      }
      const forbiddenValues = key.split(",");
      for (const [row, col] of cells) {
        const isPairCell = positions.some(([pairRow, pairCol]) => pairRow === row && pairCol === col);
        if (isPairCell || grid[row][col] !== "") {
          continue;
        }
        const candidates = getCandidates(grid, row, col);
        const filtered = candidates.filter((candidate) => !forbiddenValues.includes(candidate));
        if (filtered.length === 1 && filtered[0] !== grid[row][col]) {
          grid[row][col] = filtered[0];
          eliminations += 1;
        }
      }
    });
  };

  for (let row = 0; row < GRID_SIZE; row += 1) {
    processUnit(Array.from({ length: GRID_SIZE }, (_, col): [number, number] => [row, col]));
  }
  for (let col = 0; col < GRID_SIZE; col += 1) {
    processUnit(Array.from({ length: GRID_SIZE }, (_, row): [number, number] => [row, col]));
  }
  for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
      const cells: Array<[number, number]> = [];
      for (let row = boxRow; row < boxRow + BOX_SIZE; row += 1) {
        for (let col = boxCol; col < boxCol + BOX_SIZE; col += 1) {
          cells.push([row, col]);
        }
      }
      processUnit(cells);
    }
  }

  return eliminations;
};

const isSolved = (grid: SudokuGrid): boolean => grid.every((row) => row.every((cell) => cell !== ""));

const solveWithMetrics = (grid: SudokuGrid): {
  solved: boolean;
  backtrackingNodes: number;
  backtrackingDepth: number;
  backtrackingCount: number;
} => {
  const workingGrid = cloneGrid(grid);
  let nodes = 0;
  let maxDepth = 0;
  let backtracks = 0;

  const search = (depth: number): boolean => {
    nodes += 1;
    maxDepth = Math.max(maxDepth, depth);
    const emptyCell = findBestEmptyCell(workingGrid);
    if (!emptyCell) {
      return true;
    }

    const [row, col] = emptyCell;
    const candidates = getCandidates(workingGrid, row, col);
    if (candidates.length === 0) {
      backtracks += 1;
      return false;
    }

    for (const candidate of candidates) {
      workingGrid[row][col] = candidate;
      if (search(depth + 1)) {
        return true;
      }
    }

    workingGrid[row][col] = "";
    backtracks += 1;
    return false;
  };

  const solved = search(0);
  return {
    solved,
    backtrackingNodes: nodes,
    backtrackingDepth: maxDepth,
    backtrackingCount: backtracks,
  };
};

export const solveDeterministicallyWithMetrics = (grid: SudokuGrid): DifficultyReport => {
  const workingGrid = cloneGrid(grid);
  let singlesApplied = 0;
  let hiddenSinglesApplied = 0;
  let nakedPairsApplied = 0;
  let strongestTechnique: TechniqueName = "nakedSingle";

  let changed = true;
  while (changed && !isSolved(workingGrid)) {
    changed = false;

    const singles = applyNakedSingles(workingGrid);
    if (singles > 0) {
      singlesApplied += singles;
      strongestTechnique = "nakedSingle";
      changed = true;
    }

    const hiddenSingles = applyHiddenSingles(workingGrid);
    if (hiddenSingles > 0) {
      hiddenSinglesApplied += hiddenSingles;
      strongestTechnique = "hiddenSingle";
      changed = true;
    }

    const pairs = applyNakedPairs(workingGrid);
    if (pairs > 0) {
      nakedPairsApplied += pairs;
      strongestTechnique = "nakedPair";
      changed = true;
    }
  }

  const backtracking = solveWithMetrics(workingGrid);
  if (!isSolved(workingGrid) || !backtracking.solved) {
    strongestTechnique = "backtracking";
  }

  const label: SudokuDifficulty =
    strongestTechnique === "nakedSingle" && backtracking.backtrackingCount <= 2
      ? "Easy"
      : strongestTechnique === "hiddenSingle" && backtracking.backtrackingCount <= 10
      ? "Medium"
      : strongestTechnique === "nakedPair" || backtracking.backtrackingCount <= 40
      ? "Hard"
      : "Expert";

  return {
    label,
    strongestTechnique,
    singlesApplied,
    hiddenSinglesApplied,
    nakedPairsApplied,
    backtrackingNodes: backtracking.backtrackingNodes,
    backtrackingDepth: backtracking.backtrackingDepth,
    backtrackingCount: backtracking.backtrackingCount,
  };
};

const toTechniqueLabel = (technique: TechniqueName): string => {
  if (technique === "nakedSingle") {
    return "Naked Singles";
  }
  if (technique === "hiddenSingle") {
    return "Hidden Singles";
  }
  if (technique === "nakedPair") {
    return "Naked Pairs";
  }
  return "Backtracking Search";
};

export const getDifficultyDetails = (report: DifficultyReport): DifficultyDetails => {
  const deterministicSteps = report.singlesApplied + report.hiddenSinglesApplied + report.nakedPairsApplied;
  const searchSteps = report.backtrackingCount;
  const estimatedSteps = deterministicSteps + searchSteps;
  const techniqueLabel = toTechniqueLabel(report.strongestTechnique);
  const reasoning =
    report.strongestTechnique === "backtracking"
      ? "Requires search after standard logic techniques stall."
      : `Solved mostly with ${techniqueLabel.toLowerCase()}.`;

  return {
    techniqueLabel,
    estimatedSteps,
    reasoning,
  };
};

const removeCluesWhileUnique = (solutionGrid: SudokuGrid, minClues = 26): SudokuGrid => {
  const puzzle = cloneGrid(solutionGrid);
  const cellOrder = shuffle(Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index));

  for (const index of cellOrder) {
    if (countClues(puzzle) <= minClues) {
      break;
    }
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const previous = puzzle[row][col];
    if (previous === "") {
      continue;
    }

    puzzle[row][col] = "";
    if (!hasUniqueSolution(puzzle)) {
      puzzle[row][col] = previous;
    }
  }

  return puzzle;
};

export const generatePuzzleCandidate = (): GeneratedPuzzle => {
  const solution = generateSolvedGrid();
  const puzzle = removeCluesWhileUnique(solution);
  const difficulty = solveDeterministicallyWithMetrics(puzzle);
  return {
    puzzle,
    solution,
    clueCount: countClues(puzzle),
    difficulty,
  };
};

export const generatePuzzleChoices = (count = 3, maxAttempts = 30): GeneratedPuzzle[] => {
  const candidates: GeneratedPuzzle[] = [];
  let attempts = 0;

  while (candidates.length < count && attempts < maxAttempts) {
    attempts += 1;
    const candidate = generatePuzzleCandidate();
    const serializedPuzzle = JSON.stringify(candidate.puzzle);
    const alreadyAdded = candidates.some((item) => JSON.stringify(item.puzzle) === serializedPuzzle);
    if (!alreadyAdded) {
      candidates.push(candidate);
    }
  }

  return candidates;
};
