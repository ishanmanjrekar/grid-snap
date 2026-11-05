export type BlockColor =
  | 'ruby'
  | 'emerald'
  | 'cobalt'
  | 'yellow'
  | 'purple'
  | 'cyan'
  | 'tangerine'
  | 'magenta';

export const ALL_BLOCK_COLORS: BlockColor[] = [
  'ruby',
  'emerald',
  'cobalt',
  'yellow',
  'purple',
  'cyan',
  'tangerine',
  'magenta',
];

export type ColorShape =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'star'
  | 'cross'
  | 'pentagon'
  | 'heart';

export const COLOR_SHAPE_MAP: Record<BlockColor, ColorShape> = {
  ruby: 'circle',
  emerald: 'triangle',
  cobalt: 'square',
  yellow: 'diamond',
  purple: 'star',
  cyan: 'cross',
  tangerine: 'pentagon',
  magenta: 'heart',
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
    base: '#EF4444',
    highlight: '#FFA3A8',
    shade: '#B91C1C',
    border: '#2B1810',
    slotBorder: '#DC2626',
    slotTint: 'rgba(239, 68, 68, 0.12)',
    pipFill: '#FCA5A5',
    pipBorder: '#B91C1C',
  },
  emerald: {
    base: '#22C55E',
    highlight: '#86EFAC',
    shade: '#15803D',
    border: '#14281A',
    slotBorder: '#16A34A',
    slotTint: 'rgba(34, 197, 94, 0.12)',
    pipFill: '#86EFAC',
    pipBorder: '#15803D',
  },
  cobalt: {
    base: '#3B82F6',
    highlight: '#93C5FD',
    shade: '#1D4ED8',
    border: '#132238',
    slotBorder: '#2563EB',
    slotTint: 'rgba(59, 130, 246, 0.12)',
    pipFill: '#93C5FD',
    pipBorder: '#1D4ED8',
  },
  yellow: {
    base: '#F59E0B',
    highlight: '#FDE68A',
    shade: '#B45309',
    border: '#78350F',
    slotBorder: '#D97706',
    slotTint: 'rgba(245, 158, 11, 0.12)',
    pipFill: '#FDE68A',
    pipBorder: '#D97706',
  },
  purple: {
    base: '#A855F7',
    highlight: '#D8B4FE',
    shade: '#7E22CE',
    border: '#581C87',
    slotBorder: '#9333EA',
    slotTint: 'rgba(168, 85, 247, 0.12)',
    pipFill: '#E9D5FF',
    pipBorder: '#9333EA',
  },
  cyan: {
    base: '#06B6D4',
    highlight: '#A5F3FC',
    shade: '#0891B2',
    border: '#164E63',
    slotBorder: '#0891B2',
    slotTint: 'rgba(6, 182, 212, 0.12)',
    pipFill: '#A5F3FC',
    pipBorder: '#0891B2',
  },
  tangerine: {
    base: '#F97316',
    highlight: '#FDBA74',
    shade: '#C2410C',
    border: '#431407',
    slotBorder: '#EA580C',
    slotTint: 'rgba(249, 115, 22, 0.12)',
    pipFill: '#FDBA74',
    pipBorder: '#C2410C',
  },
  magenta: {
    base: '#EC4899',
    highlight: '#F9A8D4',
    shade: '#BE185D',
    border: '#500724',
    slotBorder: '#DB2777',
    slotTint: 'rgba(236, 72, 153, 0.12)',
    pipFill: '#F9A8D4',
    pipBorder: '#BE185D',
  },
};

export type CellBlock = BlockColor | 'neutral';

export type ShiftDirection = 'left' | 'right' | 'up' | 'down';

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
  campaignLoopSize: number;
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


