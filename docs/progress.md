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
| **Current Batch / Phase** | **All Phases 1–9.3 Complete (`[x]` Web, Itch.io & Android APK Fully Verified)** |
| **Last Verified Milestone** | **Native Android Debug APK Compiled & Saved to `dump/grid-snap-051126-0156-android.apk` (5.41 MB)** |
| **Next Immediate Action** | Ready for local playtesting (`npm run dev`), level authoring (`npm run dev:editor`), Itch.io deployment (`dump/grid-snap-*-itch.zip`), or Android APK installation. |

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
- [x] **9.3 Android APK Build**:
  - Run `npm run build:apk` (bootstrapped portable JDK 21 & Android SDK in `~/.portable-android-env`, synced 9:20 splash & launcher icons, compiled debug APK via Gradle). Output saved to `dump/grid-snap-051126-0156-android.apk` (5.41 MB).

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
- [x] **Target Frame Inset Smaller-Square & Colored Center Pip Fix (`src/components/TorusGrid.tsx`, `src/engine/types.ts`, `src/index.css`)**:
  - Added `pipFill` and `pipBorder` tokens to `COLOR_HEX_MAP` in `src/engine/types.ts`.
  - Updated `TorusGrid.tsx` (`renderCell` and `renderTileFace`) so cells with a target frame (`targetColor !== null`) render an outer `.slot-${targetColor}` container (`2px dashed` border + `12%` tinted margin + inset padding) containing a smaller `.pixel-tile-*` inner square with its own `#332B25` dark border, 3D bevel, and framed colored center pip (`pipFill` + `1.5px solid pipBorder`), matching `ui-refs/color_shift_4x8_grid_pixel_art_puzzle_ui`.
- [x] **Drag-Release 50–99% Snap Animation Direction Fix (`src/components/TorusGrid.tsx`)**:
  - Locked `commitBaseCells = Math.trunc(current.offsetPx / stepSizePx)` in `DragState` upon pointer release so `baseCells` does not jump ahead when `Math.round(...) !== Math.trunc(...)`, ensuring `remainderPx` transitions forward in the drag direction (`±0.55 * stepSizePx -> ±1.0 * stepSizePx`) instead of snapping backward toward `0`.
- [x] **Live Remote Config Sync for `levels.json` & `economy.json` (`src/utils/remoteData.ts`, `src/store/gameStore.ts`, UI Views)**:
  - Implemented `fetchLiveGameConfigs`, `fetchRemoteConfig`, `isValidLevelsConfig`, and `isValidEconomyConfig` in `src/utils/remoteData.ts` fetching from `https://raw.githubusercontent.com/ishanmanjrekar/grid-snap/main/src/config/` with a `3000ms` `AbortController` timeout, `cache: 'no-cache'`, runtime schema validation, local dev guard (`import.meta.env.DEV`), and instant fallback to bundled JSONs.
  - Wired `levels`, `economy`, and `syncRemoteConfigs()` into `src/store/gameStore.ts`, `SplashScreen.tsx`, `MainMenuView.tsx`, `InGameView.tsx`, `ItemStoreView.tsx`, and `OutOfTimeModal.tsx`, and verified with 9/9 passing Vitest unit tests (`npm test`) and production build (`npm run build`).
- [x] **Heart Icon SVG & Store Card Layout Refinement (`src/components/PixelIcons.tsx`, `src/components/screens/ItemStoreView.tsx`)**:
  - Replaced `HeartIcon` in `src/components/PixelIcons.tsx` with user-provided vector heart SVG, matching the vibrant `#EF4444` crimson fill and `#2C2523` border from the "TIME'S UP!" tab/design tokens (with `LegacyPixelHeartIcon` preserved for instant fallback).
  - Updated `ItemStoreView.tsx` lives pack cards to display side-by-side heart icons: 1 heart for 5 Lives, 2 hearts for 10 Lives, and 3 hearts for 20 Lives.
- [x] **Settings (`ArticleMultiple`) & Store (`Cart`) Custom SVG Icons (`src/components/PixelIcons.tsx`)**:
  - Integrated user's `ArticleMultiple` SVG for the Settings button (`SettingsGearIcon` & `ArticleMultiple`) with clean scalable props and preserved `LegacyPixelSettingsGearIcon`.
  - Integrated user's `Cart` SVG (`#ef4444` red shopping cart) for the Store button (`StorefrontIcon` & `Cart`) across the Main Menu and Store View, preserving `LegacyPixelStorefrontIcon` for instant reversion.
- [x] **Universal Emoji Icon System (`src/components/PixelIcons.tsx`, Screen Views, Modals)**:
  - Replaced SVG icons with native scalable Unicode emojis: `🪙` for coins across all HUD capsules, booster costs, shop packs, and victory rewards; `❤️` for lives and escrow; `⚙️` for settings; `🛒` for the store; `⚠️` for the settings reset warning; `💡` for hint booster; and `⭐` for star ratings (lit vs dimmed grayscale).
- [x] **Difficulty Badges Rescaling (+50%) (`src/components/screens/MainMenuView.tsx`)**:
  - Increased `HARD` difficulty badge size by 50% (`text-[7px]` -> `text-[10.5px]`, `px-2 py-0.5` -> `px-3.5 py-1`, `border-2 shadow-[2px_2px_0]` -> `border-[2.5px] shadow-[2.5px_2.5px_0]`).
  - Scaled `SUPER HARD` badge proportionally (`text-[6.5px]` -> `text-[9px]`, `px-3 py-1`).
- [x] **Main Menu Dotted Line & Bottom Panel Spacing Polish (`src/components/screens/MainMenuView.tsx`)**:
  - Truncated vertical dashed line `y2` from `540` to `420` so it terminates cleanly inside the green active level button with zero pixels peeking out underneath.
  - Adjusted footer spacing (`-mt-8 pb-10`), cutting the vertical dead space between the green button and the Star Count panel in half (~50% reduction) and lifting the PLAY button away from the bottom of the screen with comfortable breathing room.
- [x] **Splash Screen 9:20 Tall Aspect Ratio & Zero-Crop Mobile Asset Update (`itch-assets/splash.png`, `public/splash.webp`, `scripts/generate-icons.py`)**:
  - Upgraded master `itch-assets/splash.png` to **`1080×2400`** (`9:20` aspect ratio, `3.49 MB`) and compiled optimized WebP to **`900×2000`** (`185.4 KB`) via `scripts/generate-icons.py`.
  - Solved side-cropping on long mobile viewports (19.5:9 and 20:9 devices such as iPhone 13–16 and Galaxy S20–S24) with `0%` horizontal crop, while keeping the central title (`y = 50%`) and loader HUD (`top: 63%`) centered within the 16:9 safe zone for desktop `<BoundingBox>`.
  - Rebuilt Itch distribution package (`dump/grid-snap-051126-0149-itch.zip`, `0.59 MB`) and verified passing Vitest suite (9/9 tests).
- [x] **Splash Screen Loader Label Simplification (`src/components/SplashScreen.tsx`)**:
  - Simplified splash progress status from `'LOADING CARTRIDGE...'` / `'CARTRIDGE READY'` to clean `'LOADING...'` and `'READY'`.
- [x] **Store (`🛒`) & Settings (`⚙️`) Button Polish (`src/components/PixelIcons.tsx`, `MainMenuView.tsx`, `SettingsModal.tsx`)**:
  - Replaced Store icon with `🛒` shopping cart emoji and matched the button background to dark arcade charcoal (`#2C2523`) with crisp white `STORE` text (`text-white`) to match the Settings button.
  - Made the Settings button background dark arcade charcoal (`#2C2523`) so the metallic silver `⚙️` gear stands out with high contrast.
  - Removed the gear emoji from the Settings modal gold header ribbon so it cleanly displays just the text `SETTINGS`.
