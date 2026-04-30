import { type SudokuDifficulty, type SudokuGrid } from "./puzzle-engine";

export type SudokuGameStatus = "in-progress" | "completed";

export type SudokuGameRecord = {
  id: string;
  puzzle: SudokuGrid;
  solution: SudokuGrid;
  currentGrid: SudokuGrid;
  difficulty: SudokuDifficulty;
  startedAt: string;
  completedAt: string | null;
  elapsedSeconds: number;
  status: SudokuGameStatus;
  clueCount: number;
  strongestTechnique: string;
  estimatedSteps: number;
};

type SudokuStorageState = {
  activeGameId: string | null;
  records: SudokuGameRecord[];
};

const STORAGE_KEY = "sudoku-game-state-v1";

const buildInitialState = (): SudokuStorageState => ({
  activeGameId: null,
  records: [],
});

const isBrowser = (): boolean => typeof window !== "undefined";

const parseState = (value: string | null): SudokuStorageState => {
  if (!value) {
    return buildInitialState();
  }

  try {
    const parsed = JSON.parse(value) as Partial<SudokuStorageState>;
    if (!Array.isArray(parsed.records)) {
      return buildInitialState();
    }
    const activeGameId =
      typeof parsed.activeGameId === "string" || parsed.activeGameId === null ? parsed.activeGameId : null;
    const normalizedRecords = (parsed.records as Partial<SudokuGameRecord>[]).map((record) => ({
      id: String(record.id ?? `legacy-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      puzzle: (record.puzzle ?? []) as SudokuGrid,
      solution: (record.solution ?? []) as SudokuGrid,
      currentGrid: (record.currentGrid ?? record.puzzle ?? []) as SudokuGrid,
      difficulty: (record.difficulty ?? "Medium") as SudokuDifficulty,
      startedAt: String(record.startedAt ?? new Date().toISOString()),
      completedAt: record.completedAt ?? null,
      elapsedSeconds: typeof record.elapsedSeconds === "number" ? record.elapsedSeconds : 0,
      status: (record.status ?? "in-progress") as SudokuGameStatus,
      clueCount: typeof record.clueCount === "number" ? record.clueCount : 0,
      strongestTechnique: String(record.strongestTechnique ?? "Unknown"),
      estimatedSteps: typeof record.estimatedSteps === "number" ? record.estimatedSteps : 0,
    }));

    return {
      activeGameId,
      records: normalizedRecords,
    };
  } catch {
    return buildInitialState();
  }
};

export const loadSudokuState = (): SudokuStorageState => {
  if (!isBrowser()) {
    return buildInitialState();
  }
  return parseState(window.localStorage.getItem(STORAGE_KEY));
};

export const saveSudokuState = (state: SudokuStorageState): void => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const upsertRecord = (record: SudokuGameRecord): SudokuStorageState => {
  const state = loadSudokuState();
  const existingIndex = state.records.findIndex((item) => item.id === record.id);
  const nextRecords = state.records.slice();

  if (existingIndex === -1) {
    nextRecords.unshift(record);
  } else {
    nextRecords[existingIndex] = record;
  }

  const nextState: SudokuStorageState = {
    activeGameId: record.status === "completed" ? null : record.id,
    records: nextRecords,
  };
  saveSudokuState(nextState);
  return nextState;
};

export const setActiveGame = (gameId: string | null): SudokuStorageState => {
  const state = loadSudokuState();
  const nextState: SudokuStorageState = {
    ...state,
    activeGameId: gameId,
  };
  saveSudokuState(nextState);
  return nextState;
};

export const deleteRecord = (gameId: string): SudokuStorageState => {
  const state = loadSudokuState();
  const nextState: SudokuStorageState = {
    activeGameId: state.activeGameId === gameId ? null : state.activeGameId,
    records: state.records.filter((record) => record.id !== gameId),
  };
  saveSudokuState(nextState);
  return nextState;
};

export const getActiveGameRecord = (): SudokuGameRecord | null => {
  const state = loadSudokuState();
  if (!state.activeGameId) {
    return null;
  }
  return state.records.find((record) => record.id === state.activeGameId) ?? null;
};

export const getLatestInProgressGame = (): SudokuGameRecord | null => {
  const state = loadSudokuState();
  return state.records.find((record) => record.status === "in-progress") ?? null;
};
