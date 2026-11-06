export type BlockColor =
  | 'ruby'
  | 'emerald'
  | 'cobalt'
  | 'yellow'
  | 'purple'
  | 'cyan'
  | 'tangerine'
  | 'onyx'
  | 'magenta';

export const ALL_BLOCK_COLORS: BlockColor[] = [
  'ruby',
  'emerald',
  'cobalt',
  'yellow',
  'purple',
  'cyan',
  'tangerine',
  'onyx',
];

export type ColorShape =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'star'
  | 'cross'
  | 'sparkle'
  | 'pentagon'
  | 'heart';

export const COLOR_SHAPE_MAP: Record<BlockColor, ColorShape> = {
  ruby: 'circle',
  emerald: 'triangle',
  cobalt: 'square',
  yellow: 'diamond',
  purple: 'star',
  cyan: 'cross',
  tangerine: 'sparkle',
  onyx: 'heart',
  magenta: 'heart',
};

export const COLOR_SHAPE_GLYPH_MAP: Record<ColorShape, string> = {
  circle: '●',
  triangle: '▲',
  square: '■',
  diamond: '◆',
  star: '★',
  cross: '✚',
  sparkle: '✦',
  pentagon: '✦',
  heart: '♥',
};

export const COLOR_HEX_MAP: Record<
  BlockColor,
  {
    base: string;
    highlight: string;
    shade: string;
    border: string;
    slotBorder: string;
    slotTint: string;
    pipFill: string;
    pipBorder: string;
  }
> = {
  ruby: {
    base: '#DC2626',
    highlight: '#FCA5A5',
    shade: '#991B1B',
    border: '#450A0A',
    slotBorder: '#B91C1C',
    slotTint: 'rgba(220, 38, 38, 0.14)',
    pipFill: '#F87171',
    pipBorder: '#991B1B',
  },
  emerald: {
    base: '#16A34A',
    highlight: '#86EFAC',
    shade: '#14532D',
    border: '#052E16',
    slotBorder: '#15803D',
    slotTint: 'rgba(22, 163, 74, 0.14)',
    pipFill: '#86EFAC',
    pipBorder: '#14532D',
  },
  cobalt: {
    base: '#1D4ED8',
    highlight: '#93C5FD',
    shade: '#1E3A8A',
    border: '#172554',
    slotBorder: '#1E40AF',
    slotTint: 'rgba(29, 78, 216, 0.14)',
    pipFill: '#60A5FA',
    pipBorder: '#1E3A8A',
  },
  yellow: {
    base: '#FACC15',
    highlight: '#FEF08A',
    shade: '#CA8A04',
    border: '#713F12',
    slotBorder: '#CA8A04',
    slotTint: 'rgba(250, 204, 21, 0.16)',
    pipFill: '#FEF08A',
    pipBorder: '#A16207',
  },
  purple: {
    base: '#7E22CE',
    highlight: '#D8B4FE',
    shade: '#581C87',
    border: '#3B0764',
    slotBorder: '#6B21A8',
    slotTint: 'rgba(126, 34, 206, 0.14)',
    pipFill: '#C084FC',
    pipBorder: '#581C87',
  },
  cyan: {
    base: '#06B6D4',
    highlight: '#A5F3FC',
    shade: '#0E7490',
    border: '#164E63',
    slotBorder: '#0891B2',
    slotTint: 'rgba(6, 182, 212, 0.14)',
    pipFill: '#A5F3FC',
    pipBorder: '#0E7490',
  },
  tangerine: {
    base: '#EA580C',
    highlight: '#FED7AA',
    shade: '#9A3412',
    border: '#431407',
    slotBorder: '#C2410C',
    slotTint: 'rgba(234, 88, 12, 0.14)',
    pipFill: '#FB923C',
    pipBorder: '#9A3412',
  },
  onyx: {
    base: '#262626',
    highlight: '#737373',
    shade: '#171717',
    border: '#0A0A0A',
    slotBorder: '#404040',
    slotTint: 'rgba(38, 38, 38, 0.15)',
    pipFill: '#E5E5E5',
    pipBorder: '#262626',
  },
  magenta: {
    base: '#262626',
    highlight: '#737373',
    shade: '#171717',
    border: '#0A0A0A',
    slotBorder: '#404040',
    slotTint: 'rgba(38, 38, 38, 0.15)',
    pipFill: '#E5E5E5',
    pipBorder: '#262626',
  },
};

export type CellBlock = BlockColor | 'neutral';

export type ShiftDirection = 'left' | 'right' | 'up' | 'down';

export type FlipOrientation = 'horizontal' | 'vertical' | 'both';

export interface ShiftAction {
  axis: 'row' | 'col';
  index: number; // row index (0..rows-1) or col index (0..cols-1)
  direction: ShiftDirection;
  distance: number; // positive cell count shifted (1..cols-1 or 1..rows-1)
}

export type DifficultyTier = 'normal' | 'hard' | 'super_hard';

// Abstract color slot index: 0 .. (colorCount - 1), or null for neutral/no-frame
export type ColorSlotIndex = number | null;

export interface LevelConfig {
  id: number; // 1-indexed stage number (Level No. X)
  cols: 3 | 4; // Min 3, Max 4
  rows: 3 | 4 | 5 | 6 | 7 | 8; // Min 3, Max 8
  difficulty: DifficultyTier; // Cosmetic badge: 'normal', 'hard', or 'super_hard'
  timeLimitSeconds: number; // Stage countdown timer in seconds
  colorCount: number; // Number of distinct colors used (1..8)
  frames: ColorSlotIndex[][]; // Static target frame positions (rows x cols)
  initialGrid: ColorSlotIndex[][]; // Unsolved starting block positions (rows x cols)
  parMoves?: number; // Optimal solve move count computed by IDA* solver
  scrambleSeed?: number; // Optional PRNG seed used by Auto-Unsolve
}

export interface LevelsConfigFile {
  campaignLoop?: number[];
  levels: LevelConfig[];
}

export interface StorePackConfig {
  id: string;
  type: 'lives' | 'coins';
  label: string;
  amount: number;
  kofiUrl: string;
  toastMessage: string;
}

export interface EconomyConfig {
  maxLives: number;
  startingLives: number;
  lifeRegenIntervalSeconds: number;
  startingCoins: number;
  levelClearReward: number;
  fallbackEndgameLoopSize: number;
  campaignLoopSize?: number;
  starThresholds: {
    threeStarMinRatio: number;
    twoStarMinRatio: number;
  };
  boosters: {
    hintCostCoins: number;
    extraTimeCostCoins: number;
    extraTimeSeconds: number;
    extraTimeCapToLimit: boolean;
    reviveCostCoins: number;
    reviveSeconds: number;
  };
  storePacks: StorePackConfig[];
}


