---
name: Color Shift 16-Bit Arcade
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ee'
  surface-container: '#f5ece8'
  surface-container-high: '#efe6e3'
  surface-container-highest: '#eae1dd'
  on-surface: '#1f1b19'
  on-surface-variant: '#4f4633'
  inverse-surface: '#342f2d'
  inverse-on-surface: '#f8efeb'
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
  tertiary: '#005ac2'
  on-tertiary: '#ffffff'
  tertiary-container: '#b0c8ff'
  on-tertiary-container: '#0050ad'
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
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#fff8f5'
  on-background: '#1f1b19'
  surface-variant: '#eae1dd'
typography:
  headline-xl:
    fontFamily: Space Mono
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.04em
  headline-xl-mobile:
    fontFamily: Space Mono
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '400'
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
    letterSpacing: 0.06em
  label-md:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Space Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system channels the nostalgic tactile clarity of late-era 16-bit handheld and arcade console interfaces, infused with the crisp geometry of modern puzzle design. It targets puzzle enthusiasts and retro gamers seeking an authentic, tactile cart-based experience without visual fatigue. 

The aesthetic is strictly **Retro Tactile Arcade**: sharp pixel outlines, chunky planar surfaces, hard-edged offset drop shadows, and high-contrast primary accents on warm paper-like parchment tones. Every element should feel pressed into plastic or punched out of laminated card stock, avoiding modern blurs, gradients, or soft drop shadows entirely. Interactions emphasize mechanical chunkiness: buttons noticeably compress when pressed, state changes feel immediate, and feedback loops mimic physical game hardware switches.

## Colors

The color system operates with distinct roles designed for clarity against muted canvas surfaces:

- **Canvas & Surface Tiers**: Neutral canvas base sits at `#F6F0E6`, with sub-panels and inset trays sinking to `#ECE3D4`. Pure bright panel highlights use `#FFFFFF`.
- **Structural Outlines & Deep Shadows**: `#24201E` (Dark Charcoal) serves as the universal ink layer for all 16-bit bounding borders, pixel icons, hard drop shadows, and display typography.
- **Action & CTAs (Primary)**: `#FBBF24` (Sunburst Gold) paired with `#F59E0B` (Deep Amber) for bevels and coin indicators.
- **Affirmative & Success (Secondary)**: `#22C55E` (Emerald Green) reserved for completion states, confirmations, and level clears.
- **Focus & Shift Mechanics (Tertiary)**: `#3B82F6` (Cobalt Blue) signifies active interactive puzzle elements and dynamic status badges.
- **Vitality & Hearts**: `#EF4444` (Arcade Crimson) is dedicated exclusively to life counters, timer hazards, and penalty alerts.

## Typography

The typography reinforces the hard-edged mechanical display aesthetic while preserving strict legible structure. 

All primary interfaces and labels utilize uppercase transformation (`text-transform: uppercase`) for game controls, score trackers, and headers. Body prose uses standard sentence casing. Line heights are locked to strict pixel multiples to sustain grid consistency across responsive states.

## Layout & Spacing

Layout adheres to an uncompromising, rigid 8px baseline rhythm aligned to an architectural fixed-column container system:

- **Desktop (>= 1024px)**: Centered fixed game viewport (max 840px for single-panel puzzle layouts, 1120px for level selector screens), 16px gutters, 24px canvas margins.
- **Tablet (768px - 1023px)**: Fluid 8-column layout with 16px gutters and 20px padding.
- **Mobile (< 768px)**: Fluid 4-column layout, 12px gutters, 16px screen safe-margins.

Panels and playfields are framed by solid 3px or 4px dark borders that must never overlap. Spacing within components relies on explicit 4px / 8px / 16px increments, ensuring no fractional anti-aliasing blurring occurs on sub-pixels.

## Elevation & Depth

Depth in this system is conveyed solely through physical extrusion and opaque hard offsets—never via feathering, Gaussian blurs, or transparent alpha scrims:

- **Surface Level 0 (Recessed Trays / Insets)**: Background color `#ECE3D4` with an inner top/left 3px solid border of `#24201E` and bottom/right inner border of `#FFFFFF`, creating a carved-out cartridge slot effect.
- **Surface Level 1 (Default Ground & Cards)**: Base background `#F6F0E6`, bordered with 3px solid `#24201E`, elevated with a `3px 3px 0px 0px #24201E` hard cast shadow.
- **Surface Level 2 (Floating Modals & Interactive Tiles)**: Bordered with 4px solid `#24201E`, elevated with a `4px 4px 0px 0px #24201E` drop shadow.
- **Surface Level 3 (Lifted Dragged State & Key Alerts)**: Raised with `6px 6px 0px 0px #24201E`.
- **Pressed State (Active Interaction)**: The element shifts physically via CSS `transform: translate(3px, 3px)` while its hard shadow collapses to `0px 0px 0px 0px #24201E`, replicating a satisfying arcade microswitch depression.

## Shapes

The geometric vocabulary is strictly 0px (Sharp). Every container, button, badge, input, and tile terminates at crisp 90-degree right angles. 

To evoke authentic 16-bit stepped pixel corners on flagship panels, corner cuts may be rendered using pure CSS clip-paths or 3px stepped box borders, but rounded radii (`border-radius > 0`) are explicitly forbidden.

## Components

### Buttons
- **Primary Arcade CTA**: Background `#FBBF24`, text `#24201E`, border `3px solid #24201E`, shadow `3px 3px 0 #24201E`. Hover: Background shifts to `#F59E0B`. Active: `translate(3px, 3px)` with zero shadow.
- **Confirm / Next Level**: Background `#22C55E`, text `#FFFFFF`, border `3px solid #24201E`, shadow `3px 3px 0 #24201E`.
- **Secondary Neutral**: Background `#ECE3D4`, text `#24201E`, border `3px solid #24201E`, shadow `3px 3px 0 #24201E`.

### Cards & Dialog Panels
Main containers feature a `#FFFFFF` or `#F6F0E6` body, enclosed in a `4px solid #24201E` frame with a `4px 4px 0 #24201E` shadow. Header sections carry a high-contrast title banner with an inverted `#24201E` background and white monospace lettering.

### Stat Badges & Trackers
- **Hearts / Lives**: Crimson `#EF4444` badge block, inset `2px solid #24201E`, housing pixel heart icons.
- **Coin / Score**: Amber `#F59E0B` container with monospace tabular figures, flanked by a 12x12 chunky pixel coin glyph.
- **Puzzle Mode**: Cobalt `#3B82F6` block with bold uppercase status tag (`label-sm`).

### Form Inputs & Text Fields
Inputs use `#FFFFFF` background with an inset look: `3px solid #24201E`, no blur, caret colored `#24201E` with a constant blink interval (no smooth fades). Focus state adds an interior `2px solid #3B82F6` boundary.

### Checkboxes & Toggles
Square 20x20px blocks, bordered with `3px solid #24201E`. Unchecked: `#ECE3D4`. Checked: `#22C55E` filled with a chunky 4-pixel square mark (`#FFFFFF`) in the center.

### Game Tiles (Specialty Component)
Interactive color puzzle cells: 48x48px (mobile) to 64x64px (desktop) sharp squares. Each tile carries a distinct interior 2px light-bleed highlight at the top-left edge and a 2px shade at the bottom-right edge to simulate molded plastic retro puzzle blocks.