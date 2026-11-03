# Art Direction & UI Design System

### Related Documents
- [Game Design Document](./game-design.md) - Master index, core gameplay loop, mechanics, and progression rules.
- [Technical Architecture](./architecture.md) - State management, persistence, timers, and JSON configuration schemas.

---

## 1. Creative North Star & Theme
- **Aesthetic Direction**: *[e.g., Tactile Arcade Chunky / Cozy Pastel Kawaii / Crisp Minimalist Puzzle]*
- **Mood & Feel**: *[How every button press, transition, and surface should feel]*

---

## 2. Color Palette (`src/index.css`)
Define all theme colors as CSS variables in `:root` inside `src/index.css`:

```css
:root {
  --bg-primary: #111125;
  --bg-secondary: #1a1a2e;
  --accent-primary: #e9c400;
  --accent-secondary: #dfb7ff;
  --accent-success: #00e471;
  --text-main: #ffffff;
  --border-color: #1f1f33;
}
```

---

## 3. Typography
- **Display / Headline Font**: *[e.g., Lilita One — used for titles, big numbers, and primary CTAs]*
- **Body / UI Font**: *[e.g., Be Vietnam Pro or Fredoka — used for descriptions, HUD labels, and tooltips]*

---

## 4. Component & Surface Rules
- **Buttons**: Use tactile bottom borders/shadows that compress (`translateY`) on `:active` press.
- **Responsive Sizing**: Always size UI components relative to the game container (`cqw`, `cqh`, `flex-1 min-h-0`)—never use desktop viewport breakpoints (`sm:`, `lg:`, `vw`, `vh`).
- **UI References (`ui-refs/`)**: Drop any HTML/image exports (such as Google Stitch designs) into `ui-refs/` and adapt them into `<BoundingBox>` following these tokens.

---

## 5. Animation & Juice Specifications
- **UI Transitions (Framer Motion)**: *[Spring stiffness/damping specs for modals, cards, and tiles]*
- **Particle / Canvas Effects (`useGameLoop`)**: *[Celebration bursts, floating ambient elements, or screen shake]*

