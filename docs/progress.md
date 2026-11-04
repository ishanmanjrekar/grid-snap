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
| **Current Batch / Phase** | **Batch 1 — Phase 1: Foundation & Asset Optimization** (`[/]` In Progress) |
| **Last Verified Milestone** | Documentation Suite & Progress Harness Setup (`[x]` Complete) |
| **Next Immediate Action** | Install packages, optimize `splash.webp` & `icon.png`, self-host fonts, configure `src/index.css` & `src/config/*.json` |

> **Agent Harness Rule**: Whenever starting or resuming work on **Grid Snap**, read this file first to determine the active phase, mark tasks `[/]` when starting and `[x]` when verified, and update the **Live Harness Status** table above at the end of every phase.

---

## 2. Batch & Phase Execution Checklist

### Batch 1: Foundation, Assets, Core Engine, `<TorusGrid>` & Level Editor

#### Phase 1: Foundation, Image Optimization (`splash.webp` & `icon.png`), Fonts, Tokens & Configs
- [ ] **1.1 Install Dependencies**:
  - Install runtime packages: `@capacitor/browser`, `@capacitor/app`
  - Install dev packages: `tailwindcss`, `@tailwindcss/vite`, `vitest`
- [ ] **1.2 Configure Vite, `index.html` & NPM Scripts**:
  - Register `tailwindcss()` in `vite.config.ts`.
  - Add `<link rel="icon" type="image/png" href="./icon.png" />` in `index.html`.
  - Add `"dev:editor": "vite --config vite.editor.config.ts"` and `"test": "vitest run"` to `package.json`.
- [ ] **1.3 Splash Screen & Game Icon Optimization Pipeline (`scripts/generate-icons.py` & `scripts/update-assets.js`)**:
  - Copy master `1024×1024` `public/icon.png` to `android-assets/icon.png` (preserving full resolution for Android mipmaps).
  - Resize & optimize `public/icon.png` and `public/assets/icon.png` (`256×256` optimized PNG for fast web loading).
  - Generate all 5 Android `mipmap-*` launcher densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` for `ic_launcher.png`, `ic_launcher_round.png`, and `ic_launcher_foreground.png`).
  - Resize `itch-assets/splash.png` (`1536×2816`, `4.58 MB`) to `900×1650` (`2×` retina target for `450×800` `<BoundingBox>`) and encode as `public/splash.webp` (`quality=82, method=6`, `~110–150 KB`).
- [ ] **1.4 Self-Host Fonts (`public/fonts/`)**:
  - Download `PressStart2P-Regular.woff2`, `Silkscreen-Regular.woff2`, `Silkscreen-Bold.woff2`, and `SpaceMono-Bold.woff2` into `public/fonts/`.
- [ ] **1.5 Art Direction CSS Tokens (`src/index.css`)**:
  - Add `@import "tailwindcss";`, `@font-face` declarations (using relative `./fonts/...` paths with no leading slash), `:root` CSS custom properties from `docs/art-direction.md`, 8-color 3D bevel block classes, dashed target frame classes, `.pixel-btn` microswitch press states, and `.pixel-star-active` keyframes.
- [ ] **1.6 Static JSON Configs (`src/config/`)**:
  - Create `src/config/economy.json` matching `docs/architecture.md` §6.1.
  - Create initial `src/config/levels.json`.

#### Phase 2: Core Toroidal Engine, IDA\* Solver Worker & Unit Tests (`src/engine/`)
- [ ] **2.1 Data Types (`src/engine/types.ts`)**:
  - Define `BlockColor`, `ColorShape`, `COLOR_SHAPE_MAP`, `CellBlock`, `ShiftDirection`, `ShiftAction` (with `distance`), `DifficultyTier`, `ColorSlotIndex`, and `LevelConfig`.
- [ ] **2.2 Grid & Campaign Math (`src/engine/grid.ts`)**:
  - Implement `shiftRow`, `shiftCol`, `applyShiftAction`, `invertShiftAction`, `getSnapProgress`, `hydrateLevelColors`, `normalizeEditorColors`, and `getLevelConfig` (with the last-10 campaign loop when `levelId > levels.length`).
- [ ] **2.3 Seeded Smart Unsolver (`src/engine/unsolve.ts`)**:
  - Implement `mulberry32(seed)` PRNG and `autoUnsolve(frames, steps, seed)` enforcing all 4 smart rules from `docs/level-design.md` §4.2.
- [ ] **2.4 Hybrid IDA\* Solver & Web Worker (`src/engine/solver.ts` & `src/engine/solver.worker.ts`)**:
  - Implement admissible `lineCoverHeuristic(grid, frames)`, `solveIDAStar(grid, frames, maxTimeMs)`, `solveParMoves(grid, frames)`, `computeSuggestedTime(parMoves, rows, cols)`, and Web Worker message handler.
- [ ] **2.5 Unit Tests (`src/engine/__tests__/engine.test.ts`)**:
  - Verify multi-cell toroidal wrapping (`3×3` to `4×8`), interchangeable same-color frame snapping, seeded `autoUnsolve` invariants, IDA\* optimality, and `getLevelConfig` last-10 looping via `npm test`.

#### Phase 3: Shared `<TorusGrid>` & Pixel UI Primitives (`src/components/`)
- [ ] **3.1 Inline Pixel SVG Icons (`src/components/PixelIcons.tsx`)**:
  - Implement crisp-edge SVGs (`StorefrontIcon`, `SettingsGearIcon`, `ShareIcon`, `PauseBarsIcon`, `CloseXIcon`, `LightbulbIcon`, `HourglassIcon`, `WarningIcon`, `HeartIcon`, `CoinIcon`, `PixelStarIcon`, `GhostHandIcon`, and `ColorblindShapeIcon` for all 8 shapes).
- [ ] **3.2 Shared `<TorusGrid>` (`src/components/TorusGrid.tsx`)**:
  - Dual-layer cell rendering (fixed dashed target frames + movable 3D beveled blocks + colorblind symbols + snapped lock-in flash).
  - Outer arcade bezel with decorative non-clickable arrows (`▲`, `▼`, `◄`, `►`, `pointer-events: none`).
  - Live drag-and-snap (`30%` cell threshold, cloned wrap-around ghost tiles at `index - 1` and `index + L`, `drag_tick` callback, `110ms` commit animation, `1 gesture = 1 move`, 2-gesture input buffer).
  - `activeHint` pulsing row/column highlight and sliding ghost hand animation.
  - Optional `editorPaintMode` cell click handler for the Level Editor.

#### Phase 4: Standalone Level Editor (`editor/` & `vite.editor.config.ts`) & Starter Campaign
- [ ] **4.1 Editor Vite Server & Disk Middleware (`vite.editor.config.ts`)**:
  - Configure `root: 'editor'` and `saveLevelPlugin` (`GET /api/levels`, `POST /api/save-level`, `POST /api/insert-level`, `DELETE /api/level/:id`).
- [ ] **4.2 Standalone Level Editor UI (`editor/index.html`, `editor/main.tsx`, `editor/EditorApp.tsx`)**:
  - Panel 1: Level selector, `+ NEW`, `DUPLICATE`, `DELETE` (with confirmation), Target Level `#`, Grid Size (`cols: 3|4`, `rows: 3..8`), Stage Timer + `APPLY SUGGESTED TIME`, and Difficulty Tag (`normal`, `hard`, `super_hard`).
  - Panel 2: Mode 1 (`Paint Solved State` with 8-color brushes, Eraser, multi-step Undo, Clear), Mode 2 (`Unsolve / Scramble` using `<TorusGrid>`, Undo, `Reset to Solved`, Seeded `Auto Unsolve in X Steps`, live `Matched Frames: k / M`, IDA\* `Solver Par`, `Suggested Timer`), and Mode 3 (`Playtest` with live timer, 3-Star bar, and `HINT`).
  - Panel 3: `SAVE AS LEVEL X` (with overwrite confirmation) and `INSERT AT LEVEL X (SHIFT +1)`.
- [ ] **4.3 Author 10 Starter Campaign Levels (`src/config/levels.json`)**:
  - Populate 10 progressive, IDA\*-verified levels (`3×3` onboarding -> `4×4` core -> `4×6` Hard -> `4×8` Super Hard).

---

### Batch 2: Zustand Store, Game Loop, Splash, In-Game & Meta Screens

#### Phase 5: Zustand Store & Game Loop (`src/store/gameStore.ts` & `src/hooks/useGameLoop.ts`)
- [ ] **5.1 Zustand Store (`src/store/gameStore.ts`)**:
  - Persist middleware (`name: 'grid-snap-save'`, `version: 1`) saving `{ coins, lives, lastLifeRegenAt, unlockedLevel, levelStars, hasSeenTutorial, settings }`.
  - Ephemeral boot state (`isGameStarted: false`, `startGame()`).
  - Heart Escrow (`startLevel` deducts `1 ❤️` upfront; win refunds `1 ❤️` capped at `max(maxLives, livesBeforeStart)` + flat `+200 Coins` + increments `unlockedLevel`; quit/timeout forfeits escrowed heart and keeps `unlockedLevel` selected for retry).
  - Boosters (`useHintBooster` `$50`, `useExtraTimeBooster` `$100`, `useOutOfTimeRescue` `$200`), `syncLifeRegeneration()`, and `claimKoFiStorePack(packId)` (`@capacitor/browser` on Android / `window.open` on Web).
- [ ] **5.2 Lifecycle & Timer Hook (`src/hooks/useGameLoop.ts`)**:
  - `requestAnimationFrame` delta timer, `visibilitychange` auto-pause, and `@capacitor/app` Android hardware `backButton` listener.

#### Phase 6: In-Game Screen & All 5 Modals (`src/components/`)
- [ ] **6.1 In-Game View (`src/components/screens/InGameView.tsx`)**:
  - Top HUD (Coin pill, `LVL.{X}`, `||` Pause button, `⏳ MM:SS` timer pill, `economy.json`-driven 3-Star Milestone Progress Bar with double-tap star Debug trigger), elastic center `<TorusGrid>`, and bottom `💡 HINT ($50)` + `+5S EXTRA TIME ($100)` buttons.
- [ ] **6.2 Modal Overlays (`src/components/modals/`)**:
  - `TutorialOverlay.tsx` (Level 1 first launch; pauses timer until tapped).
  - `PauseModal.tsx` (`RESUME` and `QUIT` with `YOU WILL LOSE 1 ❤️` warning).
  - `LevelCompleteModal.tsx` (`LEVEL {X} CLEAR!`, 3 pixel stars, status banner, `TIME` without `BEST!`, `SHIFTS`, `COINS: +200`, `NEXT LEVEL ▶`, top-right `✕`).
  - `OutOfTimeModal.tsx` (`TIME'S UP!`, top-right `✕` with `-1 ❤️` penalty badge below, stats, `+30 SECONDS ▶ ($200)` disabled with crimson `$ 200` text when `coins < 200`).
  - `SettingsModal.tsx` (`MUSIC`, `SFX`, and `COLORBLIND` `ON/OFF` switches + double-tap `⚠ RESET PROGRESS`).

#### Phase 7: Boot Splash Screen & Meta Screens (`SplashScreen`, `MainMenuView`, `ItemStoreView`)
- [ ] **7.1 Boot Splash Screen (`src/components/SplashScreen.tsx`)**:
  - Full-bleed cover overlay inside `<BoundingBox width={450} height={800}>` (`z-index: 100`) displaying `AssetLoader.resolvePath('splash.webp')`.
  - Smooth `0%–100%` loading bar at `top: 63%` below `"GRID SNAP"` logo (`LOADING CARTRIDGE...` → `CARTRIDGE READY` + `{progress}%`, 16-bit progress bar, pulsing `TAP TO CONTINUE` prompt + `Space`/`Enter`), `450ms` scale/fade exit, and WebAudio unlock.
- [ ] **7.2 Main Menu Screen (`src/components/screens/MainMenuView.tsx`)**:
  - Top Coin & Heart HUD capsules (`FULL` with no timer when `lives >= 5`, `MM:SS` timer when `lives < 5`), `STORE` & `⚙` buttons, vertical Level Path (`unlockedLevel` at bottom, `HARD`/`SUPER HARD` badges, last-10 loop), `STAR COUNT` vanity bar + Share button, and `▶ PLAY` CTA.
- [ ] **7.3 Item Store Screen (`src/components/screens/ItemStoreView.tsx`)**:
  - `GET LIVES` (`5`, `10`, `20` Lives) and `GET COINS` (`500 C`, `1,200 C`, `5,000 C`) 3-column grids wired to Ko-fi `/2`, `/5`, `/10` tiers + inline `#toast` banner + `◀ BACK TO MENU`.
- [ ] **7.4 Root App Assembly (`src/App.tsx`)**:
  - Wire `SplashScreen`, `MainMenuView`, `InGameView`, `ItemStoreView`, all 5 modals, `useGameLoop`, and lazy `DebugPanel` inside `<BoundingBox width={450} height={800}>`.

---

### Batch 3: Audio System, Debug Mode & Production Builds

#### Phase 8: Audio System & Developer Debug Mode
- [ ] **8.1 Chiptune SFX & Music Controller (`src/audio/sfx.ts` & `src/audio/AudioManager.ts`)**:
  - Synthesize all 11 16-bit SFX cues via WebAudio + optional `public/audio/sfx/<key>.ogg` override support + dual-track music controller (`public/audio/music/menu.ogg|.mp3` and `gameplay.ogg|.mp3`) with silent missing-file fallback, `400ms` crossfade, and `35%` modal ducking.
- [ ] **8.2 Developer Debug Panel (`src/components/DebugPanel.tsx`)**:
  - Triggered by double-tapping any HUD star within `350ms`; includes `WIN LEVEL`, `GO TO LVL #`, `+1,000 COINS`, `+5 LIVES`, `-1 LIFE`, `REFILL TIME`, `FREEZE TIMER`, and sentinel `'__GRID_SNAP_DEBUG_PANEL__'`, gated behind `import.meta.env.VITE_DISABLE_DEBUG !== 'true'`.

#### Phase 9: Verification & Build Exports
- [ ] **9.1 Automated Tests & Typecheck**:
  - Run `npm test` (Vitest) and `npm run build` (`tsc -b && vite build`).
- [ ] **9.2 Itch.io Build & Sentinel Verification**:
  - Run `npm run build:itch` and verify `'__GRID_SNAP_DEBUG_PANEL__'` is absent from `dist/assets/*.js` and `dump/grid-snap-*-itch.zip` is generated.
- [ ] **9.3 Android APK Build**:
  - Run `npm run build:apk` and verify `dump/grid-snap-*-android.apk` is generated with custom launcher icons.

