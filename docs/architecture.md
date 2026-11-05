# Technical Architecture Document

### Related Documents
- [Game Design Document](./game-design.md) - Master index, core gameplay loop, toroidal shifting mechanics, and win/loss conditions.
- [Art Direction & UI System](./art-direction.md) - `Color Shift 16-Bit Arcade` visual theme, color tokens, 3D tile bevels, colorblind shapes, pixel typography, animation, and audio specs.
- [Economy, Boosters & Progression](./economy-and-progression.md) - Heart escrow system, flat 200-coin clear reward, speed-based star ratings, `HINT` & `EXTRA TIME` boosters, and frictionless Ko-fi store.
- [UI/UX & Screen Flows](./ui-ux-and-flows.md) - Complete screen inventory, modal state flows, drag-only input rules, `ui-refs/` reference overrides, and `<BoundingBox>` container query rules.
- [Level Design & Level Editor](./level-design.md) - Reverse solved-to-unsolved authoring, multi-block same-color rules, standalone Level Editor (`npm run dev:editor`), IDA\* par solver, and last-10 campaign loop.
- [Implementation Plan & Progress Harness](./progress.md) - Live 9-phase build checklist, session status tracker, and verification gates.

---

## 1. System Overview

**Grid Snap** is a client-side single-page application built with **React 19 + Vite + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`) + Zustand + Framer Motion**, housed inside `<BoundingBox width={450} height={800}>` for Web/Itch.io and packaged natively via **Capacitor** for Android.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                                React UI                                 │
│ (SplashScreen, MainMenu, InGameView, ItemStoreView, Modals, TorusGrid)  │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │ Reads State / Dispatches Actions        │ Triggers Audio / Solver
                ▼                                         ▼
┌───────────────────────────────────────────┐ ┌───────────────────────────┐
│            Zustand Game Store             │ │  AudioManager & Solver    │
│   (src/store/gameStore.ts + persist v1)   │ │  • WebAudio SFX + Music   │
├───────────────────────────────────────────┤ │  • IDA* Solver Worker     │
│  • Persisted (`grid-snap-save` v1):       │ │    (src/engine/solver.ts) │
│    coins, lives, lastLifeRegenAt,         │ └───────────────────────────┘
│    unlockedLevel, levelStars, settings    │
│  • Ephemeral Session & Live Config Slice: │
│    levels, economy (synced from GitHub    │
│    main w/ bundled fallback),             │
│    isGameStarted, activeScreen,           │
│    activeModal, grid, frames,             │
│    escrowActive, cachedSolution,          │
│    activeHint, timeRemaining, shiftsCount │
└───────────────┬───────────────────────────┘
                │ Hydrates From / Reads Configs
                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│    localStorage + Live GitHub Remote Sync (`src/utils/remoteData.ts`)   │
│         + Bundled Fallbacks (`economy.json`, `levels.json`)             │
└─────────────────────────────────────────────────────────────────────────┘
  *DebugPanel is dynamically imported and tree-shaken out of Itch builds.
```

---

## 2. Core Data Types & Toroidal Board Model (`src/engine/types.ts`)

### 2.1 Tile Colors, Colorblind Shapes & Multi-Cell Shift Actions
```typescript
export type BlockColor =
  | 'ruby'
  | 'emerald'
  | 'cobalt'
  | 'yellow'
  | 'purple'
  | 'cyan'
  | 'tangerine'
  | 'magenta';

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

export type CellBlock = BlockColor | 'neutral';

export type ShiftDirection = 'left' | 'right' | 'up' | 'down';

export interface ShiftAction {
  axis: 'row' | 'col';
  index: number;          // row index (0..rows-1) or col index (0..cols-1)
  direction: ShiftDirection;
  distance: number;       // positive cell count shifted (1..cols-1 or 1..rows-1)
}
```

### 2.2 Dual-Layer Matrix Representation (`3×3` to `4×8`)
For any level with `cols` ($3 \le \text{cols} \le 4$) and `rows` ($3 \le \text{rows} \le 8$):
1. **Static Target Frame Matrix (`frames: (BlockColor | null)[][]`)**:
   - Dimensions: `rows × cols`.
   - `frames[r][c]` holds the required `BlockColor` if cell `(r, c)` has a fixed target wireframe, or `null` if `(r, c)` is a non-target slot.
   - **Immutable during gameplay**: `frames` never mutates when rows or columns shift.
2. **Movable Block Matrix (`grid: CellBlock[][]`)**:
   - Dimensions: `rows × cols`.
   - `grid[r][c]` holds either a `BlockColor` (`'ruby'`, `'emerald'`, etc.) or `'neutral'`.
   - **Mutates on every committed drag gesture**: Dragging row `r` or column `c` by `distance` slots cyclically rotates that row or column in `grid`.

---

## 3. Toroidal Shift, Frame-Snap & IDA\* Solver Engine (`src/engine/`)

### 3.1 Pure Toroidal Multi-Cell Shift Functions
```typescript
export function shiftRow(
  grid: CellBlock[][],
  rowIndex: number,
  direction: 'left' | 'right',
  distance = 1
): CellBlock[][] {
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

export function shiftCol(
  grid: CellBlock[][],
  colIndex: number,
  direction: 'up' | 'down',
  distance = 1
): CellBlock[][] {
  const rows = grid.length;
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

export function applyShiftAction(
  grid: CellBlock[][],
  action: ShiftAction
): CellBlock[][] {
  if (action.axis === 'row') {
    return shiftRow(
      grid,
      action.index,
      action.direction as 'left' | 'right',
      action.distance
    );
  }
  return shiftCol(
    grid,
    action.index,
    action.direction as 'up' | 'down',
    action.distance
  );
}
```

### 3.2 Frame-Snap & Win Detection ($O(R \times C)$)
Evaluated synchronously after every committed drag gesture:
```typescript
export function getSnapProgress(
  grid: CellBlock[][],
  frames: (BlockColor | null)[][]
): { matchedSlots: number; totalSlots: number; isSolved: boolean } {
  let matchedSlots = 0;
  let totalSlots = 0;
  for (let r = 0; r < frames.length; r++) {
    for (let c = 0; c < frames[r].length; c++) {
      const targetColor = frames[r][c];
      if (targetColor !== null) {
        totalSlots++;
        if (grid[r]?.[c] === targetColor) {
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
```

### 3.3 Hybrid IDA\* Solver & Web Worker (`src/engine/solver.ts` & `solver.worker.ts`)
Because every placed block in **Grid Snap** has a corresponding matching frame (no decoy blocks or frames), the solved board state is unique up to same-color block permutation (`solvedGrid[r][c] = frames[r][c] ?? 'neutral'`). This powers both the **In-Game `HINT ($50)` Booster** and the **Level Editor's Par / Minimum Moves Readout**:

1. **Color-Equivalence Canonical State**:
   - Board states are hashed strictly by cell color (`CellBlock[][]` / `ColorSlotIndex[][]`), never by block instance ID, so interchangeable blocks of the same color are automatically treated as identical.
2. **Admissible Lower-Bound Heuristic (`lineCoverHeuristic`)**:
   - Let $U$ be the set of coordinates $(r, c)$ where `grid[r][c] !== solvedGrid[r][c]`.
   - Because a single step shifts either 1 row or 1 column, any single step can only change cells along a single row $r$ or a single column $c$.
   - The minimum number of lines (rows + columns) required to cover all mismatched coordinates in $U$ (or `Math.min(distinctMismatchedRows, distinctMismatchedCols)` as an $O(R \times C)$ lower bound) is a strictly admissible heuristic $h(\text{grid}) \le \text{trueMinMoves}$.
3. **Hybrid Execution Strategy**:
   - **On Level Start (`solver.worker.ts`)**: Computes and caches `cachedSolution: ShiftAction[]` (initialized from the inverse of the level's unsolve steps or an asynchronous IDA\* search with a `200ms` budget).
   - **When Player Commits a Move**:
     - Clears `activeHint = null`.
     - If the player's move matches `cachedSolution[0]`, pops `cachedSolution[0]` so the remaining optimal path stays warm in $O(1)$ time.
     - Otherwise, requests a fresh background IDA\* solve from the new board state.
   - **When Player Taps `HINT ($50)` (`useHintBooster`)**:
     - If `cachedSolution` is valid for the current board, immediately sets `activeHint = cachedSolution[0]`.
     - Otherwise, runs IDA\* with a `150ms` time budget; if the budget expires on a deeply scrambled board before proving optimality, falls back to the best move found (or 1-step greedy lookahead that maximizes `matchedSlots`) and sets `activeHint`.
   - **In the Level Editor (`solveParMoves`)**: Runs IDA\* without the tight mobile frame budget to report exact **Minimum Moves (`parMoves`)** and **Suggested Stage Timer (`parMoves * 6 + rows * cols`)**.

---

## 4. State Management (`src/store/gameStore.ts`)

### 4.1 State Interface
```typescript
export type ScreenView = 'menu' | 'playing' | 'store';
export type ModalType =
  | 'none'
  | 'tutorial'
  | 'pause'
  | 'level_complete'
  | 'out_of_time'
  | 'settings';

export interface GameState {
  // Persisted Player Progression & Economy (`grid-snap-save`, version: 1)
  coins: number;
  lives: number;
  lastLifeRegenAt: number; // Epoch ms timestamp
  unlockedLevel: number;   // Current active stage number (starts at 1; cleared levels cannot be replayed)
  levelStars: Record<number, 1 | 2 | 3>;
  hasSeenTutorial: boolean;
  settings: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    colorblindMode: boolean;
  };

  // Ephemeral Navigation & Active Level Session (Never persisted to localStorage)
  isGameStarted: boolean;
  activeScreen: ScreenView;
  activeModal: ModalType;
  activeLevelId: number;
  rows: number;
  cols: number;
  grid: CellBlock[][];
  frames: (BlockColor | null)[][];
  timeLimitSeconds: number;
  timeRemaining: number;
  shiftsCount: number;
  escrowActive: boolean;
  livesBeforeStart: number;
  cachedSolution: ShiftAction[];
  activeHint: ShiftAction | null;
  lastRewardCoins: number;
  lastEarnedStars: 1 | 2 | 3;

  // Developer Debug State (Inactive in Itch builds)
  isDebugOpen: boolean;
  isTimerFrozen: boolean;
}
```

### 4.2 Store Actions Interface
```typescript
export interface GameActions {
  // Navigation & Lifecycle
  startGame: () => void; // Dismisses SplashScreen and unlocks WebAudio
  navigateTo: (screen: ScreenView) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  startLevel: (levelId?: number) => boolean; // Deducts 1 life into escrow & loads unlockedLevel
  dismissTutorial: () => void;

  // Board & Timer Actions
  performShift: (action: ShiftAction) => void; // Commits drag gesture, clears activeHint, checks win
  tickTimer: (deltaSeconds: number) => void;
  forfeitAndReturnToMenu: () => void;          // Clears escrowActive (heart stays deducted) & returns to menu

  // In-Game Boosters & Rescue
  useHintBooster: () => boolean;       // Costs $50, computes/reads next ShiftAction & sets activeHint
  useExtraTimeBooster: () => boolean;  // Costs $100, adds +5s capped at timeLimitSeconds
  useOutOfTimeRescue: () => boolean;   // Costs $200, sets timeRemaining = min(30, timeLimitSeconds) & resumes

  // Economy, Heart Regen & Frictionless Ko-fi Store
  syncLifeRegeneration: () => void;
  claimKoFiStorePack: (packId: string) => { label: string } | null;

  // Settings & Reset
  toggleMusic: () => void;
  toggleSfx: () => void;
  toggleColorblindMode: () => void;
  resetAllProgress: () => void;

  // Debug Actions (No-op when VITE_DISABLE_DEBUG === 'true')
  toggleDebugPanel: () => void;
  devCheatInstantWin: () => void;
  devCheatSkipToLevel: (levelId: number) => void;
  devCheatAddCoins: (amount: number) => void;
  devCheatAdjustLives: (delta: number) => void;
  devCheatRefillTime: () => void;
  devCheatToggleFreezeTimer: () => void;
}
```

### 4.3 Persistence Configuration (`grid-snap-save`, `version: 1`)
- Configured via Zustand's `persist` middleware with:
  - `name: 'grid-snap-save'`
  - `version: 1`
  - `partialize`: Persists **only** `{ coins, lives, lastLifeRegenAt, unlockedLevel, levelStars, hasSeenTutorial, settings }`.
  - `migrate`: Identity migration stub ready for future schema bumps.
- Because `startLevel` immediately persists `lives: state.lives - 1` while `escrowActive` remains in ephemeral memory, force-closing or refreshing the browser mid-level naturally forfeits the escrowed heart.

---

## 5. Timers, Lifecycle Hooks & Frictionless Ko-fi Store

### 5.1 Live Stage Countdown (`useGameLoop.ts`) & Auto-Pause
- While `activeScreen === 'playing'`, `activeModal === 'none'`, and `!isTimerFrozen`, `useGameLoop` calls `tickTimer(deltaSeconds)` every animation frame using `performance.now()` deltas.
- When `timeRemaining` reaches `<= 0`, `timeRemaining` clamps to `0` and `activeModal` transitions to `'out_of_time'`.
- **Background Auto-Pause (`visibilitychange`)**: Listening to `document.addEventListener('visibilitychange', ...)`, if `document.hidden` becomes `true` while `activeScreen === 'playing'` and `activeModal === 'none'`, the store automatically opens `activeModal = 'pause'` and suspends audio.
- **Android Hardware Back Button**: Registering `@capacitor/app` `backButton` listener:
  - If a non-critical modal (`settings`, `pause`) is open, closes/resumes it.
  - If actively playing (`activeModal === 'none'`), opens the `pause` modal.

### 5.2 Timestamp-Based Heart Regeneration (`syncLifeRegeneration`)
- Runs on app boot, every `1s` on the Main Menu / Store HUD, and before starting or finishing a level.
- If `lives >= economyConfig.maxLives` (`5`), `lastLifeRegenAt` is kept synced to `Date.now()` and the HUD capsule displays **`FULL`** (hiding the countdown timer).
- If `lives < 5`, elapsed milliseconds `Date.now() - lastLifeRegenAt` are divided by `1800 * 1000` (`30` minutes) to credit any regenerated hearts up to `5` and format the remaining `MM:SS` countdown (`24:15`) for the HUD capsule.

### 5.3 Cross-Platform Frictionless Ko-fi Store Handler
To ensure **zero redirect popups** on Itch.io and native system-browser support on Android APKs (targeting Itch.io and local/sideloaded APKs only, not Google Play billing):
```typescript
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export function openExternalUrl(url: string): void {
  if (Capacitor.isNativePlatform()) {
    void Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
}

// Inside gameStore:
claimKoFiStorePack: (packId: string) => {
  const pack = economyConfig.storePacks.find((p) => p.id === packId);
  if (!pack) return null;

  openExternalUrl(pack.kofiUrl);

  set((state) => ({
    lives: pack.type === 'lives' ? state.lives + pack.amount : state.lives,
    coins: pack.type === 'coins' ? state.coins + pack.amount : state.coins,
  }));

  return { label: pack.toastMessage };
}
```

---

## 6. JSON Configuration Schemas (`src/config/`)

### 6.1 `src/config/economy.json`
Both the star rating evaluation and the HUD star positions (`left: %`) read directly from `starThresholds`:
```json
{
  "maxLives": 5,
  "startingLives": 5,
  "lifeRegenIntervalSeconds": 1800,
  "startingCoins": 250,
  "levelClearReward": 200,
  "campaignLoopSize": 10,
  "starThresholds": {
    "threeStarMinRatio": 0.50,
    "twoStarMinRatio": 0.15
  },
  "boosters": {
    "hintCostCoins": 50,
    "extraTimeCostCoins": 100,
    "extraTimeSeconds": 5,
    "extraTimeCapToLimit": true,
    "reviveCostCoins": 200,
    "reviveSeconds": 30
  },
  "storePacks": [
    {
      "id": "lives_5",
      "type": "lives",
      "label": "5 LIVES",
      "amount": 5,
      "kofiUrl": "https://ko-fi.com/ishanmanjrekar/2",
      "toastMessage": "PURCHASED 5 LIVES!"
    },
    {
      "id": "lives_10",
      "type": "lives",
      "label": "10 LIVES",
      "amount": 10,
      "kofiUrl": "https://ko-fi.com/ishanmanjrekar/5",
      "toastMessage": "PURCHASED 10 LIVES!"
    },
    {
      "id": "lives_20",
      "type": "lives",
      "label": "20 LIVES",
      "amount": 20,
      "kofiUrl": "https://ko-fi.com/ishanmanjrekar/10",
      "toastMessage": "PURCHASED 20 LIVES!"
    },
    {
      "id": "coins_500",
      "type": "coins",
      "label": "500 C",
      "amount": 500,
      "kofiUrl": "https://ko-fi.com/ishanmanjrekar/2",
      "toastMessage": "ADDED 500 COINS!"
    },
    {
      "id": "coins_1200",
      "type": "coins",
      "label": "1,200 C",
      "amount": 1200,
      "kofiUrl": "https://ko-fi.com/ishanmanjrekar/5",
      "toastMessage": "ADDED 1,200 COINS!"
    },
    {
      "id": "coins_5000",
      "type": "coins",
      "label": "5,000 C",
      "amount": 5000,
      "kofiUrl": "https://ko-fi.com/ishanmanjrekar/10",
      "toastMessage": "ADDED 5,000 COINS!"
    }
  ]
}
```

### 6.2 `src/config/levels.json` Schema, Last-10 Campaign Loop & Runtime Color Mapping
Levels store **Abstract Color Slot Indices (`0 .. colorCount - 1`)** rather than hardcoded color names:

```typescript
export type DifficultyTier = 'normal' | 'hard' | 'super_hard';

// Abstract color slot index: 0 .. (colorCount - 1), or null for neutral/no-frame
export type ColorSlotIndex = number | null;

export interface LevelConfig {
  id: number;                        // 1-indexed stage number (Level No. X)
  cols: 3 | 4;                       // Min 3, Max 4
  rows: 3 | 4 | 5 | 6 | 7 | 8;       // Min 3, Max 8
  difficulty: DifficultyTier;        // Cosmetic badge: 'normal' (no badge), 'hard', or 'super_hard'
  timeLimitSeconds: number;          // Stage countdown timer in seconds
  colorCount: number;                // Number of distinct colors used (1..8)
  frames: ColorSlotIndex[][];        // Static target frame positions (rows x cols)
  initialGrid: ColorSlotIndex[][];   // Unsolved starting block positions (rows x cols)
  parMoves?: number;                 // Optimal solve move count computed by the Editor's IDA* solver
  scrambleSeed?: number;             // Optional PRNG seed used by Auto-Unsolve for reproducibility
}
```

#### Level Lookup with Last-10 Loop (`getLevelConfig(levelId)`)
Until procedural generation is enabled:
```typescript
export function getLevelConfig(
  levelId: number,
  levels: LevelConfig[],
  loopSize = 10
): LevelConfig {
  const N = levels.length;
  if (N === 0) throw new Error('levels.json is empty');
  if (levelId <= N) {
    return levels[levelId - 1];
  }
  const windowSize = Math.min(loopSize, N);
  const startIndex = N - windowSize;
  const offset = (levelId - N - 1) % windowSize;
  return levels[startIndex + offset];
}
```

#### Runtime Palette Mapping (`hydrateLevelColors`)
When `startLevel()` loads a `LevelConfig`:
1. Shuffle the 8-color `ALL_BLOCK_COLORS` array and take the first `level.colorCount` colors: `sessionPalette = shuffle(ALL_BLOCK_COLORS).slice(0, level.colorCount)`.
2. Map `frames[r][c]`: `slotIdx !== null ? sessionPalette[slotIdx] : null`.
3. Map `initialGrid[r][c]`: `slotIdx !== null ? sessionPalette[slotIdx] : 'neutral'`.

---

## 7. Standalone Level Editor Architecture (`vite.editor.config.ts` & `editor/`)

- **Isolated Dev Server & Cache (`npm run dev:editor`)**:
  - Launches `vite --config vite.editor.config.ts` with `root: 'editor'` on port `5174`.
  - Uses an isolated dependency cache (`cacheDir: path.resolve(__dirname, 'node_modules/.vite-editor')`) so `npm run dev` (`:5173`) and `npm run dev:editor` (`:5174`) can run side-by-side without pre-bundled Vite chunk hash conflicts.
  - Shares `src/engine/*` (toroidal math, `autoUnsolve`, IDA\* `solveParMoves`) and `src/components/TorusGrid.tsx` directly with the game, while rendering inside a full-screen desktop layout (outside `<BoundingBox>`).
  - **Editor Typography**: Loads `Be Vietnam Pro` in `editor/index.html` for all body text, controls, inputs, and buttons (`fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif"`), while retaining `font-pixel` (`'Press Start 2P'`) exclusively on the top `GRID SNAP // LEVEL EDITOR` title.
- **Direct Disk Read/Write Middleware (`saveLevelPlugin` exported from `vite.editor.config.ts` and also registered in `vite.config.ts`)**:
  - `GET /api/levels`: Reads `src/config/levels.json` and returns `{ levels: LevelConfig[] }`.
  - `POST /api/save-level`: Upserts a `LevelConfig` for `id: X` (after client-side confirmation if overwriting an existing ID), sorts by `id` ascending, and writes formatted JSON to `src/config/levels.json`.
  - `POST /api/insert-level`: Inserts a level at `id: X`, increments `id` by `+1` for all existing levels with `id >= X`, and writes `src/config/levels.json`.
  - `DELETE /api/level/:id`: Removes level `id` from `src/config/levels.json`, re-indexes subsequent level IDs sequentially (`1 .. N`), and writes `src/config/levels.json`.

---

## 8. Audio Architecture (`src/audio/AudioManager.ts`)

- **WebAudio Graph**:
  - Single lazy-initialized `AudioContext` unlocked on first `pointerdown` / `keydown` gesture.
  - Two master `GainNode` buses (`musicGain`, `sfxGain`) wired to `gameStore.settings.musicEnabled` and `sfxEnabled`.
- **Synthesized Placeholder SFX + Optional Asset Overrides**:
  - All 11 SFX cues (`drag_tick`, `shift_commit`, `frame_snap`, `hint_activate`, `extra_time`, `button_tap`, `error_buzz`, `timer_warn`, `level_win`, `level_timeout`, `store_buy`) are synthesized in `src/audio/sfx.ts` using zero-dependency WebAudio oscillators/noise buffers.
  - If an audio file exists at `AssetLoader.resolvePath('audio/sfx/<key>.ogg')`, `AudioManager` plays the decoded audio buffer instead.
- **Dual-Track Music Controller (`menu` & `gameplay`)**:
  - Attempts to load `AssetLoader.resolvePath('audio/music/menu.ogg')` (or `.mp3`) and `AssetLoader.resolvePath('audio/music/gameplay.ogg')` (or `.mp3`).
  - **Graceful Missing-File Handling**: Because the user will supply the music files, a `404` or missing file fails silently without throwing or blocking gameplay.
  - Crossfades (`400ms`) between `menu` (active on `MainMenu` and `ItemStore`) and `gameplay` (active on `InGameView`), ducks music volume to `35%` while `activeModal !== 'none'`, and suspends the `AudioContext` on `visibilitychange` when hidden.

---

## 9. Developer Debug Mode & Itch Build Stripping

- **Activation Trigger**: Double-tapping any of the **3 Star icons** on the In-Game HUD progress bar within `350ms` calls `toggleDebugPanel()`.
- **Strict Production Exclusion (`.env.itch` & `verify-build.js`)**:
  1. In `InGameView.tsx` and `gameStore.ts`, all debug triggers and lazy imports are gated behind:
     ```tsx
     const DebugPanel =
       import.meta.env.VITE_DISABLE_DEBUG === 'true'
         ? null
         : React.lazy(() => import('./components/DebugPanel'));
     ```
  2. Because `npm run build:itch` runs `vite build --mode itch` (where `.env.itch` sets `VITE_DISABLE_DEBUG=true`), Vite statically replaces the condition with `false` and Rollup tree-shakes `DebugPanel.tsx` completely out of the production bundle.
  3. `DebugPanel.tsx` includes a sentinel string `'__GRID_SNAP_DEBUG_PANEL__'`, and `scripts/verify-build.js` scans the compiled `dist/assets/*.js` bundle during `npm run build:itch` to guarantee the sentinel string is absent.

---

## 10. Platform, Styling & Asset Optimization Pipeline
- **Tailwind CSS v4 (`@tailwindcss/vite`)**: Provides zero-config CSS-first styling and native `@container` query units (`cqw`, `cqh`). `src/index.css` explicitly includes `@source "../src";` and `@source "../editor";` so Tailwind scans both the game and standalone editor directories regardless of the active Vite `root`.
- **Self-Hosted Game Fonts (`public/fonts/`)**: `Press Start 2P`, `Silkscreen`, and `Space Mono` `.woff2` files are stored locally in `public/fonts/` and loaded via `@font-face` in `src/index.css` for the runtime game (`editor/index.html` loads `Be Vietnam Pro` for the local-only Level Editor UI).
- **Safe Asset Resolution**: Always resolve `public/` assets through `AssetLoader.resolvePath()` (`import.meta.env.BASE_URL`) so Itch.io CDN subpaths never 404.
- **Viewport Scaling (`src/components/BoundingBox.tsx`)**: `<BoundingBox width={450} height={800}>` provides `containerType: 'size'` and switches between framed desktop scaling (`450×800` box with `4px` arcade border) and 100% fluid mobile/APK rendering (`data-layout="fluid"`). Native platform detection checks `Boolean(window.Capacitor?.isNativePlatform?.())` (never `'Capacitor' in window`, which is truthy on Desktop Web when `@capacitor/core` is imported) and guards against false-positive fluid mode on touch-enabled desktop laptops.

### 10.1 Splash Screen & Game Icon Optimization (`scripts/generate-icons.py` & `scripts/update-assets.js`)
Following the asset pipeline in `topdown-2d-car-engine` and `portable-web-android-game-skill`:
1. **Splash Screen Resizing & WebP Compression (`itch-assets/splash.png` → `public/splash.webp`)**:
   - The master artwork in `itch-assets/splash.png` (`1080×2400`, `9:20` aspect ratio) is resized to **`900×2000`** (`2×` retina resolution for tall mobile displays and `450×800` `<BoundingBox>`) using Lanczos resampling and encoded to **`public/splash.webp`** (`quality=82, method=6`), keeping the bundle footprint lightweight (`~185 KB`).
   - At runtime, `src/components/SplashScreen.tsx` loads `${import.meta.env.BASE_URL}splash.webp` (via `AssetLoader.resolvePath('splash.webp')`) as a full-bleed cover overlay with a 0–100% progress bar and `TAP TO CONTINUE` prompt.
2. **Game Icon Resizing & Capacitor Android Sync (`public/icon.png`)**:
   - The master square icon in `public/icon.png` (`1024×1024`, `~1.32 MB`) is synced to `android-assets/icon.png` and optimized for web (`public/icon.png` / `public/assets/icon.png` resized to `256×256` optimized PNG for fast favicon and UI loading).
   - `scripts/generate-icons.py` (invoked automatically during asset sync and `npm run build:apk`) reads the master `1024×1024` icon and generates all 5 Android native launcher densities inside `android/app/src/main/res/`:
     - `mipmap-mdpi`: `48×48` (`ic_launcher.png`, `ic_launcher_round.png`), `108×108` (`ic_launcher_foreground.png`)
     - `mipmap-hdpi`: `72×72` / `162×162`
     - `mipmap-xhdpi`: `96×96` / `216×216`
     - `mipmap-xxhdpi`: `144×144` / `324×324`
     - `mipmap-xxxhdpi`: `192×192` / `432×432`
