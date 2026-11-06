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
| **Last Verified Milestone** | **Catchy Social Share Challenge Message (`https://playable-things.itch.io/grid-snap` link + level & star stats in `MainMenuView.tsx`, 19/19 tests passing)** |
| **Next Immediate Action** | Ready for local playtesting (`npm run dev`), level authoring (`npm run dev:editor`), Itch.io deployment (`npm run build:itch`), or Android APK export (`npm run build:apk`). |

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
- [x] **Custom Pixel Sprite PNG Icon System (`public/assets/icons/`, `src/components/PixelIcons.tsx`, `src/components/SplashScreen.tsx`)**:
  - Replaced OS/device emoji dependencies with custom 128×128 transparent PNG sprites in `public/assets/icons/` (`coin.png`, `heart.png`, `star.png`, `star-empty.png`, `store.png`, `gear.png`, `hint.png`, `hourglass.png`, `warning.png`).
  - Losslessly optimized all PNG sprites (saved metadata bloat).
  - Wired `AssetLoader.resolvePath(...)` with `image-rendering: pixelated` across all icon components in `PixelIcons.tsx` for consistent, crisp rendering across Android, iOS, Windows, Mac, and Linux.
  - Added sprite preloading in `SplashScreen.tsx` during boot to ensure instant, zero-flicker icon display upon entering the main menu.
  - Verified 9/9 passing Vitest tests (`npm test`) and production build (`npm run build`).
- [x] **Difficulty Badge Stacking Context Fix (`src/components/screens/MainMenuView.tsx`)**:
  - Diagnosed 2 faint vertical white lines cutting through the `SUPER HARD` badge near the `S` and `D` letters: the parent node's decorative inner highlight border (`absolute inset-1.5 border border-white/60`) was stacking on top of the in-flow difficulty badge because positioned elements without z-index naturally stack above non-positioned in-flow elements.
  - Added `relative z-10` to `renderDifficultyBadge` and the level number `<span>`, and assigned `z-0` to the decorative inner border div, ensuring all badges and text render cleanly above card highlight borders.
  - Verified with 9/9 passing Vitest tests and production build.
- [x] **Store & Settings Button Color Restoration (`src/components/screens/MainMenuView.tsx`)**:
  - Restored original arcade design token colors for the top HUD action buttons: Store button reverted to mint teal (`bg-[#5EEAD4]`) with dark ink text (`text-[#1E1B18]`), and Settings button reverted to parchment cream (`bg-[#FFFDF8]`).
  - Verified with 9/9 passing Vitest tests and production build.
- [x] **Level Editor State Retention on Save & Active Level Persistence (`vite.editor.config.ts`, `editor/EditorApp.tsx`)**:
  - Diagnosed editor resetting to Level #1 on save: Vite's server watcher was detecting `src/config/levels.json` modification on disk and issuing a full page reload, causing `EditorApp` to re-mount and load `list[0]`.
  - Added `server.watch.ignored: ['**/src/config/**', '**/levels.json']` in `vite.editor.config.ts` so saving does not trigger browser reloads.
  - Implemented `localStorage` active level persistence (`grid_snap_editor_active_level_id`) in `EditorApp.tsx` across `loadLevelIntoEditor`, `handleSaveLevel`, `handleInsertLevel`, `handleNewLevel`, and `handleDuplicateLevel`, ensuring the editor remains on the saved/selected level even after manual refreshes.
- [x] **Interactive Reorder Levels Feature (`vite.editor.config.ts`, `editor/EditorApp.tsx`, `src/engine/__tests__/engine.test.ts`)**:
  - Implemented `POST /api/reorder-levels` in `vite.editor.config.ts` (`saveLevelPlugin`) accepting an array of levels in their new sequence, re-indexing `id` sequentially `1 .. N`, and writing formatted JSON to `src/config/levels.json`.
  - Added `⇄ Reorder Levels (N)` button in Panel 1 of the Level Editor sidebar and built a full modal dialog featuring:
    - HTML5 native drag-and-drop row handles (`⠿`) with drop target indicators.
    - Precision step buttons (`▲` move up, `▼` move down) and jump buttons (`⇪` move to top, `⇩` move to bottom).
    - Clear visual level summary: new index (`#new`), previous ID (`was #old`), dimensions (`cols×rows`), difficulty badge, par moves, timer limit, and mini color dot palette indicator.
    - Presets toolbar: **By Difficulty** (Normal -> Hard -> Super Hard), **By Grid Size** (3×3 -> 4×8), **Reverse Order**, and **Reset to Original**.
    - Atomic save with active level tracking: automatically remaps the editor's active level to its new position in the sequence upon saving.
  - Added Vitest unit test in `engine.test.ts` verifying sequence re-indexing logic and `LevelConfig` schema preservation (10/10 tests passing).
  - Verified with clean production build (`npm run build`).
- [x] **Editable JSON Campaign Loop Sequence & Deterministic 3-Way Flipped Repeated Levels (`src/config/levels.json`, `src/engine/grid.ts`, `src/engine/types.ts`, `src/store/gameStore.ts`, `src/components/screens/MainMenuView.tsx`, `vite.editor.config.ts`, `src/utils/remoteData.ts`, `src/engine/__tests__/engine.test.ts`)**:
  - Upgraded `src/config/levels.json` format to `{ campaignLoop: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15], levels: [...] }` so level designers can customize the exact looping sequence of levels and order directly in JSON (e.g. `[10, 12, 14, 6, 7, 10, 15, 12, 14, 19, 25, 30]`).
  - Implemented `flipGridHorizontal`, `flipGridVertical`, `flipGridBoth`, and `flipLevelConfig` in `src/engine/grid.ts`.
  - Proved toroidal graph reflection isomorphism and verified with IDA\* solver that all 3 flip orientations (Horizontal, Vertical, Both/180°) retain 100% mathematical solvability with identical par moves.
  - Added `getDeterministicFlipMode(levelId)` using integer hashing so every repeated level index receives a stable, reproducible orientation across retries and restarts.
  - Updated `getLevelConfig` to evaluate custom `campaignLoop` arrays, skipping introductory levels 1-5 and looping designated stages with deterministic flipping.
  - Updated `GameState`, `gameStore.ts`, `MainMenuView.tsx`, `remoteData.ts`, and `vite.editor.config.ts` to preserve and synchronize `campaignLoop` seamlessly across production builds and the Level Editor.
  - Added comprehensive Vitest test coverage in `src/engine/__tests__/engine.test.ts` (12/12 passing) and verified production build (`npm run build`).
- [x] **Rename Legacy Loop Config to `fallbackEndgameLoopSize` (`src/config/economy.json`, `src/engine/types.ts`, `src/utils/remoteData.ts`, `docs/architecture.md`)**:
  - Renamed `campaignLoopSize` in `src/config/economy.json` to `fallbackEndgameLoopSize` to clearly distinguish the fallback window size from the active `campaignLoop` array in `levels.json`.
  - Updated `EconomyConfig` type and schema validator in `src/utils/remoteData.ts` with backward-compatible fallback handling (`fallbackEndgameLoopSize ?? campaignLoopSize`).
  - Verified 12/12 passing Vitest tests and production build.
- [x] **Guided FTUE & Interactive Tutorial System (`src/store/gameStore.ts`, `src/components/TorusGrid.tsx`, `src/components/screens/InGameView.tsx`, `src/components/modals/TutorialOverlay.tsx`, `src/engine/__tests__/ftue.test.ts`, `docs/ui-ux-and-flows.md`)**:
  - **Step 1 (Guided First Hint)**: When launching Level 1, the timer is frozen at `01:30`, bottom boosters (`HINT`, `+5S`) and pause controls are disabled, and the 1st optimal move hint animation (ghost hand + pulsing line) loops continuously.
  - **Strict Directional Input Locking & Subtle Feedback**: In `TorusGrid.tsx`, interactions are strictly restricted to the hinted row/column and correct slide direction. Tapping wrong rows/columns or dragging in the wrong direction clamps movement and triggers tactile feedback (a throttled mechanical tick sound + subtle tray wiggle animation `@keyframes ftueWiggle`).
  - **Step 2 (Tutorial Intro Overlay)**: Once Move 1 executes and snaps into frame, `TutorialOverlay` pops up with the game jam themed bullet points (`★ GREAT MOVE! ★`, `▸ SHIFT rows & columns`, `▸ TILES LOOP off the screen`, `▸ SNAP all colors into frames`).
  - **Step 3 (Free 2nd Hint & Unfreeze)**: Tapping "TAP TO CONTINUE ▼" dismisses the popup, unfreezes the timer, unlocks full board input, and auto-plays the second optimal move as a free hint without deducting coins.
  - **Repeatability**: Starting Level 1 at any time (initial play, retry after forfeit, or after reset) replays the guided FTUE flow.
  - Added unit test suite in `src/engine/__tests__/ftue.test.ts` (19/19 passing tests) and verified with production build (`npm run build`).
- [x] **Continuous Background Music Integration (`dump/Velvet_Tiling.mp3` -> `public/audio/music/`, `src/audio/AudioManager.ts`, `docs/architecture.md`, `docs/art-direction.md`)**:
  - Processed `dump/Velvet_Tiling.mp3` with `ffmpeg`: trimmed the first `01:05.00` (65.0s) with micro zero-crossing fade-out at the loop boundary.
  - Exported dual formats to `public/audio/music/`: `theme.ogg` (OGG Vorbis q5 ~160kbps, gapless looping) and `theme.mp3` (192kbps LAME fallback), aliased to `gameplay.*` and `menu.*`.
  - Updated `AudioManager.ts` with continuous asset routing (`TRACK_ASSET_MAP`), ensuring the soundtrack persists uninterrupted across Menu and Gameplay screen transitions without resetting `currentTime`.
  - Scaled music volume by -20% (`MUSIC_VOLUME = 0.36`, ducked volume `MUSIC_DUCKED_VOLUME = 0.13`) for optimal mix with 16-bit SFX.
  - Preserved automatic ducking when modals are open, background suspension on `visibilitychange`, and full settings sync (`musicEnabled` toggle).
  - Verified 19/19 Vitest tests passing and clean TypeScript typecheck (`npx tsc --noEmit`).
- [x] **Settings Modal ON/OFF Switch Toggle Behavior (`src/components/modals/SettingsModal.tsx`, `docs/ui-ux-and-flows.md`)**:
  - Replaced divided conditional click handlers (`!enabled && toggle()`) on separate child buttons with cohesive single-control toggle switches (`<button type="button" role="switch" ...>`).
  - Tapping the switch (including tapping `ON` when it's already active) now flips the state immediately (`ON` -> `OFF`), and tapping it again flips it back (`OFF` -> `ON`).
  - Added semantic accessibility attributes (`role="switch"`, `aria-checked`, dynamic `aria-label`) and tactile active press animation (`active:scale-95`).
  - Verified with 19/19 Vitest tests passing and clean Vite production build.
- [x] **Itch.io Marketing Documentation & Upload Details (`itch-assets/itch-upload-details.md`, `dump/itch-upload-details.md`, `LICENSE`, `README.md`)**:
  - Authored comprehensive Itch.io upload marketing document tailored for **GitHub Game Off 2026** (Theme: **SHIFT**) in humble solo-creator tone.
  - Refined copy to focus accurately on casual, simple shifting mechanics, 2D torus puzzle gameplay, and snapping colors to their matching frames without "16-bit" misnomers.
  - Trimmed all tagline options strictly under 120 characters to fit the Itch.io tagline field limit.
  - Added Itch.io theme customizer font recommendations (`Press Start 2P` for headers, `Open Sans`/`Roboto` for body).
  - Streamlined the HTML Introduction to emphasize unlimited move experimentation within time limits for collecting stars, removed redundant tags header from description, and linked the GitHub repository.
  - Clarified license status with GitHub Game Off rules (public repo required, open source encouraged): added standard GNU General Public License v3.0 (`LICENSE` file added to project root matching `lootbox-go` and `post-like-a-celeb`).
  - Authored official project `README.md` complete with banner, gameplay rules, features, AI usage statement, tech stack, quick start guide, scripts reference, docs index, and GPLv3 licensing notice.
  - Explicitly credited Gemini for background music generation in README and Itch upload details.
  - Formatted ultra-short, crisp variations of the **Statement on AI Usage** specifically sized for the Itch.io metadata dialog without cluttering the view.
  - Credited Gemini for art assets & sound and Google Stitch for UI layouts in the Credits and classification checklists.
  - Saved in both `itch-assets/` and `dump/`.
- [x] **High-Contrast 8-Color Palette Upgrade (Option 2: 7 Chromas + 1 Obsidian Onyx) (`src/engine/types.ts`, `src/index.css`, `editor/EditorApp.tsx`, `docs/art-direction.md`)**:
  - Replaced ambiguous, overlapping hues (`Yellow` vs `Tangerine` amber crowding; `Cobalt` vs `Cyan` mid-tone blue crowding; `Ruby` vs `Magenta` red-pink crowding) with the distinct Option 2 arcade palette.
  - Upgraded palette: **Ruby** (Deep Crimson `#DC2626`), **Tangerine** (Blaze Orange `#EA580C`), **Yellow** (Canary Lemon `#FACC15`), **Emerald** (Arcade Green `#16A34A`), **Cobalt** (Deep Navy/Sapphire `#1D4ED8`), **Cyan** (Ice Aqua `#06B6D4`), **Purple** (Royal Amethyst `#7E22CE`), and **Onyx** (Charcoal/Obsidian Black `#262626` with silver/white pip `#E5E5E5`).
  - Updated 3D pixel bevel CSS classes (`.pixel-tile-*`) and dashed target frame wireframe classes (`.slot-*`) in `src/index.css`.
  - Updated Level Editor palette toolbar in `editor/EditorApp.tsx` with dynamic high-contrast text (`color: c === 'yellow' ? '#1E1B18' : '#FFFFFF'`).
  - Verified with 19/19 passing Vitest tests and production build (`npm run build`).
- [x] **Fix Scale-Aware Drag & Cell Hit-Testing in TorusGrid (`src/components/TorusGrid.tsx`)**:
  - **Root Cause**: On desktop monitors where `BoundingBox.tsx` applies `transform: scale(scale > 1.0)`, `handlePointerDown` calculated `relY = e.clientY - rect.top - 6` in screen viewport pixels, but divided by unscaled CSS `stepSizePx` (`cellSize + 5`). Because screen pixels were inflated by `scale`, dividing by unscaled `stepSizePx` caused `Math.floor(relY / stepSizePx)` to overshoot into Row 1 when touching anywhere in the bottom half of Row 0. In Level 1 FTUE, this was masked because `lineIndex` was hardcoded to `restrictedHint.index`, but on subsequent levels (like Level 4), touching just below center of a row wrongly selected the row below.
  - **Resolution**: Implemented precise DOM hit-testing (`data-cell-row` and `data-cell-col` on each cell container) with scale-aware fallback `(e.clientX - rect.left) / scaleX` and normalized drag delta `dx / scaleX, dy / scaleY` in `handlePointerMove`.
  - Verified with 19/19 passing Vitest tests and production build (`npm run build`).
- [x] **Modal Close Button Replaced with Header Pixel Font 'X' (`src/components/PixelIcons.tsx`, `docs/art-direction.md`)**:
  - Replaced the asymmetric vector path SVG in `CloseXIcon` with the authentic arcade pixel letter `'X'` rendered directly in the primary header font (`Press Start 2P`, `--font-pixel`).
  - Automatically updates close buttons across all modals (`SettingsModal`, `LevelCompleteModal`, `OutOfTimeModal`, and `DebugPanel`) to be perfectly centered, clean, and symmetrical.
  - Verified with 19/19 passing Vitest tests and clean Vite production build (`npm run build`).
- [x] **Tutorial Level First Step Sequence Adjustment (`src/store/gameStore.ts`, `src/engine/__tests__/ftue.test.ts`, `docs/ui-ux-and-flows.md`)**:
  - Reordered the Level 1 FTUE solution so the initial guided move (Step 1) directs the player to shift the **center column (col 1) one move down** (`{ axis: 'col', index: 1, direction: 'down', distance: 1 }`), immediately snapping the cyan block at `(1, 1)` into the bottom-center frame at `(2, 1)`.
  - Upon committing the center column downshift, the `TutorialOverlay` modal triggers with frozen timer as designed.
  - Dismissing the overlay transitions to Step 2 with the second guided move directing the player to slide the **top row (row 0) one move right** (`{ axis: 'row', index: 0, direction: 'right', distance: 1 }`), demonstrating toroidal wrapping to snap the blue block at `(0, 2)` into `(0, 0)` and clearing the tutorial.
  - Updated Vitest unit tests in `src/engine/__tests__/ftue.test.ts` to assert the explicit column-down move for step 1 and row-right move for step 2 (19/19 passing).
- [x] **Expanded Click Target for HUD Coins & Lives Capsules (`src/components/screens/MainMenuView.tsx`, `src/components/screens/ItemStoreView.tsx`, `docs/ui-ux-and-flows.md`)**:
  - Unified the split container (`<div>` readout + `<button>` plus) into a single cohesive `<button className="... pixel-btn">` control for both Coins and Lives.
  - The entire capsule surface—including the icon, numerical quantity (`coins`, `lives`), timer, and the `+` square—is now clickable and opens the Item Store directly with button tap SFX.
  - Preserved authentic 3D border, drop shadow, and synchronized microswitch press physics (`translate(2px, 2px)` on active press).
  - Verified with 19/19 passing Vitest tests and production build.
- [x] **Unified HUD Inventory Capsule Sizing Across All Screens (`src/components/HudInventoryCapsules.tsx`, `MainMenuView.tsx`, `ItemStoreView.tsx`, `InGameView.tsx`, `docs/ui-ux-and-flows.md`)**:
  - Extracted shared `<CoinCapsule>` and `<LivesCapsule>` components in `src/components/HudInventoryCapsules.tsx` standardizing the master height to `44px` (`h-11`), `border-[3px] border-[#1E1B18]`, `shadow-[3px_3px_0_#1E1B18]`, `#FFFDF8` background, `20px` `CoinIcon` / `18px` `HeartIcon`, and `.pixel-btn` active physics.
  - Upgraded **Item Store** (`ItemStoreView.tsx`) from legacy compressed `28px` pills to the full-size `44px` `CoinCapsule` and `LivesCapsule`, matching the Main Menu header pixel-for-pixel.
  - Upgraded **In-Game** (`InGameView.tsx`) to render `<CoinCapsule showPlus={false} />`, standardizing the in-game coin inventory to `44px` with matching borders, shadows, and icon size while aligning with the updated `44×44px` Pause button.
  - Verified with 19/19 passing Vitest tests and clean Vite production build.
- [x] **Catchy Social Share Challenge Message (`src/components/screens/MainMenuView.tsx`, `docs/economy-and-progression.md`, `docs/ui-ux-and-flows.md`)**:
  - Replaced the plain `Level X | ⭐ Y Stars!` string with Option 4 ("Brain Teaser / Spatial Logic Challenge") including the direct itch.io link (`https://playable-things.itch.io/grid-snap`).
  - Message format:
    `Testing my spatial logic in Grid Snap — made it to Level ${unlockedLevel} with ⭐ ${totalStars} Stars!\n\nLooking for a real puzzle challenge? Try it here:\nhttps://playable-things.itch.io/grid-snap`
  - Fully compatible with native Web Share API (`navigator.share`) on mobile and clipboard fallback (`navigator.clipboard.writeText`) on desktop web.
  - Verified with 19/19 Vitest tests passing and clean Vite production build.
- [x] **Replace SVG Colorblind Shapes with Crisp Unicode System-Font Glyphs (`src/components/PixelIcons.tsx`, `src/components/TorusGrid.tsx`, `src/engine/types.ts`, `docs/art-direction.md`)**:
  - Replaced the low-res 16x16 pixel SVG paths in `ColorblindShapeIcon`—which rendered blurry or distorted on varying grid scales and caused the Tangerine pentagon to look like a loaf of bread—with crisp, universally supported Unicode geometry/symbol glyphs using system fonts (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Segoe UI Symbol", Roboto, sans-serif`).
  - Glyph mapping:
    - **Ruby**: Circle (`●` U+25CF)
    - **Emerald**: Triangle (`▲` U+25B2)
    - **Cobalt**: Square (`■` U+25A0)
    - **Yellow**: Diamond (`◆` U+25C6)
    - **Purple**: Star (`★` U+2605)
    - **Cyan**: Cross (`✚` U+271A)
    - **Tangerine**: Sparkle (`✦` U+2726, 4-point diamond star replacing the pentagon bread loaf)
    - **Onyx**: Heart (`♥` U+2665)
  - Updated `TorusGrid.tsx`:
    - On colored blocks: sized at `Math.max(16, Math.round(cellSize * 0.46))` in `rgba(255, 255, 255, 0.85)` with `drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]` for contrast against both bright yellow and dark onyx tiles.
    - On target frame center pips: sized at `Math.max(12, Math.round(sizePx * 0.3))` in the frame's `pipBorder` dark tone on cream backgrounds.
  - Verified with 19/19 Vitest tests passing and clean Vite production build.
