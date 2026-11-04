# Implementation Plan & Build Progress Harness

### Related Documents
- [Game Design Document](./game-design.md) - Master index, core gameplay loop, toroidal shifting mechanics, and win/loss conditions.
- [Technical Architecture](./architecture.md) - Zustand state management, 2D toroidal grid engine, IDA\* solver worker, audio manager, debug mode, and JSON schemas.
- [Art Direction & UI System](./art-direction.md) - `Color Shift 16-Bit Arcade` visual theme, color tokens, 3D tile bevels, colorblind shapes, pixel typography, animation, and audio specs.
- [Economy, Boosters & Progression](./economy-and-progression.md) - Heart escrow system, flat 200-coin clear reward, speed-based star ratings, `HINT` & `EXTRA TIME` boosters, and frictionless Ko-fi store.
- [UI/UX & Screen Flows](./ui-ux-and-flows.md) - Complete screen inventory, boot splash screen, modal state flows, drag-only input rules, and `<BoundingBox>` container query rules.
- [Level Design & Level Editor](./level-design.md) - Reverse solved-to-unsolved authoring, multi-block same-color rules, standalone Level Editor (`npm run dev:editor`), IDA\* par solver, and last-10 campaign loop.

---

## 1. Live Harness Status

| Field | Current Value |
| :--- | :--- |
| **Current Batch / Phase** | **All Web & Itch.io Phases Complete (Phases 1–9.2 `[x]` + Post-Phase Refinements `[x]`; Phase 9.3 Android APK Deferred by User)** |
| **Last Verified Milestone** | **Desktop `BoundingBox` Frame Fix, Standalone Level Editor Runtime/Cache Fix & `Be Vietnam Pro` Body Typography Sync** |
| **Next Immediate Action** | Ready for local playtesting (`npm run dev`), level authoring (`npm run dev:editor`), or Itch.io deployment (`dump/grid-snap-*-itch.zip`). Android APK (`npm run build:apk`) deferred until explicitly requested. |

> **Agent Harness Rule (Mandatory End-of-Task Doc Sync)**:
> 1. Whenever starting or resuming work on **Grid Snap**, read this file first to determine the active phase or maintenance task, mark tasks `[/]` when starting and `[x]` when verified, and update the **Live Harness Status** table above.
> 2. **At the end of EVERY task** (feature work, bug fixes, UI/UX or font tweaks, Level Editor updates, or build/config adjustments), you **MUST** update `docs/progress.md` AND all affected specification files in `docs/` (`game-design.md`, `architecture.md`, `art-direction.md`, `economy-and-progression.md`, `ui-ux-and-flows.md`, `level-design.md`) before ending the turn.
> 3. **Android Builds**: Do **NOT** run `npm run build:apk` unless the user explicitly asks for an Android build.

---

## 2. Batch & Phase Execution Checklist

### Batch 1: Foundation, Assets, Core Engine, `<TorusGrid>` & Level Editor (`[x]` Complete)

#### Phase 1: Foundation, Image Optimization (`splash.webp` & `icon.png`), Fonts, Tokens & Configs
- [x] **1.1 Install Dependencies**:
  - Installed runtime packages: `@capacitor/browser`, `@capacitor/app`
  - Installed dev packages: `tailwindcss`, `@tailwindcss/vite`, `vitest`
- [x] **1.2 Configure Vite, `index.html` & NPM Scripts**:
  - Registered `tailwindcss()` in `vite.config.ts`.
  - Added `<link rel="icon" type="image/png" href="./icon.png" />` in `index.html`.
  - Added `"dev:editor": "vite --config vite.editor.config.ts"` and `"test": "vitest run"` to `package.json`.
- [x] **1.3 Splash Screen & Game Icon Optimization Pipeline (`scripts/generate-icons.py` & `scripts/update-assets.js`)**:
  - Backed up master `1024×1024` `public/icon.png` to `android-assets/icon.png`.
  - Resized & optimized `public/icon.png` and `public/assets/icon.png` (`256×256` optimized PNG, `110.5 KB`).
  - Generated all 5 Android `mipmap-*` launcher densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` for `ic_launcher.png`, `ic_launcher_round.png`, and `ic_launcher_foreground.png`).
  - Resized `itch-assets/splash.png` (`1536×2816`, `4,477 KB`) to `900×1650` and encoded as `public/splash.webp` (`119.6 KB` — 97.3% reduction).
- [x] **1.4 Self-Host Fonts (`public/fonts/`)**:
  - Downloaded `PressStart2P-Regular.woff2`, `Silkscreen-Regular.woff2`, `Silkscreen-Bold.woff2`, and `SpaceMono-Bold.woff2` into `public/fonts/`.
- [x] **1.5 Art Direction CSS Tokens (`src/index.css`)**:
  - Added `@import "tailwindcss";`, `@font-face` declarations, `:root` CSS custom properties, 8-color 3D bevel block classes, dashed target frame classes, `.pixel-btn` microswitch press states, and `.pixel-star-active` keyframes.
- [x] **1.6 Static JSON Configs (`src/config/`)**:
  - Created `src/config/economy.json` and `src/config/levels.json`.

#### Phase 2: Core Toroidal Engine, IDA\* Solver Worker & Unit Tests (`src/engine/`)
- [x] **2.1 Data Types (`src/engine/types.ts`)**:
  - Defined `BlockColor`, `ColorShape`, `COLOR_SHAPE_MAP`, `COLOR_HEX_MAP`, `CellBlock`, `ShiftDirection`, `ShiftAction` (with `distance`), `DifficultyTier`, `ColorSlotIndex`, and `LevelConfig`.
- [x] **2.2 Grid & Campaign Math (`src/engine/grid.ts`)**:
  - Implemented `shiftRow`, `shiftCol`, `applyShiftAction`, `invertShiftAction`, `getSnapProgress`, `hydrateLevelColors`, `hydrateEditorColors`, `normalizeEditorColors`, and `getLevelConfig` (with the last-10 campaign loop when `levelId > levels.length`).
- [x] **2.3 Seeded Smart Unsolver (`src/engine/unsolve.ts`)**:
  - Implemented `mulberry32(seed)` PRNG and `autoUnsolve(frames, steps, seed)` enforcing all 4 smart rules from `docs/level-design.md` §4.2.
- [x] **2.4 Hybrid IDA\* Solver & Web Worker (`src/engine/solver.ts` & `src/engine/solver.worker.ts`)**:
  - Implemented strictly admissible `lineCoverHeuristic(grid, frames)`, `solveIDAStar(grid, frames, maxTimeMs)`, `solveParMoves(grid, frames)`, `computeSuggestedTime(parMoves, rows, cols)`, and Web Worker message handler.
- [x] **2.5 Unit Tests (`src/engine/__tests__/engine.test.ts`)**:
  - Verified multi-cell toroidal wrapping (`3×3` to `4×8`), interchangeable same-color frame snapping, seeded `autoUnsolve` invariants, IDA\* optimality, `getLevelConfig` last-10 looping, and all 10 campaign levels in `levels.json` via `npm test` (8/8 tests passing).

#### Phase 3: Shared `<TorusGrid>` & Pixel UI Primitives (`src/components/`)
- [x] **3.1 Inline Pixel SVG Icons (`src/components/PixelIcons.tsx`)**:
  - Implemented crisp-edge SVGs (`StorefrontIcon`, `SettingsGearIcon`, `ShareIcon`, `PauseBarsIcon`, `CloseXIcon`, `LightbulbIcon`, `HourglassIcon`, `WarningIcon`, `HeartIcon`, `CoinIcon`, `PixelStarIcon`, `GhostHandIcon`, and `ColorblindShapeIcon` for all 8 shapes).
- [x] **3.2 Shared `<TorusGrid>` (`src/components/TorusGrid.tsx`)**:
  - Dual-layer cell rendering (fixed dashed target frames + movable 3D beveled blocks + colorblind symbols + snapped lock-in flash).
  - Outer arcade bezel with decorative non-clickable arrows (`▲`, `▼`, `◄`, `►`, `pointer-events: none`).
  - Live drag-and-snap (`30%` cell threshold, cloned wrap-around ghost tiles at `index - 1` and `index + L`, `drag_tick` callback, `110ms` commit animation, `1 gesture = 1 move`, gesture input buffer).
  - `activeHint` pulsing row/column highlight and sliding ghost hand animation.
  - `editorPaintMode` cell click/drag handler for the Level Editor.

#### Phase 4: Standalone Level Editor (`editor/` & `vite.editor.config.ts`) & Starter Campaign
- [x] **4.1 Editor Vite Server & Disk Middleware (`vite.editor.config.ts` & `vite.config.ts`)**:
  - Configured `root: 'editor'`, isolated `cacheDir: 'node_modules/.vite-editor'` for concurrent server execution alongside `npm run dev`, and registered `saveLevelPlugin` (`GET /api/levels`, `POST /api/save-level`, `POST /api/insert-level`, `DELETE /api/level/:id`).
- [x] **4.2 Standalone Level Editor UI (`editor/index.html`, `editor/main.tsx`, `editor/EditorApp.tsx`)**:
  - Implemented full desktop editor with Level CRUD, Grid Size (`cols: 3|4`, `rows: 3..8`), Paint Mode (8-color brushes, Eraser, Undo, Clear), Unsolve Mode (shared `<TorusGrid>`, Undo, `Reset to Solved`, Seeded `Auto Unsolve in X Steps`, live `Matched Frames: k / M`, IDA\* `Solver Par`, `Suggested Timer`), Playtest Mode, and Save/Insert with overwrite confirmation.
  - Configured **Be Vietnam Pro** (`'Be Vietnam Pro', system-ui, sans-serif`) for all body text, controls, inputs, and buttons while keeping **Press Start 2P** (`font-pixel`) on the top `GRID SNAP // LEVEL EDITOR` title only.
- [x] **4.3 Author 10 Starter Campaign Levels (`src/config/levels.json`)**:
  - Populated 10 progressive, IDA\*-verified levels (`3×3` onboarding -> `4×4` core -> `4×6` Hard -> `4×8` Super Hard).

---

### Batch 2: Zustand Store, Game Loop, Splash, In-Game & Meta Screens (`[x]` Complete)

#### Phase 5: Zustand Store & Game Loop (`src/store/gameStore.ts` & `src/hooks/useGameLoop.ts`)
- [x] **5.1 Zustand Store (`src/store/gameStore.ts`)**:
  - Persist middleware (`name: 'grid-snap-save'`, `version: 1`) saving `{ coins, lives, lastLifeRegenAt, unlockedLevel, levelStars, hasSeenTutorial, settings }`.
  - Ephemeral boot state (`isGameStarted: false`, `startGame()`).
  - Heart Escrow (`startLevel` deducts `1 ❤️` upfront; win refunds `1 ❤️` capped at `max(maxLives, livesBeforeStart)` + flat `+200 Coins` + increments `unlockedLevel`; quit/timeout forfeits escrowed heart and keeps `unlockedLevel` selected for retry).
  - Boosters (`useHintBooster` `$50`, `useExtraTimeBooster` `$100`, `useOutOfTimeRescue` `$200`), `syncLifeRegeneration()`, and `claimKoFiStorePack(packId)` (`@capacitor/browser` on Android / `window.open` on Web).
- [x] **5.2 Lifecycle & Timer Hook (`src/hooks/useGameLoop.ts`)**:
  - `requestAnimationFrame` delta timer, `visibilitychange` auto-pause, and `@capacitor/app` Android hardware `backButton` listener.

#### Phase 6: In-Game Screen & All 5 Modals (`src/components/`)
- [x] **6.1 In-Game View (`src/components/screens/InGameView.tsx`)**:
  - Top HUD (Coin pill, `LVL.{X}`, `||` Pause button, `⏳ MM:SS` timer pill, `economy.json`-driven 3-Star Milestone Progress Bar with double-tap star Debug trigger), elastic center `<TorusGrid>`, and bottom `💡 HINT ($50)` + `+5S EXTRA TIME ($100)` buttons.
- [x] **6.2 Modal Overlays (`src/components/modals/`)**:
  - `TutorialOverlay.tsx` (Level 1 first launch; pauses timer until tapped).
  - `PauseModal.tsx` (`RESUME` and `QUIT` with `YOU WILL LOSE 1 ❤️` warning).
  - `LevelCompleteModal.tsx` (`LEVEL {X} CLEAR!`, 3 pixel stars, status banner, `TIME` without `BEST!`, `SHIFTS`, `COINS: +200`, `NEXT LEVEL ▶`, top-right `✕`).
  - `OutOfTimeModal.tsx` (`TIME'S UP!`, top-right `✕` with `-1 ❤️` penalty badge below, stats, `+30 SECONDS ▶ ($200)` disabled with crimson `$ 200` text when `coins < 200`).
  - `SettingsModal.tsx` (`MUSIC`, `SFX`, and `COLORBLIND` `ON/OFF` switches + double-tap `⚠ RESET PROGRESS`).

#### Phase 7: Boot Splash Screen & Meta Screens (`SplashScreen`, `MainMenuView`, `ItemStoreView`)
- [x] **7.1 Boot Splash Screen (`src/components/SplashScreen.tsx`)**:
  - Full-bleed cover overlay inside `<BoundingBox width={450} height={800}>` (`z-index: 100`) displaying `AssetLoader.resolvePath('splash.webp')`.
  - Smooth `0%–100%` loading bar at `top: 63%` below `"GRID SNAP"` logo (`LOADING CARTRIDGE...` → `CARTRIDGE READY` + `{progress}%`, 16-bit progress bar, pulsing `TAP TO CONTINUE` prompt + `Space`/`Enter`), `450ms` scale/fade exit, and WebAudio unlock.
- [x] **7.2 Main Menu Screen (`src/components/screens/MainMenuView.tsx`)**:
  - Top Coin & Heart HUD capsules (`FULL` with no timer when `lives >= 5`, `MM:SS` timer when `lives < 5`), `STORE` & `⚙` buttons, vertical Level Path (`unlockedLevel` at bottom, `HARD`/`SUPER HARD` badges, last-10 loop), `STAR COUNT` vanity bar + Share button, and `▶ PLAY` CTA.
- [x] **7.3 Item Store Screen (`src/components/screens/ItemStoreView.tsx`)**:
  - `GET LIVES` (`5`, `10`, `20` Lives) and `GET COINS` (`500 C`, `1,200 C`, `5,000 C`) 3-column grids wired to Ko-fi `/2`, `/5`, `/10` tiers + inline `#toast` banner + `◀ BACK TO MENU`.
- [x] **7.4 Root App Assembly (`src/App.tsx`)**:
  - Wire `SplashScreen`, `MainMenuView`, `InGameView`, `ItemStoreView`, all 5 modals, `useGameLoop`, and lazy `DebugPanel` inside `<BoundingBox width={450} height={800}>`.

---

### Batch 3: Audio System, Debug Mode & Production Builds (`[x]` Web & Itch Complete)

#### Phase 8: Audio System & Developer Debug Mode
- [x] **8.1 Chiptune SFX & Music Controller (`src/audio/sfx.ts` & `src/audio/AudioManager.ts`)**:
  - Synthesized all 11 16-bit SFX cues via WebAudio + optional `public/audio/sfx/<key>.ogg` override support + dual-track music controller (`public/audio/music/menu.ogg|.mp3` and `gameplay.ogg|.mp3`) with silent missing-file fallback and `35%` modal ducking.
- [x] **8.2 Developer Debug Panel (`src/components/DebugPanel.tsx`)**:
  - Triggered by double-tapping any HUD star within `350ms`; includes `WIN LEVEL`, `GO TO LVL #`, `+1,000 COINS`, `+5 LIVES`, `-1 LIFE`, `REFILL TIME`, `FREEZE TIMER`, and sentinel `'__GRID_SNAP_DEBUG_PANEL__'`, gated behind `import.meta.env.VITE_DISABLE_DEBUG !== 'true'`.

#### Phase 9: Verification & Build Exports
- [x] **9.1 Automated Tests & Typecheck**:
  - Run `npm test` (Vitest) and `npm run build` (`tsc -b && vite build`).
- [x] **9.2 Itch.io Build & Sentinel Verification**:
  - Run `npm run build:itch` and verify `'__GRID_SNAP_DEBUG_PANEL__'` is absent from `dist/assets/*.js` and `dump/grid-snap-*-itch.zip` is generated.
- [ ] **9.3 Android APK Build** *(Deferred per user request — do not run until explicitly requested)*:
  - Run `npm run build:apk` and verify `dump/grid-snap-*-android.apk` is generated with custom launcher icons.

---

## 3. Post-Phase Refinements & Maintenance Log

- [x] **Desktop `<BoundingBox>` Frame Detection Fix (`src/components/BoundingBox.tsx`)**:
  - Replaced `'Capacitor' in window` with `Boolean(window.Capacitor?.isNativePlatform?.())` (since `@capacitor/core` attaches `window.Capacitor` on Desktop Web too) and tightened `checkIsMobile()` so desktop browsers and touch-enabled Windows laptops always render the framed `450×800` arcade cabinet instead of fluid full-bleed mobile mode.
- [x] **Standalone Level Editor Runtime, Tailwind & Dual-Server Cache Fix (`src/engine/grid.ts`, `editor/EditorApp.tsx`, `src/index.css`, `vite.editor.config.ts`, `vite.config.ts`)**:
  - Made `getSnapProgress` null-safe (`grid[r]?.[c]`) and initialized/synced `playtestGrid` in `EditorApp.tsx` so `playtestProgress` never accesses an uninitialized row when loading levels.
  - Added `@source "../src";` and `@source "../editor";` to `src/index.css` so Tailwind CSS v4 generates all classes when Vite runs with `root: 'editor'`.
  - Isolated `cacheDir` in `vite.editor.config.ts` to `node_modules/.vite-editor` so `npm run dev` (`:5173`) and `npm run dev:editor` (`:5174`) can run side-by-side without pre-bundled dependency hash collisions.
- [x] **Standalone Level Editor Typography Refinement (`editor/index.html`, `editor/EditorApp.tsx`)**:
  - Loaded Google Font `Be Vietnam Pro` in `editor/index.html` and applied it to all body text, labels, inputs, dropdowns, and buttons in `editor/EditorApp.tsx`, keeping `font-pixel` (`Press Start 2P`) only on the main `GRID SNAP // LEVEL EDITOR` header title.
- [x] **Harness & End-of-Task Documentation Sync Rule (`AGENTS.md` & `docs/*.md`)**:
  - Updated `AGENTS.md` and `docs/progress.md` to enforce mandatory updates across `docs/progress.md` and all affected `docs/*.md` specification files at the end of every task.
