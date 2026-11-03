# Game Project Harness & Architectural Rules

This project was scaffolded with `portable-web-android-game-skill`. You **MUST** follow these rules in every session when adding features, converting UI designs, writing documentation, or exporting builds.

---

## 1. Documentation Hub & Cross-Linking (`docs/`)
- **Central Hub (`docs/game-design.md`)**: `docs/game-design.md` is the master index for all project documentation.
- **Starter Docs**: The project begins with three core documents under `docs/`:
  - [`docs/game-design.md`](./docs/game-design.md)
  - [`docs/architecture.md`](./docs/architecture.md)
  - [`docs/art-direction.md`](./docs/art-direction.md)
- **Strict Cross-Linking Rule**: Whenever you create a new markdown file in `docs/` (for example, `level-design.md`, `economy.md`, `ui-ux.md`, `testing-and-qa.md`) or rename/remove an existing one:
  1. You **MUST** add a relative link and 1-line summary to the `### Related Documents` section at the top of `docs/game-design.md`.
  2. You **MUST** include a `### Related Documents` section at the top of the new document linking back to `./game-design.md` and other relevant docs in `docs/` so the documentation graph stays 100% connected.
  3. Always use relative paths (`./filename.md`), never machine-specific absolute paths.

---

## 2. Layout, Scaling & `BoundingBox` Rules (Portrait & Landscape)
- **Single Root Wrapper**: The entire game UI lives inside `<BoundingBox width={W} height={H}>` (`src/components/BoundingBox.tsx`), which supports both Vertical/Portrait (`width < height`, e.g., `450x800`) and Horizontal/Landscape (`width > height`, e.g., `800x450`) games.
- **No Viewport Wrappers Inside `App.tsx`**: Do NOT wrap `<BoundingBox>` in `100vh`, `100dvh`, or `w-screen` divs—`#root` in `src/index.css` already owns the full viewport and safe-area padding (`env(safe-area-inset-*)`).
- **Container Queries Only — No Viewport Breakpoints**:
  - `BoundingBox` sets `containerType: 'size'` on its inner game box.
  - **NEVER** use viewport media queries (`sm:`, `md:`, `lg:`, `vw`, `vh`) to size elements inside the game—on a desktop monitor (`1920x1080`), `sm:` and `lg:` will falsely trigger inside a `450px` `BoundingBox` and blow up the layout!
  - Instead, use **container query units** (`cqw`, `cqh`, `@sm:`, `@md:`), `clamp(...)` with `cqw`, and elastic Flexbox (`flex-1 min-h-0` for main stage/grid, `flex-none` for bolted top HUD and bottom controls).
- **Converting UI Mocks from `ui-refs/` (e.g., Google Stitch Exports)**:
  - When converting HTML/Tailwind or screenshot references from `ui-refs/`:
    1. Strip any outer `min-h-screen`, `h-screen`, `h-[100dvh]`, or fixed pixel page wrappers.
    2. Replace any `sm:`, `md:`, or `lg:` responsive classes with container-relative sizing or base classes that fit the `BoundingBox` dimensions.
    3. Use `.game-container` as the top-level inner wrapper inside `<BoundingBox>` so decorative desktop borders are automatically stripped in mobile/APK fluid mode (`[data-layout="fluid"]`).

---

## 3. Itch.io & Asset Path Rules
- **Never Use Leading Slashes for Public Assets**: Vite's `base: './'` does NOT rewrite literal string paths in JSX or inline CSS. Writing `<img src="/assets/icon.png" />` or `url(/assets/bg.png)` will cause silent 404 errors on Itch.io's nested CDN.
- **Always Use `AssetLoader.resolvePath()` or `import.meta.env.BASE_URL`**:
  ```tsx
  import { AssetLoader } from './utils/AssetLoader';

  // Correct everywhere (Web, Itch.io, Android APK)
  <img src={AssetLoader.resolvePath('assets/icon.png')} />
  ```

---

## 4. Optional Debug / Cheat Panel Pattern (When Requested)
Not every game needs a Debug Panel, so do not create one unless the user asks for it. When the user **does** ask for a debug menu or cheat controls:
1. **Production Switch (`.env.itch`)**: Gate the trigger behind `import.meta.env.VITE_DISABLE_DEBUG`:
   ```tsx
   if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
   ```
   Because `npm run build:itch` builds with `--mode itch` (which loads `.env.itch` where `VITE_DISABLE_DEBUG=true`), the debug menu will automatically be disabled in public Itch.io exports while remaining active in local dev and debug APKs.
2. **Hidden Trigger**: Wire activation to a discrete gesture (such as triple-tapping a HUD level/score badge within 450ms) and store cheat actions (`devCheat...`) cleanly inside the Zustand `gameStore`.

---

## 5. Build & Export Commands
- **Itch.io ZIP Export**: Run `npm run build:itch` (executes `scripts/build-itch.ps1`, runs `scripts/verify-build.js`, builds in `--mode itch`, and outputs `dump/[appname]-ddMMyy-HHmm-itch.zip` with `index.html` at the archive root).
- **Android APK Export**: Run `npm run build:apk` (executes `scripts/build-apk.ps1`, links the shared JDK/Android SDK cache from `$HOME\.portable-android-env` into `.local-env/`, syncs icons from `android-assets/icon.png`, cleans stale caches, and outputs `dump/[appname]-ddMMyy-HHmm-android.apk`).

