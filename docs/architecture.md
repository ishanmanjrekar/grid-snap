# Technical Architecture Document

### Related Documents
- [Game Design Document](./game-design.md) - Master index, core gameplay loop, mechanics, and progression rules.
- [Art Direction & UI System](./art-direction.md) - Visual theme, color tokens, typography, and animation specs.

---

## 1. System Overview

This game is built as a client-side single-page application (React + Vite + TypeScript) wrapped in `<BoundingBox>` for Web/Itch.io and packaged natively via Capacitor for Android/iOS.

```text
┌────────────────────────────────────────────────────────┐
│                       React UI                         │
│        (App.tsx, Views, HUD, Modals, Canvas)           │
└──────────────────────────┬─────────────────────────────┘
                           │ Reads State / Dispatches
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Zustand Game Store                    │
│       (src/store/gameStore.ts + persist middleware)    │
└──────────────────────────┬─────────────────────────────┘
                           │ Hydrates From / Saves To
                           ▼
┌────────────────────────────────────────────────────────┐
│        localStorage + Static JSON Configs              │
│                  (src/config/*.json)                   │
└────────────────────────────────────────────────────────┘
```

---

## 2. State Management (`src/store/gameStore.ts`)

### 2.1 State Interface
```typescript
interface GameState {
  // Define core progression, resources, and session state here
}
```

### 2.2 Store Actions
```typescript
interface GameActions {
  // Core gameplay actions
  // Optional developer/cheat actions (if Debug Panel is requested)
}
```

---

## 3. Data & Configuration Schemas (`src/config/`)
To allow balancing tweaks without rewriting component logic, store numerical curves, level definitions, and economy weights in JSON files under `src/config/`.

---

## 4. Platform & Build Architecture
- **Asset Resolution**: All `public/` assets are loaded via `AssetLoader.resolvePath()` (`import.meta.env.BASE_URL`) so builds work on Itch.io's nested CDN paths.
- **Viewport Scaling**: `BoundingBox.tsx` provides a container-query context (`containerType: 'size'`) and switches between framed desktop scaling and 100% fluid mobile/APK rendering (`data-layout="fluid"`).
- **Production vs. Debug Flag**: `.env.itch` sets `VITE_DISABLE_DEBUG=true` during `npm run build:itch` to strip developer debug triggers from public Itch.io releases.

