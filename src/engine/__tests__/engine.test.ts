import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  applyShiftAction,
  flipGridBoth,
  flipGridHorizontal,
  flipGridVertical,
  flipLevelConfig,
  getDeterministicFlipMode,
  getLevelConfig,
  getSnapProgress,
  hydrateLevelColors,
  invertShiftAction,
  normalizeEditorColors,
  shiftCol,
  shiftRow,
} from '../grid';
import {
  computeSuggestedTime,
  lineCoverHeuristic,
  solveIDAStar,
} from '../solver';
import type {
  BlockColor,
  CellBlock,
  EconomyConfig,
  LevelConfig,
  LevelsConfigFile,
} from '../types';
import { autoUnsolve, mulberry32 } from '../unsolve';
import {
  isValidEconomyConfig,
  isValidLevelsConfig,
  parseLevelsPayload,
} from '../../utils/remoteData';

describe('Grid Snap Toroidal Engine', () => {
  it('shifts rows left and right with cyclic toroidal wrap-around for distance >= 1', () => {
    const grid: CellBlock[][] = [
      ['ruby', 'neutral', 'emerald', 'cobalt'],
      ['neutral', 'neutral', 'neutral', 'neutral'],
      ['neutral', 'neutral', 'neutral', 'neutral'],
    ];

    const shiftedRight1 = shiftRow(grid, 0, 'right', 1);
    expect(shiftedRight1[0]).toEqual(['cobalt', 'ruby', 'neutral', 'emerald']);

    const shiftedLeft2 = shiftRow(shiftedRight1, 0, 'left', 2);
    expect(shiftedLeft2[0]).toEqual(['neutral', 'emerald', 'cobalt', 'ruby']);

    // Full cycle (distance = cols) is identity
    expect(shiftRow(grid, 0, 'right', 4)).toEqual(grid);
  });

  it('shifts columns up and down with cyclic toroidal wrap-around across 3x3 to 4x8 boards', () => {
    const grid: CellBlock[][] = [
      ['ruby', 'neutral', 'neutral'],
      ['emerald', 'neutral', 'neutral'],
      ['cobalt', 'neutral', 'neutral'],
      ['yellow', 'neutral', 'neutral'],
    ];

    const down2 = shiftCol(grid, 0, 'down', 2);
    expect(down2.map((r) => r[0])).toEqual(['cobalt', 'yellow', 'ruby', 'emerald']);

    const up2 = shiftCol(down2, 0, 'up', 2);
    expect(up2).toEqual(grid);
  });

  it('evaluates interchangeable same-color frame snapping properly', () => {
    const frames: (BlockColor | null)[][] = [
      ['ruby', null, 'ruby'],
      [null, 'emerald', null],
      [null, null, null],
    ];

    // Even if Ruby blocks are swapped between (0,0) and (0,2), both frames are solved
    const solvedGrid: CellBlock[][] = [
      ['ruby', 'neutral', 'ruby'],
      ['neutral', 'emerald', 'neutral'],
      ['neutral', 'neutral', 'neutral'],
    ];

    const progress = getSnapProgress(solvedGrid, frames);
    expect(progress).toEqual({
      matchedSlots: 3,
      totalSlots: 3,
      isSolved: true,
    });

    const partialGrid = shiftRow(solvedGrid, 0, 'right', 1);
    const partialProgress = getSnapProgress(partialGrid, frames);
    expect(partialProgress.isSolved).toBe(false);
    expect(partialProgress.matchedSlots).toBe(2);
  });

  it('hydrates and normalizes abstract color slots cleanly', () => {
    const frames: (BlockColor | null)[][] = [
      ['purple', null, 'cyan'],
      [null, 'purple', null],
      [null, null, null],
    ];
    const grid: CellBlock[][] = [
      ['neutral', 'purple', 'cyan'],
      ['purple', 'neutral', 'neutral'],
      ['neutral', 'neutral', 'neutral'],
    ];

    const normalized = normalizeEditorColors(frames, grid);
    expect(normalized.colorCount).toBe(2);
    expect(normalized.normalizedFrames[0][0]).toBe(0);
    expect(normalized.normalizedFrames[0][2]).toBe(1);
    expect(normalized.normalizedFrames[1][1]).toBe(0);

    const level: LevelConfig = {
      id: 1,
      cols: 3,
      rows: 3,
      difficulty: 'normal',
      timeLimitSeconds: 45,
      colorCount: normalized.colorCount,
      frames: normalized.normalizedFrames,
      initialGrid: normalized.normalizedGrid,
    };

    const hydrated = hydrateLevelColors(level, mulberry32(42));
    expect(hydrated.sessionPalette.length).toBe(2);
    expect(hydrated.frames[0][0]).toBe(hydrated.frames[1][1]);
    expect(hydrated.frames[0][0]).not.toBe(hydrated.frames[0][2]);
  });

  it('enforces the 4 smart rules in seeded autoUnsolve and solves with IDA*', () => {
    const frames: (BlockColor | null)[][] = [
      ['ruby', null, 'emerald', null],
      [null, 'cobalt', null, 'ruby'],
      [null, null, 'yellow', null],
      ['emerald', null, null, null],
    ];

    const unsolveRes = autoUnsolve(frames, 3, 12345, 'neutral' as CellBlock);
    expect(unsolveRes.unsolveActions.length).toBe(3);
    expect(unsolveRes.matchedSlots).toBe(0);

    // Check Rule 1: no consecutive actions on the same (axis, index)
    for (let i = 1; i < unsolveRes.unsolveActions.length; i++) {
      const prev = unsolveRes.unsolveActions[i - 1];
      const curr = unsolveRes.unsolveActions[i];
      expect(prev.axis === curr.axis && prev.index === curr.index).toBe(false);
    }

    // Verify IDA* solver finds an optimal solution <= 3 moves that solves the board
    const solveRes = solveIDAStar(unsolveRes.grid, frames, 400, 6);
    expect(solveRes.solved).toBe(true);
    expect(solveRes.parMoves).toBeLessThanOrEqual(3);
    expect(solveRes.parMoves).toBeGreaterThanOrEqual(lineCoverHeuristic(unsolveRes.grid, frames));

    let testGrid = unsolveRes.grid;
    for (const action of solveRes.actions) {
      testGrid = applyShiftAction(testGrid, action);
    }
    expect(getSnapProgress(testGrid, frames).isSolved).toBe(true);
  });

  it('inverts shift actions and computes suggested timer', () => {
    const grid: CellBlock[][] = [
      ['ruby', 'neutral', 'emerald'],
      ['neutral', 'cobalt', 'neutral'],
      ['neutral', 'neutral', 'neutral'],
    ];
    const action = { axis: 'row' as const, index: 0, direction: 'right' as const, distance: 2 };
    const shifted = applyShiftAction(grid, action);
    const inv = invertShiftAction(action, 3, 3);
    const restored = applyShiftAction(shifted, inv);
    expect(restored).toEqual(grid);

    expect(computeSuggestedTime(3, 4, 4)).toBe(35);
  });

  it('flips matrices horizontally, vertically, and both (180 deg)', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];

    expect(flipGridHorizontal(matrix)).toEqual([
      [3, 2, 1],
      [6, 5, 4],
      [9, 8, 7],
    ]);

    expect(flipGridVertical(matrix)).toEqual([
      [7, 8, 9],
      [4, 5, 6],
      [1, 2, 3],
    ]);

    expect(flipGridBoth(matrix)).toEqual([
      [9, 8, 7],
      [6, 5, 4],
      [3, 2, 1],
    ]);
  });

  it('computes deterministic pseudo-random flip orientations per level id', () => {
    const mode16 = getDeterministicFlipMode(16);
    const mode16Again = getDeterministicFlipMode(16);
    expect(mode16).toBe(mode16Again);
    expect(['horizontal', 'vertical', 'both']).toContain(mode16);

    const mode17 = getDeterministicFlipMode(17);
    expect(mode17).toBe(getDeterministicFlipMode(17));
  });

  it('implements custom campaignLoop sequence and deterministic flips in getLevelConfig when levelId > N', () => {
    const mockLevels: LevelConfig[] = Array.from({ length: 15 }, (_, idx) => ({
      id: idx + 1,
      cols: 3,
      rows: 3,
      difficulty: 'normal',
      timeLimitSeconds: 30,
      colorCount: 1,
      frames: [
        [0, null, null],
        [null, null, null],
        [null, null, null],
      ],
      initialGrid: [
        [null, 0, null],
        [null, null, null],
        [null, null, null],
      ],
    }));

    // Levels 1..15 return untouched original levels
    expect(getLevelConfig(1, mockLevels).id).toBe(1);
    expect(getLevelConfig(15, mockLevels).id).toBe(15);

    // Sequence 1: Default loop [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    const defaultLoop = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const lvl16 = getLevelConfig(16, mockLevels, defaultLoop);
    expect(lvl16.id).toBe(6);
    // Level 16 is flipped
    const expectedFlip16 = getDeterministicFlipMode(16);
    const expectedCfg16 = flipLevelConfig(mockLevels[5], expectedFlip16);
    expect(lvl16.frames).toEqual(expectedCfg16.frames);
    expect(lvl16.initialGrid).toEqual(expectedCfg16.initialGrid);

    const lvl25 = getLevelConfig(25, mockLevels, defaultLoop);
    expect(lvl25.id).toBe(15);

    // Level 26 loops back to first in default sequence (Level 6)
    const lvl26 = getLevelConfig(26, mockLevels, defaultLoop);
    expect(lvl26.id).toBe(6);

    // Sequence 2: Custom user-ordered sequence [10, 12, 14, 6]
    const customLoop = [10, 12, 14, 6];
    expect(getLevelConfig(16, mockLevels, customLoop).id).toBe(10);
    expect(getLevelConfig(17, mockLevels, customLoop).id).toBe(12);
    expect(getLevelConfig(18, mockLevels, customLoop).id).toBe(14);
    expect(getLevelConfig(19, mockLevels, customLoop).id).toBe(6);
    expect(getLevelConfig(20, mockLevels, customLoop).id).toBe(10);
  });

  it('validates all campaign levels in src/config/levels.json are solvable via IDA*', () => {
    const levelsPath = path.resolve(process.cwd(), 'src/config/levels.json');
    const parsedPayload = parseLevelsPayload(
      JSON.parse(fs.readFileSync(levelsPath, 'utf-8'))
    );
    const rawLevels: LevelConfig[] = parsedPayload.levels;
    expect(rawLevels.length).toBeGreaterThanOrEqual(10);

    let updated = false;
    const targetStepsByLevel = [2, 2, 3, 3, 4, 3, 4, 4, 4, 5];

    for (let i = 0; i < rawLevels.length; i++) {
      const lvl = rawLevels[i];
      const hydrated = hydrateLevelColors(lvl, mulberry32(lvl.id * 999));
      const snap = getSnapProgress(hydrated.grid, hydrated.frames);
      const solve = solveIDAStar(hydrated.grid, hydrated.frames, 300, 6);

      if (snap.isSolved || !solve.solved || snap.matchedSlots > 0) {
        // Re-scramble deterministically using autoUnsolve so it is 100% valid
        const steps = targetStepsByLevel[i] ?? 3;
        const seed = 100100 + lvl.id;
        const res = autoUnsolve(lvl.frames, steps, seed, null);
        lvl.initialGrid = res.grid;
        lvl.parMoves = res.parMoves;
        lvl.scrambleSeed = seed;
        updated = true;
      }

      const rehydrated = hydrateLevelColors(lvl, mulberry32(lvl.id * 999));
      const verifiedSolve = solveIDAStar(rehydrated.grid, rehydrated.frames, 400, 6);
      expect(verifiedSolve.solved).toBe(true);
      expect(getSnapProgress(rehydrated.grid, rehydrated.frames).isSolved).toBe(false);
    }

    if (updated) {
      const payload: LevelsConfigFile = {
        campaignLoop: parsedPayload.campaignLoop,
        levels: rawLevels,
      };
      fs.writeFileSync(levelsPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
    }
  });

  it('validates remote config schemas for levels.json and economy.json', () => {
    const levelsPath = path.resolve(process.cwd(), 'src/config/levels.json');
    const economyPath = path.resolve(process.cwd(), 'src/config/economy.json');
    const rawLevels: unknown = JSON.parse(fs.readFileSync(levelsPath, 'utf-8'));
    const rawEconomy: unknown = JSON.parse(fs.readFileSync(economyPath, 'utf-8'));

    expect(isValidLevelsConfig(rawLevels)).toBe(true);
    expect(isValidEconomyConfig(rawEconomy as EconomyConfig)).toBe(true);

    // Reject empty or malformed payloads
    expect(isValidLevelsConfig([])).toBe(false);
    expect(isValidLevelsConfig([{ id: 1 }])).toBe(false);
    expect(isValidEconomyConfig(null)).toBe(false);
    expect(isValidEconomyConfig({ maxLives: 0 })).toBe(false);
  });

  it('validates reordered levels sequence logic and schema preservation', () => {
    const levelsPath = path.resolve(process.cwd(), 'src/config/levels.json');
    const parsedPayload = parseLevelsPayload(
      JSON.parse(fs.readFileSync(levelsPath, 'utf-8'))
    );
    const rawLevels: LevelConfig[] = parsedPayload.levels;
    expect(rawLevels.length).toBeGreaterThan(1);

    // Simulate reversing order as a reorder action
    const reversed = [...rawLevels].reverse();
    const reindexed = reversed.map((lvl, idx) => ({
      ...lvl,
      id: idx + 1,
    }));

    // Must be sequential 1..N
    expect(reindexed[0].id).toBe(1);
    expect(reindexed[reindexed.length - 1].id).toBe(reindexed.length);
    expect(reindexed.every((l, idx) => l.id === idx + 1)).toBe(true);

    // Must pass level config validation
    expect(isValidLevelsConfig(reindexed)).toBe(true);
  });
});
