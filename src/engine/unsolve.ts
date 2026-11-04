import {
  applyShiftAction,
  cloneGrid,
  getSnapProgress,
  gridsEqual,
  invertShiftAction,
  serializeGrid,
} from './grid';
import { getCandidateActions, solveIDAStar } from './solver';
import type { BlockColor, CellBlock, ColorSlotIndex, ShiftAction } from './types';

/**
 * Deterministic 32-bit PRNG (`mulberry32`) returning floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface AutoUnsolveResult<T> {
  grid: T[][];
  unsolveActions: ShiftAction[];
  inverseSolution: ShiftAction[];
  matchedSlots: number;
  totalSlots: number;
  parMoves: number;
  seed: number;
}

/**
 * Converts a frame matrix into its solved starting grid before scrambling.
 */
function framesToInitialSolvedGrid<F>(
  frames: (F | null)[][],
  neutralValue: F | null
): (F | null)[][] {
  return frames.map((row) =>
    row.map((cell) => (cell === null ? neutralValue : cell))
  );
}

/**
 * Smart `Auto-Unsolve in X Steps` engine implementing all 4 rules from `docs/level-design.md` §4.2:
 * 1. No consecutive steps on the same `(axis, index)`.
 * 2. Every step must mutate the board's color arrangement (`!gridsEqual(nextGrid, currentGrid)`).
 * 3. No accidental intermediate re-solve (`!isSolved`) and no revisiting an earlier board state.
 * 4. Multi-block same-color disjointness on step `X` (`matchedSlots === 0` target, maximizing `parMoves`).
 */
export function autoUnsolve<B, F>(
  frames: (F | null)[][],
  steps: number,
  seed: number = Math.floor(Math.random() * 1000000),
  neutralValue: B = 'neutral' as unknown as B
): AutoUnsolveResult<B> {
  const rows = frames.length;
  const cols = frames[0]?.length ?? 0;
  const solvedGrid = framesToInitialSolvedGrid(
    frames,
    neutralValue as unknown as F | null
  ) as unknown as B[][];

  const targetSteps = Math.max(1, Math.min(10, Math.floor(steps)));
  const rng = mulberry32(seed);

  let bestGrid: B[][] = cloneGrid(solvedGrid);
  let bestActions: ShiftAction[] = [];
  let bestMatchedSlots = Infinity;
  let bestParMoves = -1;

  const maxTrials = 80;

  for (let trial = 0; trial < maxTrials; trial++) {
    let currentGrid = cloneGrid(solvedGrid);
    const seenStates = new Set<string>([serializeGrid(currentGrid)]);
    const actionsTaken: ShiftAction[] = [];
    let lastAxis: 'row' | 'col' | null = null;
    let lastIndex = -1;
    let validWalk = true;

    for (let stepIdx = 0; stepIdx < targetSteps; stepIdx++) {
      // Gather candidate shifts obeying Rules 1, 2, and 3
      const candidates = getCandidateActions(currentGrid).filter((action) => {
        // Rule 1: No consecutive steps on the same row or column
        if (action.axis === lastAxis && action.index === lastIndex) {
          return false;
        }
        const nextGrid = applyShiftAction(currentGrid, action);
        // Rule 2: Must mutate board color state (guaranteed by getCandidateActions, double-checked)
        if (gridsEqual(nextGrid, currentGrid)) {
          return false;
        }
        // Rule 3: No accidental intermediate re-solve or revisiting earlier state
        const progress = getSnapProgress(nextGrid, frames);
        if (progress.isSolved) {
          return false;
        }
        const key = serializeGrid(nextGrid);
        if (seenStates.has(key)) {
          return false;
        }
        return true;
      });

      if (candidates.length === 0) {
        validWalk = false;
        break;
      }

      // On the final step (`stepIdx === targetSteps - 1`), prioritize candidates that yield `matchedSlots === 0`
      let pool = candidates;
      if (stepIdx === targetSteps - 1) {
        const zeroMatchCandidates = candidates.filter((action) => {
          const nextGrid = applyShiftAction(currentGrid, action);
          return getSnapProgress(nextGrid, frames).matchedSlots === 0;
        });
        if (zeroMatchCandidates.length > 0) {
          pool = zeroMatchCandidates;
        }
      }

      const chosen = pool[Math.floor(rng() * pool.length)];
      currentGrid = applyShiftAction(currentGrid, chosen);
      seenStates.add(serializeGrid(currentGrid));
      actionsTaken.push(chosen);
      lastAxis = chosen.axis;
      lastIndex = chosen.index;
    }

    if (!validWalk || actionsTaken.length === 0) continue;

    const { matchedSlots, isSolved } = getSnapProgress(currentGrid, frames);
    if (isSolved) continue;

    // Evaluate true par moves on promising candidates (fast 25ms check per candidate)
    const parCheck =
      targetSteps <= 4
        ? solveIDAStar(currentGrid, frames, 25, targetSteps)
        : { parMoves: targetSteps };
    const candidatePar = parCheck.parMoves || actionsTaken.length;

    const isBetter =
      matchedSlots < bestMatchedSlots ||
      (matchedSlots === bestMatchedSlots && candidatePar > bestParMoves);

    if (isBetter) {
      bestGrid = currentGrid;
      bestActions = actionsTaken;
      bestMatchedSlots = matchedSlots;
      bestParMoves = candidatePar;

      // Early exit if we achieved 0 pre-matched frames AND full par depth === targetSteps
      if (bestMatchedSlots === 0 && bestParMoves >= targetSteps) {
        break;
      }
    }
  }

  const finalProgress = getSnapProgress(bestGrid, frames);
  const inverseSolution = [...bestActions]
    .reverse()
    .map((a) => invertShiftAction(a, rows, cols));

  // Run one final accurate par calculation on the winning scramble
  const finalSolve = solveIDAStar(bestGrid, frames, 120, Math.max(targetSteps, 6));
  const verifiedPar = finalSolve.solved
    ? finalSolve.parMoves
    : inverseSolution.length;

  return {
    grid: bestGrid,
    unsolveActions: bestActions,
    inverseSolution: finalSolve.solved ? finalSolve.actions : inverseSolution,
    matchedSlots: finalProgress.matchedSlots,
    totalSlots: finalProgress.totalSlots,
    parMoves: verifiedPar,
    seed,
  };
}

export type HydratedFrames = (BlockColor | null)[][];
export type HydratedGrid = CellBlock[][];
export type SlotFrames = ColorSlotIndex[][];

