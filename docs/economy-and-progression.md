# Economy, Boosters & Progression Specification

### Related Documents
- [Game Design Document](./game-design.md) - Master index, core gameplay loop, toroidal shifting mechanics, and win/loss conditions.
- [Technical Architecture](./architecture.md) - Zustand state persistence, heart escrow math, IDA\* hint solver, Ko-fi store handlers, and `src/config/economy.json` schema.
- [Art Direction & UI System](./art-direction.md) - Visual tokens for currency capsules, booster buttons, colorblind shapes, and store cards.
- [UI/UX & Screen Flows](./ui-ux-and-flows.md) - HUD counter placements, Item Store layout, and modal reward/penalty flows.
- [Level Design & Level Editor](./level-design.md) - Reverse solved-to-unsolved authoring, multi-block same-color rules, standalone Level Editor (`npm run dev:editor`), IDA\* par solver, and last-10 campaign loop.
- [Implementation Plan & Progress Harness](./progress.md) - Live 9-phase build checklist, session status tracker, and verification gates.

---

## 1. Currencies & Session Energy

### 1.1 Lives System (Hearts `❤️` & Escrow Model)
| Parameter | Default Value | Config Key | Behavior & Rules |
| :--- | :---: | :--- | :--- |
| **Passive Max Capacity** | `5` Hearts | `maxLives` | Passive time-based regeneration stops once `lives >= 5`. When `lives >= 5`, the HUD capsule displays **`FULL`** and hides the countdown timer. |
| **Starting Lives** | `5` Hearts | `startingLives` | New players begin with a full tank of `5` Hearts. |
| **Regeneration Interval** | `30:00` (`1800s`) | `lifeRegenIntervalSeconds` | Regenerates `+1 ❤️` every 30 minutes while `lives < 5` (calculated via persisted timestamps so offline time counts). |
| **Heart Overflow Support** | Unlimited (`> 5`) | `allowLifeOverflow: true` | Claiming `5`, `10`, or `20` Lives in the Item Store adds directly to `lives` even if already at or above `5` (e.g., `4 + 10 = 14 ❤️`), matching `lootbox-go`. |

#### Heart Escrow Lifecycle (Anti-Force-Close Exploitation)
To prevent players from bypassing life penalties by refreshing the browser tab, killing the app, or pressing the Android Back button mid-level, **Grid Snap** uses a **Heart Escrow** model:
1. **Level Start (`-1 ❤️` Escrow Hold)**: Tapping `▶ PLAY` (or `NEXT LEVEL ▶`) records `livesBeforeStart = state.lives`, immediately deducts **`1 ❤️`** from persisted `lives`, and sets `escrowActive = true`. (Because active session state is not persisted to `localStorage`, closing or reloading the app mid-level permanently forfeits the escrowed heart).
2. **Winning the Level (`+1 ❤️` Escrow Refund)**: When all target frames are snapped before `00:00`, the escrowed heart is refunded up to **`max(maxLives, livesBeforeStart)`** (`lives = Math.min(Math.max(maxLives, livesBeforeStart), lives + 1)`) and `escrowActive` resets to `false`. This prevents passive regeneration during a match from combining with the refund to overflow past `maxLives`, while preserving any store-purchased overflow (`livesBeforeStart > 5`).
3. **Quitting Mid-Game or Timing Out Without Reviving (Escrow Forfeited)**:
   - Tapping `QUIT` inside the **Pause Modal** (warned via `YOU WILL LOSE 1 ❤️` below the button) or tapping the top-right crimson `✕` button on the **Out of Time (`TIME'S UP!`) Modal** (badged with `-1 ❤️` beneath the close button) simply clears `escrowActive = false` without deducting a second heart and returns to the Main Menu **with the same level selected**.
4. **Zero Lives Gate (`lives === 0`)**: Tapping `▶ PLAY` on the Main Menu (or `NEXT LEVEL ▶`) when `lives === 0` routes the player directly to the **Item Store** (`GET LIVES` section).

---

### 1.2 Coin Currency (`🪙` Coins)
Coins are the primary soft currency used for tactical in-game boosters (`HINT`, `EXTRA TIME`) and emergency `Out-of-Time` rescues.

#### Coin Sources
1. **First-Time Level Completion Reward (`+200 🪙`)**:
   - Every newly cleared frontier level awards a flat **`+200 Coins`** (`levelClearReward: 200` in `src/config/economy.json`), regardless of star tier or stage difficulty tag (`NORMAL`, `HARD`, `SUPER HARD`).
   - **No Replay Coin Farming (`+0 Coins` on Replay)**: Replaying a previously cleared level (`activeLevelId < unlockedLevel` or already recorded in `levelStars`) awards **`0 Coins`**. Replays are solely for increasing earned stars (`1–3★`) and setting new **`BEST!`** time or least-moves records.
   - **Losing / Timing Out**: Awards **`0 Coins`**. Stage difficulty tags (`HARD`, `SUPER HARD`) are visual milestones on unsolved/frontier Main Menu nodes.
2. **Starting Wallet Balance**: Configurable in `src/config/economy.json` (`startingCoins: 250`, giving new players enough coins to sample `HINT` and `EXTRA TIME`).
4. **Live Remote Economy & Store Sync (`src/utils/remoteData.ts`)**:
   - All economy parameters (`maxLives`, `lifeRegenIntervalSeconds`, `levelClearReward`, `starThresholds`, `boosters`, and `storePacks`) are initialized in `useGameStore` from the bundled `src/config/economy.json` and refreshed on boot in production builds from `https://raw.githubusercontent.com/ishanmanjrekar/grid-snap/main/src/config/economy.json` (with a `3000ms` timeout and schema validation fallback). Pushing changes to `src/config/economy.json` on the `main` branch updates deployed Itch.io and Android APK builds automatically without rebuilding.

---

## 2. In-Game Boosters & Emergency Revive

During an active match, the bottom HUD features two dedicated rectangular arcade cartridge buttons, plus an emergency rescue option if the clock expires:

| Booster / Action | Coin Cost | Effect | Availability & Constraints |
| :--- | :---: | :--- | :--- |
| **HINT (`💡 HINT`)** | **`50 🪙`** | Queries the hybrid IDA\* + cached-path solver for the optimal next move from the current board state and highlights the target row or column with a pulsing frame outline and an animated ghost hand showing the exact slide direction and cell distance. The visual hint remains active until the player commits their next move. | Unlimited uses per level. Disabled when `activeHint !== null`, `isSolved`, or `coins < 50`. When `coins < 50`, the `50` cost label renders in crimson red (`#EF4444`). Deducts `50` Coins when the hint is displayed. |
| **EXTRA TIME (`+5S`)** | **`100 🪙`** | Immediately adds **`+5 seconds`** to `timeRemaining` on the active countdown clock (`timeRemaining = Math.min(timeLimitSeconds, timeRemaining + 5)`). | Can be used multiple times per stage. Capped at `timeLimitSeconds` so the 3-Star progress bar never overflows `100%`. **Intentionally restores star rating potential** if `timeRemaining` crosses back above the `15%` (2★) or `50%` (3★) thresholds. Disabled (with crimson `100` text) when `coins < 100` or `timeRemaining >= timeLimitSeconds`. |
| **OUT-OF-TIME RESCUE (`+30 SECONDS ▶`)** | **`200 🪙`** | Offered on the **`TIME'S UP!`** modal when `timeRemaining` hits `00:00`. Deducts `200` Coins, sets `timeRemaining = Math.min(30, timeLimitSeconds)`, closes the modal, and resumes the current board state while preserving the escrowed `1 ❤️`. | **Disabled when `coins < 200`**, with the `200` cost badge text rendered in **crimson red (`#EF4444`)** to signify insufficient funds (does not navigate away mid-level). **No star cap**: rescuing is a valid way to save 2★ or 3★ on the current attempt if the player finishes while `timeRemaining / timeLimitSeconds` is still above the star thresholds. |

---

## 3. In-Game Item Store & Frictionless Ko-fi Flow

### 3.1 Store Philosophy (Honor-System Grant / Zero Redirect Popups)
Following the proven implementation in `lootbox-go` (`claimKoFiPinatas`), **Grid Snap** targets **Itch.io web builds and local/sideloaded Android APKs** (not Google Play Store billing) and does **not** integrate a real payment wall:
1. **Direct External Browser Navigation**: Tapping any `BUY` button in the Store opens the corresponding Ko-fi tier URL:
   - On **Capacitor Android (`Capacitor.isNativePlatform()`)**: Invokes `@capacitor/browser` (`Browser.open({ url: pack.kofiUrl })`).
   - On **Web / Itch.io**: Synchronously invokes `window.open(pack.kofiUrl, '_blank')` directly inside the click handler.
2. **No Redirect Popups on Itch.io**: The game **never** calls `window.confirm()`, `window.alert()`, or displays an intermediate "Redirecting to external site..." modal before or after opening the Ko-fi link.
3. **Instant In-Game Grant**: Clicking `BUY` immediately and unconditionally adds the pack's Lives or Coins to the player's persisted `gameStore` balance and displays the inline retro green toast strip (`#toast`: e.g., `PURCHASED 5 LIVES!` or `ADDED 500 COINS!`) inside the Store view for `1.6s`.

### 3.2 Store Catalog & Ko-fi Tier Mapping
Both store sections (**GET LIVES** and **GET COINS**) are arranged in a clean 3-column grid (without any decorative right-side sub-badges like `EXTRA TRY` or `SPECIALS` in the section headers) where the left, middle, and right columns map to the `/2`, `/5`, and `/10` Ko-fi links respectively:

#### Section 1: `GET LIVES` (Crimson Header Banner)
| Column | Pack Label | In-Game Grant | Button Style | Target Ko-fi URL |
| :--- | :---: | :---: | :---: | :--- |
| **Left** | `5 LIVES` | `+5 ❤️` Lives | Emerald `BUY` (`#10B981`) | `https://ko-fi.com/ishanmanjrekar/2` |
| **Middle** | `10 LIVES` | `+10 ❤️` Lives | Emerald `BUY` (`#10B981`) | `https://ko-fi.com/ishanmanjrekar/5` |
| **Right** | `20 LIVES` | `+20 ❤️` Lives | Emerald `BUY` (`#10B981`) | `https://ko-fi.com/ishanmanjrekar/10` |

#### Section 2: `GET COINS` (Arcade Gold Header Banner)
| Column | Pack Label | In-Game Grant | Button Style | Target Ko-fi URL |
| :--- | :---: | :---: | :---: | :--- |
| **Left** | `500 C` | `+500 $` Coins | Gold `BUY` (`#FBBF24`) | `https://ko-fi.com/ishanmanjrekar/2` |
| **Middle** | `1,200 C` | `+1,200 $` Coins | Gold `BUY` (`#FBBF24`) | `https://ko-fi.com/ishanmanjrekar/5` |
| **Right** | `5,000 C` | `+5,000 $` Coins | Gold `BUY` (`#FBBF24`) | `https://ko-fi.com/ishanmanjrekar/10` |

---

## 4. Level Progression, Replayable Path & Record Tracking

### 4.1 Scrollable Vertical Level Path & Replay Rules
- The Main Menu features a scrollable vertical progression track anchored around the player's **Current Frontier Level (`unlockedLevel`)** and **Selected Level (`selectedLevelId`)**.
- **Top Scroll Cap (Locked Preview Nodes)**: Rendered above `unlockedLevel` along a continuous vertical dashed connector line:
  - `unlockedLevel + 3`: Dashed preview block (`#EDE5D3` with `opacity-60`) marking the hard top scroll limit.
  - `unlockedLevel + 2` and `unlockedLevel + 1`: Locked cream cards (`#FFFDF8`) with optional cosmetic difficulty tags:
    - **`HARD`**: Crimson Red badge (`#EF4444`)
    - **`SUPER HARD`**: Arcade Purple badge (`#9333EA`)
- **Bottom Scroll Reveal (Solved Levels `unlockedLevel - 1 .. 1`)**:
  - Scrolling down below `unlockedLevel` reveals all previously solved levels down to **Level 1**.
  - Solved nodes hide `HARD` / `SUPER HARD` badges and instead display their **3-star rating row** (`1–3` lit `⭐` icons).
- **Selecting & Replaying**:
  - Tapping any playable node (`1 .. unlockedLevel`) selects it (`selectedLevelId`) as the large beveled Emerald Green block (`#28C76F`). Tapping the already-selected green node or the bottom **`▶ PLAY`** button starts that level (still holding `1 ❤️` in escrow; replaying Level 1 re-triggers the full guided FTUE tutorial).
  - **On Win**: Completing `activeLevelId` upgrades `unlockedLevel` (`Math.max(unlockedLevel, activeLevelId + 1)`), advances `selectedLevelId` sequentially to `activeLevelId + 1`, and awards `+200 Coins` on first clears (`+0 Coins` on replays).
  - **On Fail / Quit**: Closing the Out of Time modal or quitting from Pause returns to the Main Menu with the same `selectedLevelId` retained for immediate retry.
- **Interim End-of-Campaign Loop (Last 10 Levels Repeat)**:
  - Until procedural level generation is enabled, when `unlockedLevel > N` (where `N` is the total number of hand-crafted levels in `src/config/levels.json`), the game loops through the **customizable `campaignLoop` sequence** (defaulting to the last `min(10, N)` levels) with deterministic 3-way reflections, while the displayed stage number (`LVL. X` and level path nodes) continues incrementing seamlessly.

### 4.2 Speed-Based Star Rating, Best Records & Vanity Star Count
- Each cleared level `id` permanently records its highest achieved star count (`levelStars[id] = Math.max(prevBest, earnedStars)`), fastest integer clear time (`levelBestTime[id]`), and lowest winning move count (`levelLeastMoves[id]`).
- Replaying an older level can increase its star rating (never downgrading a higher prior rating) and triggers **`BEST!`** badges on the **Level Complete** modal whenever the player clears a stage for the first time or strictly beats their previous best time or least moves.
- **Total Star Count**: The cumulative sum of stars earned across all cleared levels (`∑ levelStars[id]`) is displayed prominently on the Main Menu's bottom vanity bar (`⭐ STAR COUNT: 72`).
- **Share Button (`share` Icon)**: Tapping the square Share button next to the Star Count bar invokes the Web Share API (`navigator.share`) on mobile/Capacitor—or copies a formatted challenge invitation (`Testing my spatial logic in Grid Snap — made it to Level {unlockedLevel} with ⭐ {totalStars} Stars!\n\nLooking for a real puzzle challenge? Try it here:\nhttps://playable-things.itch.io/grid-snap`) to the clipboard on desktop browsers with an inline toast confirmation (`COPIED STATS!`).
