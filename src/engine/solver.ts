import {
  applyShiftAction,
  getSnapProgress,
  gridsEqual,
  serializeGrid,
} from './grid';
import type { BlockColor, CellBlock, ColorSlotIndex, ShiftAction } from './types';

/**
 * Converts a frame matrix into its corresponding canonical solved block matrix.
 */
export function buildSolvedGridFromFrames(
  frames: (BlockColor | ColorSlotIndex)[][]
): (CellBlock | ColorSlotIndex)[][] {
  return frames.map((row) =>
    row.map((f) => {
      if (f === null) {
        return 'neutral';
      }
      return f;
    })
  );
}

/**
 * Strictly admissible lower-bound heuristic for IDA* on the toroidal grid:
 * 1. If all cells match, 0 moves are needed.
 * 2. Any single move shifts either 1 row (at most `cols` cells) or 1 column (at most `rows` cells).
 *    - If mismatches span >1 row AND >1 column, a single line shift cannot touch all mismatched cells, so >= 2 moves are required.
 *    - Furthermore, each move can fix at most `max(rows, cols)` mismatched cells, so `ceil(mismatchedCells / max(rows, cols))` is a strict lower bound.
 */
export function lineCoverHeuristic<B, F>(
  grid: B[][],
  frames: (F | null)[][]
): number {
  const rows = grid.length;
  if (rows === 0) return 0;
  const cols = grid[0].length;
  let rowMask = 0;
  let colMask = 0;
  let mismatchedCells = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const target = frames[r][c];
      const cell = grid[r][c];
      const cellIsNeutral = cell === null || (cell as unknown) === 'neutral';
      const targetIsNeutral = target === null || (target as unknown) === 'neutral';

      const matches =
        (cellIsNeutral && targetIsNeutral) ||
        (!cellIsNeutral && !targetIsNeutral && (cell as unknown) === (target as unknown));

      if (!matches) {
        mismatchedCells++;
        rowMask |= 1 << r;
        colMask |= 1 << c;
      }
    }
  }

  if (mismatchedCells === 0) return 0;

  let diffRows = 0;
  let rm = rowMask;
  while (rm) {
    diffRows += rm & 1;
    rm >>= 1;
  }

  let diffCols = 0;
  let cm = colMask;
  while (cm) {
    diffCols += cm & 1;
    cm >>= 1;
  }

  const maxLineLen = Math.max(rows, cols);
  const cellBound = Math.ceil(mismatchedCells / maxLineLen);
  const lineBound = diffRows > 1 && diffCols > 1 ? 2 : 1;

  return Math.max(lineBound, cellBound);
}

/**
 * Generates all valid canonical single-line shifts for a `rows x cols` board
 * that actually mutate the board's color arrangement.
 * Normalizes shifts of distance `k > floor(L/2)` into opposite-direction shifts of `L - k`
 * so the returned `ShiftAction` always uses the shortest human-intuitive slide direction!
 */
export function getCandidateActions<T>(grid: T[][]): ShiftAction[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const actions: ShiftAction[] = [];

  // Row shifts
  for (let r = 0; r < rows; r++) {
    for (let k = 1; k < cols; k++) {
      // Shift right by k; if k > cols / 2, represent as left by (cols - k)
      const useLeft = k > cols - k;
      const action: ShiftAction = useLeft
        ? { axis: 'row', index: r, direction: 'left', distance: cols - k }
        : { axis: 'row', index: r, direction: 'right', distance: k };

      const nextGrid = applyShiftAction(grid, action);
      if (!gridsEqual(nextGrid, grid)) {
        actions.push(action);
      }
    }
  }

  // Column shifts
  for (let c = 0; c < cols; c++) {
    for (let k = 1; k < rows; k++) {
      const useUp = k > rows - k;
      const action: ShiftAction = useUp
        ? { axis: 'col', index: c, direction: 'up', distance: rows - k }
        : { axis: 'col', index: c, direction: 'down', distance: k };

      const nextGrid = applyShiftAction(grid, action);
      if (!gridsEqual(nextGrid, grid)) {
        actions.push(action);
      }
    }
  }

  return actions;
}

export interface SolveResult {
  solved: boolean;
  optimal: boolean;
  actions: ShiftAction[];
  parMoves: number;
}

/**
 * Greedy 1-step or 2-step fallback used when an ultra-deep board exceeds the live frame budget.
 */
function findGreedyBestAction<B, F>(
  grid: B[][],
  frames: (F | null)[][]
): ShiftAction[] {
  const candidates = getCandidateActions(grid);
  if (candidates.length === 0) return [];

  let bestAction = candidates[0];
  let bestScore = -Infinity;

  for (const action of candidates) {
    const nextGrid = applyShiftAction(grid, action);
    const { matchedSlots, isSolved } = getSnapProgress(nextGrid, frames);
    if (isSolved) return [action];
    const h = lineCoverHeuristic(nextGrid, frames);
    const score = matchedSlots * 10 - h * 4;
    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return [bestAction];
}

/**
 * Hybrid IDA* Solver for Grid Snap.
 * Finds the shortest sequence of line shifts (`ShiftAction[]`) that snaps all frames.
 */
export function solveIDAStar<B, F>(
  grid: B[][],
  frames: (F | null)[][],
  maxTimeMs = 200,
  maxDepth = 8
): SolveResult {
  const initialProgress = getSnapProgress(grid, frames);
  if (initialProgress.isSolved) {
    return { solved: true, optimal: true, actions: [], parMoves: 0 };
  }

  const startTime = performance.now();
  let timedOut = false;

  let bound = Math.max(1, lineCoverHeuristic(grid, frames));
  const path: ShiftAction[] = [];
  const pathGrids = new Set<string>([serializeGrid(grid)]);

  const dfs = (
    currentGrid: B[][],
    g: number,
    threshold: number,
    lastAxis: 'row' | 'col' | null,
    lastIndex: number
  ): number => {
    if (performance.now() - startTime > maxTimeMs) {
      timedOut = true;
      return Infinity;
    }

    const h = lineCoverHeuristic(currentGrid, frames);
    const f = g + h;
    if (f > threshold) return f;
    if (h === 0 && getSnapProgress(currentGrid, frames).isSolved) {
      return -1; // Found!
    }

    let minOver = Infinity;
    const actions = getCandidateActions(currentGrid);

    // Order candidates by heuristic + matchedSlots for faster pruning
    const scored = actions
      .filter((a) => !(a.axis === lastAxis && a.index === lastIndex))
      .map((action) => {
        const nextGrid = applyShiftAction(currentGrid, action);
        const nextH = lineCoverHeuristic(nextGrid, frames);
        const { matchedSlots } = getSnapProgress(nextGrid, frames);
        return { action, nextGrid, nextH, matchedSlots };
      })
      .sort((a, b) => a.nextH - b.nextH || b.matchedSlots - a.matchedSlots);

    for (const item of scored) {
      const key = serializeGrid(item.nextGrid);
      if (pathGrids.has(key)) continue;

      path.push(item.action);
      pathGrids.add(key);

      const t = dfs(
        item.nextGrid,
        g + 1,
        threshold,
        item.action.axis,
        item.action.index
      );

      if (t === -1) return -1;
      if (t < minOver) minOver = t;

      path.pop();
      pathGrids.delete(key);

      if (timedOut) return Infinity;
    }

    return minOver;
  };

  while (bound <= maxDepth) {
    const t = dfs(grid, 0, bound, null, -1);
    if (t === -1) {
      return {
        solved: true,
        optimal: true,
        actions: [...path],
        parMoves: path.length,
      };
    }
    if (timedOut || t === Infinity) break;
    bound = t;
  }

  // Fallback to greedy 1-step move if time budget or maxDepth expired
  const fallback = findGreedyBestAction(grid, frames);
  return {
    solved: false,
    optimal: false,
    actions: fallback,
    parMoves: fallback.length,
  };
}

/**
 * Computes exact minimum moves (`parMoves`) for the Level Editor with a generous time budget.
 */
export function solveParMoves<B, F>(
  grid: B[][],
  frames: (F | null)[][],
  maxTimeMs = 650,
  maxDepth = 8
): SolveResult {
  return solveIDAStar(grid, frames, maxTimeMs, maxDepth);
}

/**
 * Recommends a balanced stage timer (`timeLimitSeconds`) from `parMoves` and grid dimensions.
 */
export function computeSuggestedTime(
  parMoves: number,
  rows: number,
  cols: number
): number {
  const raw = Math.max(1, parMoves) * 6 + rows * cols;
  return Math.max(20, Math.ceil(raw / 5) * 5);
}
