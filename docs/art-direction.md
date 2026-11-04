# Art Direction & UI Design System

### Related Documents
- [Game Design Document](./game-design.md) - Master index, core gameplay loop, toroidal shifting mechanics, and win/loss conditions.
- [Technical Architecture](./architecture.md) - Zustand state management, 2D toroidal grid engine, IDA\* solver worker, `AudioManager`, debug mode, and JSON schemas.
- [Economy, Boosters & Progression](./economy-and-progression.md) - Heart escrow system, flat 200-coin clear reward, speed-based star ratings, `HINT` & `EXTRA TIME` boosters, and frictionless Ko-fi store.
- [UI/UX & Screen Flows](./ui-ux-and-flows.md) - Complete screen inventory, modal state flows, drag-only input rules, `ui-refs/` reference overrides, and `<BoundingBox>` container query rules.
- [Level Design & Level Editor](./level-design.md) - Reverse solved-to-unsolved authoring, multi-block same-color rules, standalone Level Editor (`npm run dev:editor`), IDA\* par solver, and last-10 campaign loop.
- [Implementation Plan & Progress Harness](./progress.md) - Live 9-phase build checklist, session status tracker, and verification gates.

---

## 1. Creative North Star & Visual Philosophy

- **Design System Name**: **`Color Shift 16-Bit Arcade`**
- **Source of Truth Priority**: **This document (`docs/art-direction.md`) is the canonical source of truth** and supersedes any conflicting typography or token entries inside `ui-refs/color_shift_16_bit_arcade_1/DESIGN.md` or `ui-refs/color_shift_16_bit_arcade_2/DESIGN.md`.
- **Aesthetic Direction**: **Neo-Retro 16-Bit Tactile Handheld** — inspired by classic Japanese arcade puzzle cabinets and 90s color handheld cartridges.
- **Core Visual Rules**:
  1. **Crisp Pixel & Hard-Edge Geometry**: `image-rendering: pixelated` across all icons, SVGs, and canvases. Containers, tiles, badges, and buttons use sharp `0px`–`2px` corners—no pill radii or feathered drop shadows.
  2. **Heavy Espresso Ink Outlines**: Every card, HUD capsule, button, and puzzle block is framed by a solid `2px` to `4px` dark charcoal ink border (`#2C2523` / `#1E1B18`).
  3. **Hard Offset Drop Shadows & Microswitch Physics**: Depth is rendered exclusively via solid offset shadows (`2px 2px 0 #2C2523` up to `6px 6px 0 #2C2523`). Pressing any interactive button physically translates it down-right (`translate(2px, 2px)`) while collapsing its shadow, mimicking a real arcade microswitch.
  4. **Warm Parchment Substrate**: Instead of harsh pure white or dark-mode black, the app canvas uses warm vintage newsprint cream (`#F4EFE6` / `#F7F3E9`), making the saturated 3D beveled puzzle blocks pop with zero eye fatigue.

---

## 2. Color Palette & CSS Tokens (`src/index.css`)

The project uses **Tailwind CSS v4 (`@tailwindcss/vite`)** with native container query support (`@container`) alongside the following CSS custom properties in `:root` inside `src/index.css`:

```css
:root {
  /* Base Canvas & Hardware Surfaces */
  --canvas-bg: #F4EFE6;          /* Warm vintage cream app background */
  --surface-card: #FFFDF8;       /* Crisp parchment card & HUD fill */
  --surface-modal: #F6F1DC;      /* Popup dialog parchment fill */
  --surface-bezel: #EAE2CA;      /* Handheld console outer bezel frame */
  --surface-tray: #D1C6A5;       /* Recessed grid matrix tray fill */
  --surface-tray-shadow: #9E9375;/* Inset shadow for recessed matrix tray */
  --surface-neutral: #F8F5EB;    /* Neutral filler block face */
  --arcade-ink: #2C2523;         /* Primary structural border, text & shadow ink */
  --arcade-ink-deep: #1E1B18;    /* High-contrast menu ink */

  /* Semantic UI Accents */
  --accent-gold: #FBBF24;        /* Primary PLAY CTA, Coins, Ribbons (#F8B800 / #FFC021) */
  --accent-gold-dark: #D97706;   /* Coin bevel & shadow */
  --accent-emerald: #22C55E;     /* Active Level node, RESUME, NEXT LEVEL, BUY Lives */
  --accent-emerald-dark: #15803D;/* Emerald shadow bevel */
  --accent-crimson: #EF4444;     /* Hearts, Close (X), TIME'S UP, HARD badge, Insufficient funds */
  --accent-crimson-dark: #B91C1C;/* Crimson shadow & penalty border */
  --accent-mint: #5EEAD4;        /* Main Menu STORE button fill */
  --accent-sky: #4DA2FF;         /* Star progress bar fill */
  --accent-purple: #9333EA;      /* SUPER HARD difficulty badge */
}
```

---

## 3. Puzzle Block, Target Frame & Colorblind Shape Palette (8 Arcade Colors)

Every movable color block uses a 4-part 3D pixel bevel (`background-color`, top-left inner highlight `inset 2px 2px 0`, bottom-right inner shade `inset -2px -2px 0`, bottom lip `0 2.5px 0`, and `1.5px–2px solid` border). Every fixed target frame uses a matching `2px–3px dashed` border, `12%` alpha background tint, and a centered indicator pip (`#slot-pip`):

| Color ID | Base Hex | Top-Left Highlight | Bottom-Right Shade | Bottom Lip / Border | Target Frame (`slot-*`) Border & Tint | Colorblind Shape Symbol |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`neutral`** *(Filler)* | `#F8F5EB` | `#FFFFFF` | `#DDD2BA` | `#9E937D` / `#332B25` | N/A *(Center dot: `#BCB199`)* | None |
| **`ruby`** *(Crimson Red)* | `#EF4444` | `#FFA3A8` | `#B91C1C` | `#7F1D1D` / `#2B1810` | `dashed #DC2626` / `rgba(239, 68, 68, 0.12)` | **Circle (`●`)** |
| **`emerald`** *(Green)* | `#22C55E` | `#86EFAC` | `#15803D` | `#14532D` / `#14281A` | `dashed #16A34A` / `rgba(34, 197, 94, 0.12)` | **Triangle (`▲`)** |
| **`cobalt`** *(Blue)* | `#3B82F6` | `#93C5FD` | `#1D4ED8` | `#1E3A8A` / `#132238` | `dashed #2563EB` / `rgba(59, 130, 246, 0.12)` | **Square (`■`)** |
| **`yellow`** *(Amber Gold)* | `#F59E0B` | `#FDE68A` | `#B45309` | `#451A03` / `#78350F` | `dashed #D97706` / `rgba(245, 158, 11, 0.12)` | **Diamond (`◆`)** |
| **`purple`** *(Vivid Violet)* | `#A855F7` | `#D8B4FE` | `#7E22CE` | `#3B0764` / `#581C87` | `dashed #9333EA` / `rgba(168, 85, 247, 0.12)` | **Star (`★`)** |
| **`cyan`** *(Turquoise)* | `#06B6D4` | `#A5F3FC` | `#0891B2` | `#155E75` / `#164E63` | `dashed #0891B2` / `rgba(6, 182, 212, 0.12)` | **Cross (`✚`)** |
| **`tangerine`** *(Orange)* | `#F97316` | `#FDBA74` | `#C2410C` | `#7C2D12` / `#431407` | `dashed #EA580C` / `rgba(249, 115, 22, 0.12)` | **Pentagon (`⬟`)** |
| **`magenta`** *(Rose Pink)* | `#EC4899` | `#F9A8D4` | `#BE185D` | `#831843` / `#500724` | `dashed #DB2777` / `rgba(236, 72, 153, 0.12)` | **Heart (`♥`)** |

### 3.1 Colorblind Mode Symbol Overlay (`settings.colorblindMode`)
- **Default (`OFF`)**: Colored blocks render with clean bevel faces and no inner symbol; unoccupied target frames show a simple square colored center pip.
- **Enabled (`ON`)**:
  - **On Colored Blocks**: Renders the color's assigned crisp pixel SVG geometric shape (`~35%` of tile width) centered on the block face in the block's **Top-Left Highlight** color at `45%` opacity (`rgba(255,255,255,0.45)` blend), keeping the 3D plastic aesthetic intact.
  - **On Unoccupied Target Frames**: Replaces the generic center square pip with the matching colored geometric shape SVG (`~28%` of cell width) in the frame's border hue so colorblind players can immediately pair blocks with their target frames.

### 3.2 Snapped Visual State (When `grid[r][c] === frames[r][c]`)
When a colored block occupies its matching target frame:
1. The outer dashed frame switches to a solid bright highlight border (`2px solid #FFFFFF` with outer `2px solid` color ring) or crisp corner lock brackets.
2. A subtle pixel sparkle / inner lock pip confirms that the slot is currently **Snapped**.

---

## 4. Self-Hosted Typography & Pixel Icon System

To guarantee 100% offline reliability in Android APKs and zero CDN latency on Itch.io, **no Google Fonts or Material Symbols CDN `<link>` tags are used in production**:
- **Self-Hosted Font Files (`public/fonts/`)**:
  - Loaded via `@font-face` in `src/index.css` using relative asset paths compatible with `base: './'`:
    - **Display & Pixel Numerals (`--font-pixel`)**: `'Press Start 2P', monospace` (`PressStart2P-Regular.woff2`) — used for modal ribbon titles (`LEVEL 25 CLEAR!`, `TIME'S UP!`, `PAUSED`, `SETTINGS`), level node numbers (`25`), HUD counters (`99,999`, `00:56`), difficulty badges (`HARD`, `SUPER HARD`), and primary CTAs.
    - **Secondary Retro UI (`--font-retro`)**: `'Silkscreen', 'Space Mono', monospace` (`Silkscreen-Regular.woff2`, `Silkscreen-Bold.woff2`, `SpaceMono-Bold.woff2`) — used for supporting labels, tabular stats, and compact descriptions.
- **Inline Pixel Art SVGs (Replacing Material Symbols)**:
  - All icons that used `material-symbols-outlined` in the `ui-refs/` prototypes (`storefront`, `settings`, `share`, `warning`, `close`, `lightbulb`, `hourglass`) must be implemented as crisp inline pixel-grid `<svg>` components with `shape-rendering="crispEdges"`.
- **Formatting Rules**:
  - All button labels, badges, and headers use `text-transform: uppercase`.
  - Use container-query-relative font sizes (`clamp(8px, 2.5cqw, 12px)`) so text never overflows inside the `450×800` `BoundingBox`.

---

## 5. Elevation, Borders & Microswitch Button Rules

- **Standard Card / HUD Pill**: `border: 2px solid #2C2523` (or `3px`), `box-shadow: 2px 2px 0 0 #2C2523` (or `3px 3px 0 0 #2C2523`).
- **Floating Modal Window**: `border: 4px solid #2C2523`, `box-shadow: 6px 6px 0 0 #2C2523`, overhanging top ribbon (`-top-5`).
- **Interactive Button Press State**:
  ```css
  .pixel-btn {
    border: 3px solid #2C2523;
    box-shadow: 3px 3px 0px #2C2523;
    transition: transform 75ms steps(2, end), box-shadow 75ms steps(2, end);
  }
  .pixel-btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0px #2C2523;
  }
  ```
- **Decorative Bezel Arrows**: The `▲`, `▼`, `◄`, `►` triangles along the board bezel are non-interactive hardware detailing (`pointer-events: none`) and do not have hover or active button states.

---

## 6. Animation & Juice Specifications

1. **Live Toroidal Drag & Wrap-Around Ghost Tiles**:
   - While dragging row `r` or column `c`, the displaced line renders **1 cloned wrap-around tile on each end** (`index - 1` and `index + L`) inside the recessed matrix tray's `overflow: hidden` mask.
   - As the pointer drags across cells, the tile strip translates 1:1 with the pointer offset (`offsetPx mod (L * cellSizePx)`), so tiles sliding off one edge simultaneously enter from the opposite edge without visual popping.
   - On pointer release, the strip animates smoothly to the nearest snapped cell multiple over **`110ms`** (`easeOut`), commits the board state, and processes any buffered drag input (up to `2` queued gestures).
2. **HINT Booster Visual Overlay (`activeHint`)**:
   - When `HINT ($50)` is activated, the recommended row or column is framed by a pulsing bright gold/cyan pixel outline (`2px solid #FBBF24`, pulsing opacity/scale), and an animated pixel **ghost hand icon** slides along that row or column in the hint's `direction` across `distance` cells on a `650ms` repeating loop until the player performs their next move.
3. **Frame Snap Lock-In Pulse**:
   - When a committed shift causes a colored block to land on its matching target frame, the cell triggers a `150ms` scale pop (`scale: [1, 1.12, 1]`) and crisp white border flash.
4. **Active Frontier Star Pulse (`.pixel-star-active`)**:
   - Stepped 8-bit keyframe animation (`animation: pixelBlink 1.6s steps(2, start) infinite` oscillating between `scale(1)` and `scale(1.08)`).
5. **Victory Celebration**:
   - Upon solving the final frame, all matched frames flash in unison before the **Level Complete** modal zooms in (`scale: 0.9 -> 1.0`, `duration: 180ms`) with sequential pixel star pop-ins.
6. **Boot Splash Screen & Loading Bar (`SplashScreen.tsx` & `public/splash.webp`)**:
   - On initial boot, `SplashScreen.tsx` displays the optimized `public/splash.webp` cover illustration (`900×1650` WebP generated from `itch-assets/splash.png`) with a tactile 16-bit progress bar (`LOADING CARTRIDGE...` → `CARTRIDGE READY`, `#2C2523` hard ink border, `#FBBF24` → `#22C55E` fill) and a pulsing `TAP TO CONTINUE` prompt positioned below the `"GRID SNAP"` title (`top: 63%`). Tapping scales and fades the splash screen out (`scale(1.04)`, `opacity: 0` over `450ms`) while unlocking WebAudio.

---

## 7. Audio Direction (16-Bit Chiptune SFX & Music)

### 7.1 Sound Effects (`SFX` — WebAudio Synthesized Placeholders + Optional Asset Overrides)
All sound effects follow a crisp 16-bit handheld console aesthetic (square/triangle/noise channel synthesis via WebAudio API in `src/audio/sfx.ts`, with automatic override support if a matching `.ogg`/`.mp3` file is placed in `public/audio/sfx/`):

| SFX Key | Trigger Event | Acoustic Profile (Synthesized Placeholder Spec) |
| :--- | :--- | :--- |
| `drag_tick` | Pointer drag crosses a cell boundary during a row/col slide | Short `18ms` crisp square-wave mechanical click (`880Hz -> 1100Hz`). |
| `shift_commit` | Row/column snaps into its committed grid slot on release | Punchy `45ms` low-mid tactile thock (`320Hz -> 180Hz` triangle wave). |
| `frame_snap` | One or more colored blocks land inside matching target frames | Bright 2-note ascending chiptune chime (`C6 -> G6`, `90ms` square wave with duty cycle). |
| `hint_activate` | Player taps `HINT ($50)` and the ghost-hand guide appears | Mystical 3-note arpeggio ping (`E5 -> B5 -> E6`, `140ms`). |
| `extra_time` | Player taps `EXTRA TIME ($100)` or `+30 SECONDS ($200)` rescue | Rising power-up sweep (`440Hz -> 1320Hz` over `180ms`). |
| `button_tap` | Any UI button press (`PLAY`, `STORE`, modal buttons, toggles) | Snappy `25ms` microswitch blip (`660Hz`). |
| `error_buzz` | Tapping a disabled booster/rescue with insufficient coins | Double low-frequency square buzz (`150Hz -> 110Hz`, `120ms`). |
| `timer_warn` | Each second tick when `0 < timeRemaining <= 10` | Urgent high-pitched clock beep (`1480Hz`, `35ms`). |
| `level_win` | All target frames snapped (`Level Complete` trigger) | Upbeat 6-note 16-bit victory fanfare (`~650ms`) followed by per-star pop chimes (`star_pop_1`, `star_pop_2`, `star_pop_3` pitching up). |
| `level_timeout` | Countdown hits `00:00` (`TIME'S UP!` modal trigger) | Descending 4-note arcade fail trombone/synth (`A4 -> G#4 -> G4 -> F#4`, `450ms`). |
| `store_buy` | Claiming any Coin or Life pack in the Item Store | Classic dual-tone coin register ding (`B5 -> E6`, `160ms`). |

### 7.2 Looping Background Music (`MUSIC` — Menu & Gameplay Tracks)
- **User-Supplied Track Slots (`public/audio/music/`)**:
  - `public/audio/music/menu.ogg` (or `.mp3`): Played on the **Main Menu** and **Item Store** screens.
  - `public/audio/music/gameplay.ogg` (or `.mp3`): Played during active **In-Game** stages.
- **Graceful Fallback**: Because the music files will be added by the developer, `AudioManager` checks/fetches the track via `AssetLoader.resolvePath()` and fails silently (no console errors or crashes) if the music files are not yet present in `public/audio/music/`.
- **Transitions & Ducking**: Crossfades (`400ms`) when transitioning between Menu and In-Game, lowers gain to `35%` while a modal overlay (`Pause`, `Level Complete`, `Out of Time`, `Settings`) is open, and pauses automatically when `MUSIC` is toggled `OFF` or when the app/tab moves to the background (`visibilitychange`).
