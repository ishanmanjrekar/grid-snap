---
name: Color Shift 16-Bit Arcade
colors:
  surface: '#fdf9ef'
  surface-dim: '#dddad0'
  surface-bright: '#fdf9ef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3e9'
  surface-container: '#f1eee4'
  surface-container-high: '#ece8de'
  surface-container-highest: '#e6e2d8'
  on-surface: '#1c1c16'
  on-surface-variant: '#4f4633'
  inverse-surface: '#31312a'
  inverse-on-surface: '#f4f0e6'
  outline: '#817661'
  outline-variant: '#d3c5ac'
  surface-tint: '#795900'
  primary: '#795900'
  on-primary: '#ffffff'
  primary-container: '#fbbf24'
  on-primary-container: '#6c4f00'
  inverse-primary: '#f9bd22'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#b91a24'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffb6b0'
  on-tertiary-container: '#aa091b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf9f'
  primary-fixed-dim: '#f9bd22'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5c4300'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#fdf9ef'
  on-background: '#1c1c16'
  surface-variant: '#e6e2d8'
  canvas-bg: '#F7F3E9'
  surface-modal: '#FFFDF8'
  surface-bezel: '#E8E2D2'
  surface-slot: '#DFD9C7'
  arcade-ink: '#2C2523'
  arcade-ink-dark: '#1A1817'
  gold-highlight: '#FDE68A'
  gold-shadow: '#D97706'
  emerald-accent: '#10B981'
  crimson-dark: '#DC2626'
  cyan-mint: '#5EEAD4'
  sky-blue: '#38BDF8'
  cobalt-blue: '#3B82F6'
  arcade-purple: '#A855F7'
  arcade-purple-dark: '#9333EA'
  tangerine-orange: '#F97316'
typography:
  headline-xl:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Mono
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Space Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.04em
  headline-sm:
    fontFamily: Space Mono
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  body-md:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Space Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
spacing:
  gutter: 0.75rem
  gutter-tablet: 1rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

# Design System: Color Shift 16-Bit Arcade

A tactile, high-contrast 16-bit retro arcade visual language crafted for mobile puzzle gaming. Built on cream paperboard tones, thick solid ink outlines, hard offset pixel drop-shadows, and punchy saturated arcade accents.

---

## 1. Core Visual Principles & Philosophy

- **Tactile 16-Bit Physicality**: Every interactive surface and container feels stamped out of physical arcade tokens or retro handheld cartridges. No blurry blurs or soft diffuse lighting—all depth is rendered via crisp, solid-color hard offset drop-shadows (`2px 2px 0 #2C2523` to `4px 4px 0 #2C2523`).
- **Heavy Ink Framing**: All containers, cards, HUD capsules, and tiles are bound by dark charcoal/black ink outlines (typically `2.5px` to `3.5px` solid `#2C2523`).
- **Warm Nostalgic Substrate**: The primary app background is a warm retro parchment/cream (`#F7F3E9` / `#FFF8F5`), providing high contrast against the solid ink borders and bright chromatic gameplay blocks.
- **Pixel Typography Hierarchy**: Distinctive monospace / pixel display typefaces (`Press Start 2P`, `Space Mono`) with uppercase button labels, high-visibility digit readouts, and compact metadata badges.

---

## 2. Color Palette & Tokens

### Base & Backgrounds
- **App Canvas Background**: `#F7F3E9` (Warm vintage cream substrate)
- **Container / Modal Surface**: `#FFFDF8` to `#FBF8F0` (Off-white card surface)
- **Board Bezel / Inactive Slot**: `#E8E2D2` / `#DFD9C7` (Chunky border bezel & neutral matrix sockets)
- **Ink / Outlines / Text**: `#2C2523` / `#1A1817` (Deep charcoal arcade ink)

### Arcade Gameplay & Semantic Accents
- **Arcade Gold / Coins / Primary CTA**: `#FBBF24` (Highlight: `#FDE68A`, Shadow/Border: `#D97706` / `#2C2523`)
- **Emerald Green / Resume / Next Level**: `#22C55E` / `#10B981` (Vibrant emerald win/action tone)
- **Arcade Red / Crimson / Penalty**: `#EF4444` / `#DC2626` (Danger, time's up, heart counters)
- **Cyan / Mint / Store Accent**: `#5EEAD4` / `#38BDF8` (Pastel secondary shop badge)
- **Cobalt Blue / Water Tile**: `#3B82F6` (Electric puzzle block blue)
- **Arcade Purple / Super Hard**: `#A855F7` / `#9333EA` (Late-stage puzzle element)
- **Tangerine Orange**: `#F97316` (Tertiary puzzle block)

---

## 3. Typography & Text Treatments

- **Display & Level Numbers**: `'Press Start 2P', monospace` or heavy pixel glyphs.
  - Used for level identifiers (`25`, `LVL. 25`), modal headers (`LEVEL 25 CLEAR!`, `PAUSED`, `TIME'S UP!`), and vanity score tallies.
- **HUD & Utility Badges**: `'Space Mono', monospace`, `font-weight: 700`.
  - Used for coin quantities (`$ 99,999`), timer countdowns (`00:56`), and inventory tickers (`❤️ 4 | 24:15`).
- **CTAs & Interactive Buttons**: Uppercase heavy pixel type with crisp horizontal letter tracking (`tracking-wide`).

---

## 4. Component Patterns & Rules

### A. Arcade Buttons
- **Shape**: Rectangular with sharp or minimal `2px` chamfered corners.
- **Borders**: Solid `3px` dark ink border (`#2C2523`).
- **Shadows**: Rigid bottom-right offset `shadow-[3px_3px_0_0_#2C2523]` (or `4px 4px`).
- **Active / Press State**: `translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0_0_#2C2523]`.
- **Variants**:
  - *Primary Action (Play / Next)*: Gold `#FBBF24` background with black ink text.
  - *Success (Resume / Buy Lives)*: Emerald `#22C55E` background with crisp white or ink text.
  - *Secondary / Cancel (Quit / Back)*: Clean cream `#FFFDF8` with dark ink text.
  - *Destructive / Close*: Crimson `#EF4444` with white `✕` icon.

### B. HUD Inventory Counters
- **Connected Capsule System**: Coin and Lives badges feature an attached square `+` button directly connected to the main counter without gaps.
- **Coin Badge**: Cream background capsule with gold coin icon, dark ink borders, and yellow/gold `+` square.
- **Heart Badge**: Cream background capsule with red heart pixel sprite, countdown timer (`24:15`), and emerald `+` square.

### C. Puzzle Grid & Matrix
- **Bezel Frame**: Cream/taupe outer border box with directional shift arrows (`▲`, `▼`, `◄`, `►`) centered on each row and column axis.
- **Color Blocks**: Solid saturated colored tiles with inner top/left 1px highlight and bottom/right 2px beveled ink shadow.
- **Target Frames**: Dashed retro wireframe borders matching the corresponding block hue (`border-dashed border-2`), indicating destination slots.
- **Empty / Inactive Slots**: Muted off-white/beige squares with a centered 2px pixel guide dot.

### D. Overlay Modals & Dialogs (Pause / Level Complete / Time's Up)
- **Scrim**: Soft darkened semi-transparent overlay (`rgba(0, 0, 0, 0.6)`), allowing the game board context to subtly show through.
- **Card**: Central off-white card (`#FFFDF8`) with a heavy `3px` or `4px` black border and `4px 4px 0 #1A1817` offset shadow.
- **Ribbon Header**: Floating banner resting on the upper border edge (Gold for Paused / Level Clear; Crimson for Time's Up).
- **Stat Readouts**: Framed inset rows with icon, label, and right-aligned score values.
- **Close Button**: Top-right corner square red button with `✕`, paired with contextual warning badges (e.g. `-1 ❤️`).
