# Game Design Document (GDD)

### Related Documents
- [Technical Architecture](./architecture.md) - State management, persistence, timers, and JSON configuration schemas.
- [Art Direction & UI System](./art-direction.md) - Visual theme, color tokens, typography, and animation specs.
<!-- AI RULE: Whenever a new .md file is added to docs/ (e.g., level-design.md, economy.md, ui-ux.md), link it here with a 1-line summary! -->

---

## 1. High Concept & Core Pillars
- **Title**: *[Game Title]*
- **Orientation & Target Viewport**: *[Portrait `450x800` OR Landscape `800x450`]*
- **Elevator Pitch**: *[1-2 sentences describing the hook and core fantasy]*
- **Design Pillars**:
  1. *[Pillar 1 — e.g., Tactile, juicy feedback on every tap]*
  2. *[Pillar 2 — e.g., Quick 2-minute sessions with clear progression]*
  3. *[Pillar 3 — e.g., Data-driven balancing via JSON configs]*

---

## 2. Core Gameplay Loop
```text
[Action / Input] ──► [Immediate Resolution / Feedback] ──► [Reward / Progression] ──► [Upgrade / Next Stage]
```
1. **Input**: *[How the player interacts with the board/stage]*
2. **Resolution**: *[Rules that determine success, failure, or combo states]*
3. **Reward**: *[Currency, XP, score, or unlocks granted]*

---

## 3. Mechanics & Systems
### 3.1 Primary Mechanics
- *[Detail core rules, controls, and win/loss conditions]*

### 3.2 Progression & Economy Overview
- **Currencies / Resources**: *[e.g., Coins, Energy, XP]*
- **Difficulty / Level Curve**: *[How stages or levels scale over time; if complex, create `./economy.md` or `./level-design.md` and link it in Related Documents above]*

---

## 4. Screen Flow & HUD
1. **Splash / Main Menu**: *[Entry point, primary CTA]*
2. **Main Gameplay View**:
   - **Top HUD (`flex-none`)**: *[Score, timer, currency, pause/settings triggers]*
   - **Center Stage (`flex-1 min-h-0`)**: *[Interactive board, canvas, or primary action area]*
   - **Bottom Controls (`flex-none`)**: *[Power-ups, drawers, or primary action buttons]*
3. **Modals & Overlays**: *[Stage Clear, Game Over, Store, Collection, Pause]*

