# Game Design Document (GDD) — Grid Snap

### Related Documents
- [Technical Architecture](./architecture.md) - Zustand state management, 2D toroidal grid engine, IDA\* solver worker, audio manager, debug mode, and JSON schemas.
- [Art Direction & UI System](./art-direction.md) - `Color Shift 16-Bit Arcade` visual theme, color tokens, 3D tile bevels, colorblind shapes, pixel typography, animation, and audio specs.
- [Economy, Boosters & Progression](./economy-and-progression.md) - Heart escrow system, flat 200-coin clear reward, speed-based star ratings, `HINT` & `EXTRA TIME` boosters, and frictionless Ko-fi store.
- [UI/UX & Screen Flows](./ui-ux-and-flows.md) - Complete screen inventory, modal state flows, drag-only input rules, `ui-refs/` reference overrides, and `<BoundingBox>` container query rules.
- [Level Design & Level Editor](./level-design.md) - Reverse solved-to-unsolved authoring, multi-block same-color rules, standalone Level Editor (`npm run dev:editor`), IDA\* par solver, and last-10 campaign loop.

---

## 1. High Concept & Core Pillars

- **Title**: **Grid Snap** *(Design System: Color Shift 16-Bit Arcade)*
- **Genre**: Tactile Toroidal Grid Puzzle / Casual Arcade
- **Orientation & Target Viewport**: **Portrait (`450×800`)** — Cross-platform Web, Itch.io, and Android APK
- **Elevator Pitch**: A fast-paced, 16-bit handheld puzzle game where players cyclically shift rows and columns on a toroidal grid (`3×3` up to `4×8`) to snap colored blocks into fixed target wireframes before the clock runs out. With **unlimited moves**, speed is everything—the faster you solve, the more stars you earn.
- **Design Pillars**:
  1. **Tactile 16-Bit Physicality**: Every tile shift, frame snap, and button press feels like operating a chunky vintage handheld cartridge with crisp bevels, hard ink outlines, and zero visual blur.
  2. **Pure Speed & Spatial Flow (No Move Limits)**: Players are never punished for experimenting with row/column shifts. The sole adversary is the live countdown clock and the 3-star degradation bar.
  3. **Instant Readability Across Grid Sizes**: From compact `3×3` onboarding boards to dense `4×8` challenge matrices, fixed target frames and movable beveled blocks remain unmistakably distinct at a glance—with optional colorblind symbol overlays.

---

## 2. Core Gameplay Loop

```text
[Main Menu: Level Path] ──► [Tap ▶ PLAY (Holds 1 ❤️ in Escrow)] ──► [Analyze Fixed Target Frames]
         ▲                                                                     │
         │                                                                     ▼
[Advance to Next Level] ◄── [Refund 1 ❤️ + Earn 1–3★ & 200 Coins] ◄── [Drag Rows/Cols (Torus) & Snap All Blocks Before 00:00]
```

1. **Stage Launch (Heart Escrow)**: From the vertical Level Path on the Main Menu, the player taps `▶ PLAY` to enter the current active level (requires at least `1 ❤️` life). Starting a level immediately places **`1 ❤️` in escrow** (deducted upfront from persisted `lives` so force-closing or reloading mid-level cannot bypass the life penalty).
2. **Board Analysis**: The level starts with:
   - **Fixed Target Frames** anchored to specific `(row, col)` cells.
   - **Colored & Neutral Blocks** distributed across the grid in an unsolved configuration.
   - A stage **Countdown Timer** (`⏳ MM:SS`) and a live **3-Star Milestone Progress Bar**.
3. **Toroidal Shifting & Snapping**: The player drags any row horizontally or any column vertically across one or more cells. Blocks wrap around the opposite edge of the board like a 2D torus. When a colored block lands on a matching colored target frame, it **snaps** into place.
4. **Resolution, Rewards & No-Replay Progression**:
   - **Win**: When **all** target frames simultaneously hold matching colored blocks before `00:00`, the timer stops, the escrowed **`1 ❤️` is refunded** (capped at `max(maxLives, livesBeforeStart)`), and the **Level Complete** modal awards **1 to 3 Stars** (based on `timeRemaining / timeLimitSeconds`) plus a flat **`+200 Coins`**. Completed levels advance `unlockedLevel` and **cannot be replayed** by design.
   - **Timeout / Quit**: If the timer hits `00:00`, the **Out of Time** modal appears, offering a **`+30 SECONDS` (`$200`)** rescue. Closing the Out of Time modal (`✕`) or quitting from the Pause menu (`QUIT`) forfeits the escrowed `1 ❤️` and returns to the Main Menu **with the same level still selected** (which serves as the retry state).

---

## 3. Core Mechanics & Board Rules

### 3.1 Dynamic Grid Dimensions (`3×3` to `4×8`)
Each level defines a rectangular matrix of `cols × rows`:
- **Minimum Grid Size**: **`3 × 3`** (`9` cells — used for onboarding and fast introductory stages).
- **Standard Grid Size**: **`4 × 4`** (`16` cells — core arcade puzzle format).
- **Intermediate Grid Sizes**: **`3 × 4`**, **`4 × 5`**, **`4 × 6`**, **`4 × 7`**.
- **Maximum Grid Size**: **`4 × 8`** (`32` cells — high-density `HARD` and `SUPER HARD` stages).

Every cell `(r, c)` on the grid is always populated by a tile (either a **Colored Block** or a **Neutral Filler Block**)—there are no empty gaps in the matrix, and there are no decoy blocks or decoy frames (every placed block corresponds to a matching frame).

### 3.2 Dual-Layer Cell Architecture
To make the toroidal shifting and snapping mechanics intuitive and deterministic, each cell `(r, c)` is composed of two independent layers:

| Layer | Behavior During Row/Col Shift | Visual Representation |
| :--- | :--- | :--- |
| **1. Static Frame Layer (`frames[r][c]`)** | **Fixed in place** — never moves when rows or columns are shifted. | Color-coded dashed wireframe (`2px–3px dashed`) with a matching `12%` tinted background and a colored center pip when unoccupied by a matching block (or a colorblind symbol pip when Colorblind Mode is enabled). |
| **2. Movable Block Layer (`grid[r][c]`)** | **Shifts cyclically** along the active row or column with toroidal wrap-around. | Solid 3D beveled plastic block in one of the **8 Arcade Colors** (`ruby`, `emerald`, `cobalt`, `yellow`, `purple`, `tangerine`, `cyan`, `magenta`) OR a recessed **Neutral Tile** (`#F8F5EB` with a `#BCB199` center pip). |

### 3.3 Toroidal (Cyclic) Multi-Cell Shifting System
A single shift action on row `r` or column `c` can rotate that line by any signed cell distance `distance` (or normalized positive distance $k \in [1, L-1]$):
- **Row Shift on Row `r` by `distance` (`◄` negative / `►` positive)**:
  - Every block at `(r, c)` moves to `(r, ((c + distance) % cols + cols) % cols)`.
  - Blocks pushed off the left or right edge wrap seamlessly around the opposite edge of row `r`.
- **Column Shift on Column `c` by `distance` (`▲` negative / `▼` positive)**:
  - Every block at `(r, c)` moves to `(((r + distance) % rows + rows) % rows, c)`.
  - Blocks pushed off the top or bottom edge wrap seamlessly around the opposite edge of column `c`.

### 3.4 Input Controls (Live Drag-and-Snap Only)
1. **Direct Grid Tap/Click & Drag**:
   - **Follow & Snap**: Touching or clicking a cell and dragging horizontally or vertically locks onto that row or column once pointer displacement exceeds **`30%` of a cell width** (axis-locked). The entire row/column follows the pointer live (with cloned ghost tiles on both ends inside an `overflow: hidden` mask for seamless wrap-around) and snaps to the nearest cell index on release (`110ms` commit animation).
   - **1 Gesture = 1 Move**: Dragging a row or column across multiple cells (e.g., 2 or 3 slots in a single drag) counts as **`1` move** (`shiftsCount += 1`) once committed. Releasing at `0` net displacement is a no-op and does not increment `shiftsCount`.
   - **Input Buffering**: Up to **`2` directional drag gestures** can be buffered during the `110ms` snap-commit animation so fast consecutive slides never drop.
2. **Decorative Bezel Arrows (Visual Only)**:
   - The chunky pixel arrow triangles (`▲`, `▼`, `◄`, `►`) along the outer arcade bezel frame are **visual framing indicators only** (`pointer-events: none`)—clicking or tapping the bezel arrows does not shift tiles.

### 3.5 Frame Snapping & Win Condition
- **Snapped State**: A target frame at `(r, c)` with required color `C` is **Snapped (Matched)** if and only if `grid[r][c] === C`. Blocks of the same color are completely interchangeable.
- **Non-Locking Shifts**: Snapped blocks are **not** frozen—if the player subsequently drags row `r` or column `c`, the snapped block moves with its row/column like any other block.
- **Level Clear Condition**: Evaluated immediately after every committed drag gesture. When **every** target frame on the board is simultaneously in the **Snapped** state while `timeRemaining > 0`:
  1. Board input locks immediately and the countdown timer halts.
  2. The escrowed `1 ❤️` is refunded to the player's life total.
  3. All snapped frames play a celebratory lock-in flash.
  4. The **Level Complete** modal opens with the earned Star Rating, solve time, total shifts count, and **`+200` Coin reward**.

### 3.6 Unlimited Moves & Shift Counter
- **No Move Limit**: Players can perform as many shifts as needed without move-count failure or star penalties.
- **Session Shift Counter**: Total committed drag gestures (`shiftsCount`) are recorded during the level and displayed as a performance stat on the **Level Complete** (`SHIFTS: 18 MOVES`) and **Out of Time** (`MOVES: 24 SHIFTS`) summary panels.

---

## 4. Countdown Timer & Speed-Based Star Rating

Each level specifies a `timeLimitSeconds` (e.g., `45s`, `60s`, `90s`). As the timer ticks down, the HUD's **3-Star Milestone Progress Bar** drains from `100%` to `0%`. Both the star rating evaluation and the HUD star marker positions (`left: %`) are driven directly by `starThresholds` in `src/config/economy.json`:

| Star Tier | Time Remaining Threshold (`economy.json`) | Banner / Label | Description |
| :---: | :---: | :--- | :--- |
| **3 Stars (★★★)** | **`> 50%`** (`threeStarMinRatio: 0.50`) | `★ PERFECT SOLVE! ★` | Gold Master speed clear; all 3 stars remain lit on the HUD bar. |
| **2 Stars (★★☆)** | **`15% – 50%`** (`twoStarMinRatio: 0.15`) | `★ GREAT CLEAR! ★` | Silver speed clear; 3rd star on the HUD bar dims to inactive taupe (`#D2C7AA`). |
| **1 Star (★☆☆)** | **`< 15%`** of stage time remaining | `★ STAGE CLEAR! ★` | Bronze clear; 2nd and 3rd stars dim, 1st star at `0%` mark remains guaranteed on completion. |

- **Saving Stars with Boosters & Rescues**: Because completed levels cannot be replayed, using **EXTRA TIME (`+5S`, capped at `timeLimitSeconds`)** or the **Out-of-Time Rescue (`+30 SECONDS`, sets `timeRemaining = min(30, timeLimitSeconds)`)** intentionally restores time on the bar and **can earn 2★ or 3★** if the player solves before the restored time drops below the star thresholds. There is no `1★` cap after a rescue.

---

## 5. Economy, Boosters & Campaign Loop Summary

- **Lives (`❤️` Escrow) & Coins (`$`)**: Players hold up to `5` passive Hearts (`30:00` regen per heart; displays `FULL` with no timer when `lives >= 5`). Starting a level holds `1 ❤️` in escrow and refunds it on victory. Every level clear awards a flat **`+200 Coins`** (`0` coins on loss).
- **In-Game Boosters & Rescue**:
  - **HINT (`$50`)**: Uses the hybrid IDA\* + cached-path solver to highlight the optimal next row/column, direction, and cell distance with a pulsing line border and animated ghost hand until the player's next move.
  - **EXTRA TIME (`$100`)**: Adds `+5s` immediately to the live countdown clock (capped at `timeLimitSeconds`).
  - **Out-of-Time Rescue (`$200`)**: Sets `timeRemaining = min(30, timeLimitSeconds)` when time expires so the player can finish the board, keep their heart, and salvage stars. If `coins < 200`, the button is disabled and the `$200` badge renders in crimson red.
- **Interim End-of-Campaign Loop**: Until procedural generation is added, once a player completes all `N` hand-crafted levels in `src/config/levels.json`, subsequent levels (`L > N`) cycle through the **last 10 hand-crafted levels** (`levels[N - 10 .. N - 1]`) while the displayed level number continues incrementing (`LVL. N+1`, `LVL. N+2`, ...).
- **Frictionless Ko-fi Store (Itch & Local APK Only)**: The Item Store offers **GET LIVES** (`5`, `10`, `20` Lives) and **GET COINS** (`500 C`, `1,200 C`, `5,000 C`) packs. Tapping `BUY` opens the corresponding Ko-fi tier (`https://ko-fi.com/ishanmanjrekar/2`, `/5`, or `/10`) via `@capacitor/browser` on Android or `window.open(..., '_blank')` on Web with zero redirect popups and immediately credits the items in-game.
- Full details are documented in [Economy, Boosters & Progression](./economy-and-progression.md) and [UI/UX & Screen Flows](./ui-ux-and-flows.md).

---

## 6. Accessibility, Audio & Settings

- **Audio (`MUSIC` & `SFX`)**: 16-bit chiptune sound effects (synthesized via WebAudio with optional `.ogg` overrides) and looping background music tracks for both the **Main Menu** and **In-Game** views (crossfaded on screen transitions and ducked under modals). Both can be toggled independently in Settings.
- **Colorblind Mode (`COLORBLIND ON/OFF`)**: Toggling Colorblind Mode in the Settings modal renders a subtle, unique geometric icon for each of the 8 colors on both the **movable block faces** and the **unoccupied target frame center pips**.
