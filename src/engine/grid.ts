import {
  ALL_BLOCK_COLORS,
  type BlockColor,
  type CellBlock,
  type ColorSlotIndex,
  type FlipOrientation,
  type LevelConfig,
  type ShiftAction,
} from './types';

/**
 * Cyclically shifts a row left or right by `distance` slots with toroidal wrap-around.
 */
export function shiftRow<T>(
  grid: T[][],
  rowIndex: number,
  direction: 'left' | 'right',
  distance = 1
): T[][] {
  if (rowIndex < 0 || rowIndex >= grid.length) return grid;
  const cols = grid[0].length;
  const k = ((distance % cols) + cols) % cols;
  if (k === 0) return grid;
  const nextGrid = grid.map((row) => [...row]);
  const currentRow = grid[rowIndex];
  for (let c = 0; c < cols; c++) {
    const srcCol =
      direction === 'left' ? (c + k) % cols : (c - k + cols) % cols;
    nextGrid[rowIndex][c] = currentRow[srcCol];
  }
  return nextGrid;
}

/**
 * Cyclically shifts a column up or down by `distance` slots with toroidal wrap-around.
 */
export function shiftCol<T>(
  grid: T[][],
  colIndex: number,
  direction: 'up' | 'down',
  distance = 1
): T[][] {
  const rows = grid.length;
  if (rows === 0) return grid;
  const cols = grid[0].length;
  if (colIndex < 0 || colIndex >= cols) return grid;
  const k = ((distance % rows) + rows) % rows;
  if (k === 0) return grid;
  const nextGrid = grid.map((row) => [...row]);
  for (let r = 0; r < rows; r++) {
    const srcRow =
      direction === 'up' ? (r + k) % rows : (r - k + rows) % rows;
    nextGrid[r][colIndex] = grid[srcRow][colIndex];
  }
  return nextGrid;
}

/**
 * Applies a ShiftAction to any 2D matrix (CellBlock[][] or ColorSlotIndex[][]).
 */
export function applyShiftAction<T>(grid: T[][], action: ShiftAction): T[][] {
  if (action.axis === 'row') {
    const dir = action.direction === 'left' ? 'left' : 'right';
    return shiftRow(grid, action.index, dir, action.distance);
  }
  const dir = action.direction === 'up' ? 'up' : 'down';
  return shiftCol(grid, action.index, dir, action.distance);
}

/**
 * Returns the inverse ShiftAction that undoes `action` on a `rows x cols` board.
 */
export function invertShiftAction(action: ShiftAction, rows: number, cols: number): ShiftAction {
  if (action.axis === 'row') {
    const k = ((action.distance % cols) + cols) % cols;
    return {
      axis: 'row',
      index: action.index,
      direction: action.direction === 'left' ? 'right' : 'left',
      distance: k,
    };
  }
  const k = ((action.distance % rows) + rows) % rows;
  return {
    axis: 'col',
    index: action.index,
    direction: action.direction === 'up' ? 'down' : 'up',
    distance: k,
  };
}

/**
 * Evaluates frame-snap progress and win state using interchangeable color equality.
 * Works on both hydrated (`CellBlock` vs `BlockColor | null`) and slot-indexed (`ColorSlotIndex`) matrices.
 */
export function getSnapProgress<B, F>(
  grid: B[][],
  frames: (F | null)[][]
): { matchedSlots: number; totalSlots: number; isSolved: boolean } {
  let matchedSlots = 0;
  let totalSlots = 0;
  for (let r = 0; r < frames.length; r++) {
    for (let c = 0; c < frames[r].length; c++) {
      const targetColor = frames[r][c];
      if (targetColor !== null && targetColor !== ('neutral' as unknown as F)) {
        totalSlots++;
        if ((grid[r]?.[c] as unknown) === (targetColor as unknown)) {
          matchedSlots++;
        }
      }
    }
  }
  return {
    matchedSlots,
    totalSlots,
    isSolved: totalSlots > 0 && matchedSlots === totalSlots,
  };
}

/**
 * Checks whether two 2D grids have identical cell values at every coordinate.
 */
export function gridsEqual<T>(a: T[][], b: T[][]): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/**
 * Deep-clones a 2D matrix.
 */
export function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}

/**
 * Serializes a 2D matrix into a compact canonical string key for visited-set hashing.
 */
export function serializeGrid<T>(grid: T[][]): string {
  return grid
    .map((row) => row.map((cell) => (cell === null || cell === 'neutral' ? '.' : String(cell))).join(','))
    .join(';');
}

/**
 * Hydrates a LevelConfig's abstract ColorSlotIndex (0..K-1) into a randomized session palette of BlockColors.
 */
export function hydrateLevelColors(
  level: LevelConfig,
  customRng: () => number = Math.random
): {
  frames: (BlockColor | null)[][];
  grid: CellBlock[][];
  sessionPalette: BlockColor[];
} {
  const pool = [...ALL_BLOCK_COLORS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(customRng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const colorCount = Math.max(1, Math.min(pool.length, level.colorCount || 1));
  const sessionPalette = pool.slice(0, colorCount);

  const frames: (BlockColor | null)[][] = level.frames.map((row) =>
    row.map((slot) => (slot !== null && slot >= 0 ? sessionPalette[slot % colorCount] : null))
  );

  const grid: CellBlock[][] = level.initialGrid.map((row) =>
    row.map((slot) =>
      slot !== null && slot >= 0 ? sessionPalette[slot % colorCount] : 'neutral'
    )
  );

  return { frames, grid, sessionPalette };
}

/**
 * Deterministically maps a LevelConfig's slots (0..7) directly to ALL_BLOCK_COLORS[slot]
 * (used by the Level Editor so brush colors remain stable while editing).
 */
export function hydrateEditorColors(level: {
  frames: ColorSlotIndex[][];
  initialGrid: ColorSlotIndex[][];
}): {
  frames: (BlockColor | null)[][];
  grid: CellBlock[][];
} {
  const frames: (BlockColor | null)[][] = level.frames.map((row) =>
    row.map((slot) =>
      slot !== null && slot >= 0 && slot < ALL_BLOCK_COLORS.length
        ? ALL_BLOCK_COLORS[slot]
        : null
    )
  );
  const grid: CellBlock[][] = level.initialGrid.map((row) =>
    row.map((slot) =>
      slot !== null && slot >= 0 && slot < ALL_BLOCK_COLORS.length
        ? ALL_BLOCK_COLORS[slot]
        : 'neutral'
    )
  );
  return { frames, grid };
}

/**
 * Normalizes editor `BlockColor` placements into contiguous abstract slot indices `0 .. K-1`
 * when saving to `src/config/levels.json`.
 */
export function normalizeEditorColors(
  frames: (BlockColor | null)[][],
  grid: CellBlock[][]
): {
  colorCount: number;
  normalizedFrames: ColorSlotIndex[][];
  normalizedGrid: ColorSlotIndex[][];
} {
  const colorToSlot = new Map<BlockColor, number>();
  for (let r = 0; r < frames.length; r++) {
    for (let c = 0; c < frames[r].length; c++) {
      const f = frames[r][c];
      if (f !== null && !colorToSlot.has(f)) {
        colorToSlot.set(f, colorToSlot.size);
      }
    }
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const b = grid[r][c];
      if (b !== 'neutral' && !colorToSlot.has(b)) {
        colorToSlot.set(b, colorToSlot.size);
      }
    }
  }

  const normalizedFrames: ColorSlotIndex[][] = frames.map((row) =>
    row.map((f) => (f !== null ? (colorToSlot.get(f) ?? null) : null))
  );
  const normalizedGrid: ColorSlotIndex[][] = grid.map((row) =>
    row.map((b) => (b !== 'neutral' ? (colorToSlot.get(b) ?? null) : null))
  );

  return {
    colorCount: colorToSlot.size,
    normalizedFrames,
    normalizedGrid,
  };
}

/**
 * Reverses columns in each row (left-to-right reflection).
 */
export function flipGridHorizontal<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row].reverse());
}

/**
 * Reverses order of rows (up-to-down reflection).
 */
export function flipGridVertical<T>(grid: T[][]): T[][] {
  return [...grid].reverse().map((row) => [...row]);
}

/**
 * Reverses both rows and columns (180-degree rotation / central inversion).
 */
export function flipGridBoth<T>(grid: T[][]): T[][] {
  return [...grid].reverse().map((row) => [...row].reverse());
}

/**
 * Transforms a LevelConfig by flipping both its target frames and initial blocks.
 * Solvability and par moves remain 100% invariant under all 3 orientations.
 */
export function flipLevelConfig(
  level: LevelConfig,
  mode: FlipOrientation
): LevelConfig {
  let nextFrames: ColorSlotIndex[][];
  let nextGrid: ColorSlotIndex[][];

  switch (mode) {
    case 'horizontal':
      nextFrames = flipGridHorizontal(level.frames);
      nextGrid = flipGridHorizontal(level.initialGrid);
      break;
    case 'vertical':
      nextFrames = flipGridVertical(level.frames);
      nextGrid = flipGridVertical(level.initialGrid);
      break;
    case 'both':
      nextFrames = flipGridBoth(level.frames);
      nextGrid = flipGridBoth(level.initialGrid);
      break;
  }

  return {
    ...level,
    frames: nextFrames,
    initialGrid: nextGrid,
  };
}

/**
 * Computes a deterministic pseudo-random flip orientation ('horizontal' | 'vertical' | 'both')
 * derived from the repeating level's id. Retrying the same level produces the exact same orientation.
 */
export function getDeterministicFlipMode(levelId: number): FlipOrientation {
  let h = Math.imul(Math.max(1, Math.floor(levelId)), 0x5bd1e995);
  h ^= h >>> 15;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 13;
  const mod = Math.abs(h % 3);
  if (mod === 0) return 'horizontal';
  if (mod === 1) return 'vertical';
  return 'both';
}

/**
 * Looks up the LevelConfig for 1-indexed `levelId`.
 * Once `levelId > levels.length`, repeats levels according to `campaignLoop`
 * (an explicit array of level IDs or numeric window size) and deterministically flips the board.
 */
export function getLevelConfig(
  levelId: number,
  levels: LevelConfig[],
  campaignLoop: number[] | number = 10
): LevelConfig {
  const N = levels.length;
  if (N === 0) {
    throw new Error('levels.json is empty');
  }
  const safeId = Math.max(1, Math.floor(levelId));
  if (safeId <= N) {
    return levels[safeId - 1];
  }

  let targetLevel: LevelConfig;

  if (Array.isArray(campaignLoop) && campaignLoop.length > 0) {
    const offset = (safeId - N - 1) % campaignLoop.length;
    const targetId = campaignLoop[offset];
    const found = levels.find((l) => l.id === targetId);
    if (found) {
      targetLevel = found;
    } else {
      const fallbackIdx = ((targetId - 1) % N + N) % N;
      targetLevel = levels[fallbackIdx];
    }
  } else {
    const loopSize =
      typeof campaignLoop === 'number' && campaignLoop > 0 ? campaignLoop : 10;
    const windowSize = Math.min(loopSize, N);
    const startIndex = N - windowSize;
    const offset = (safeId - N - 1) % windowSize;
    targetLevel = levels[startIndex + offset];
  }

  const flipMode = getDeterministicFlipMode(safeId);
  return flipLevelConfig(targetLevel, flipMode);
}

