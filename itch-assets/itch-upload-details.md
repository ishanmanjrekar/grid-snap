# Itch.io Upload Details — Grid Snap

Created for **GitHub Game Off 2026** (Theme: **SHIFT**).

---

## 1. Project Classification & Settings
* **Kind of project:** **Game** (HTML5 Web Game / Mobile Puzzle)
* **Pricing:** Free / $0 or Voluntary Donation
* **Platform / Embed:** HTML5 (Runs directly in browser)
* **Orientation:** Portrait
* **Dimensions:** `450px × 800px` (Responsive container query scaling on mobile, framed on desktop)
* **Embed Options:**
  * ✅ *Embed in page*
  * ✅ *Automatically start on page load*
  * ✅ *Enable fullscreen button*
  * ✅ *Mobile friendly* (Orientation: Portrait)

### Page Color Theme (Itch.io Theme Customizer)
* **16-Bit Warm Arcade Theme (Recommended — Matches in-game cartridge aesthetic):**
  * **Background (BG):** `#1E1B18` (Deep arcade charcoal)
  * **Card / Secondary Background (BG 2):** `#F4EFE6` (Vintage warm cream)
  * **Text:** `#F4EFE6` (Cream on dark page) or `#2C2523` (Deep ink on cards)
  * **Link / Accent:** `#F59E0B` (Amber Gold)
  * **Button / Active Accent:** `#22C55E` (Emerald Green)

---

## 2. Short Description / Tagline Options (Itch.io Tagline Field)

* **Option 1 (Recommended — Theme-focused & Clear):**
  > A tactile 16-bit toroidal grid puzzle where you shift rows and columns to snap colors into place. Built for GitHub Game Off 2026 (Theme: SHIFT).
* **Option 2 (Gameplay-Focused):**
  > Shift rows, slide columns, and wrap around edges to snap colored blocks into matching frames before time runs out. Unlimited moves, pure flow!
* **Option 3 (Short & Casual):**
  > A nostalgic handheld puzzle game about shifting toroidal grids. No move penalties, just clock-beating spatial fun.

---

## 3. GitHub Repository About Description & Topics

* **About Description:**
  > A tactile 16-bit toroidal grid puzzle built for GitHub Game Off 2026 (Theme: SHIFT). Shift rows and columns to snap colored blocks into matching target frames before time runs out.
* **GitHub Repository Topics:**
  `game-off-2026`, `shift`, `puzzle`, `game-jam`, `toroidal`, `retro`, `16-bit`, `arcade`, `react`, `typescript`, `vite`, `tailwindcss`, `web-game`, `html5`, `colorblind-friendly`, `open-source`

---

## 4. Recommended Itch.io Tags

* `game-off-2026`
* `shift`
* `puzzle`
* `retro`
* `pixel-art`
* `arcade`
* `tactile`
* `logic`
* `casual`
* `html5`
* `mobile-friendly`
* `colorblind-friendly`
* `open-source`
* `singleplayer`
* `2d`
* `time-attack`
* `satisfying`

---

## 5. Description (HTML Code for Itch.io Editor)
*Copy and paste the HTML block below directly into the Itch.io game page description field in HTML editing mode (`</>` toggle).*

```html
<h1>🎮 Grid Snap 🎮</h1>

<blockquote>Shift rows, slide columns, and wrap around edges to snap colored blocks into matching frames before the clock runs out.</blockquote>

<h2>🏷️ Recommended Tags</h2>
<p><code>game-off-2026</code>, <code>shift</code>, <code>puzzle</code>, <code>retro</code>, <code>pixel-art</code>, <code>arcade</code>, <code>tactile</code>, <code>logic</code>, <code>casual</code>, <code>html5</code>, <code>colorblind-friendly</code></p>

<h2>📝 Introduction</h2>

<p>I built <strong>Grid Snap</strong> as an entry for the <strong><a href="https://itch.io/jam/game-off-2026" target="_blank" rel="noopener">GitHub Game Off 2026</a></strong> game jam, centered around the theme: <strong>SHIFT</strong>.</p>

<p>When thinking about the theme, I wanted to explore a spatial puzzle mechanic: shifting entire rows and columns on a toroidal grid (where tiles that slide off one edge wrap around seamlessly to the opposite side). The goal is simple—rearrange the colored blocks until every fixed wireframe slot is matched before the stage timer runs out.</p>

<p>Like some of my previous experiments, I designed the core loop around an anxiety-free "no move limits" flow. You're never punished for trying out exploratory shifts or figuring out a pattern; you can slide tiles back and forth as much as you like, as long as you keep an eye on the clock for a 3-star clear.</p>

<p>On the design and technical side, I wanted to capture the chunky, tactile feel of vintage 90s handheld consoles—complete with 3D beveled blocks, microswitch button presses, and procedural sound effects generated entirely with the WebAudio API (no heavy audio files to load). To help when things get tricky on larger boards, the game includes a built-in hint system powered by an IDA* pathfinding solver running directly in a Web Worker.</p>

<h2>🕹️ Controls</h2>

<ul>
    <li><strong>Shift Row / Column:</strong> Click, tap, or drag horizontally or vertically along any row or column. Release to snap it into place.</li>
    <li><strong>Wrap Around:</strong> Blocks pushed past the edge will wrap around to the other side automatically.</li>
    <li><strong>Boosters:</strong> Tap the <strong>HINT</strong> or <strong>+5S</strong> buttons at the bottom if you need a hand on a tight stage.</li>
</ul>

<h2>✨ Features</h2>

<ul>
    <li><strong>16-Bit Handheld Feel:</strong> Chunky beveled blocks, dark ink outlines, and tactile microswitch button presses inspired by 90s portable consoles.</li>
    <li><strong>Toroidal Wrap-Around Mechanics:</strong> Puzzles scale from quick 3&times;3 introductory stages up to dense 4&times;8 matrices.</li>
    <li><strong>Freeform Experimentation:</strong> No move counters or strike limits—shift tiles as often as you want while chasing 3-star clear times.</li>
    <li><strong>In-Browser AI Solver:</strong> An IDA* optimal solver runs in a Web Worker to provide smart hints whenever you're stuck.</li>
    <li><strong>Procedural Audio:</strong> Pure WebAudio synthesis for tile slides, clicks, and snaps, plus an optional background theme.</li>
    <li><strong>Colorblind Accessibility:</strong> Toggle Colorblind Mode in Settings to overlay geometric shape symbols on blocks and target slots.</li>
    <li><strong>Custom Level Editor:</strong> Includes a standalone browser-based editor (<code>npm run dev:editor</code>) with auto-unsolve algorithms and solver par checks.</li>
</ul>

<h2>📜 Rules / How to Play</h2>

<ul>
    <li><strong>The Goal:</strong> Match every colored target frame on the board by shifting the corresponding colored blocks into position.</li>
    <li><strong>Cyclic Movement:</strong> Moving a row or column shifts every block in that line together. Blocks that slide off an edge wrap around to the other side.</li>
    <li><strong>Fixed Target Slots:</strong> Target wireframes remain anchored in place—only the colored blocks move.</li>
    <li><strong>3-Star Ratings:</strong> Clear the level before the milestone timer runs down to earn up to 3 stars and coins for boosters.</li>
    <li><strong>Heart Escrow:</strong> Entering a level holds 1 heart. Clear the board to get it back; running out of time forfeits it.</li>
</ul>

<h2>🤖 Disclaimer / Credits</h2>

<p>This project was developed with the assistance of agentic AI workflows:</p>
<ul>
    <li><strong>AI Pair Programming:</strong> Built using <strong>Google Antigravity</strong> and Gemini.</li>
    <li><strong>Tech Stack:</strong> React 19, TypeScript, Vite, and Tailwind CSS v4.</li>
    <li><strong>Typography:</strong> <i>Press Start 2P</i>, <i>Silkscreen</i>, and <i>Space Mono</i>.</li>
</ul>

<p>I hope you enjoy solving these puzzles as much as I enjoyed building the system behind them!</p>

<hr>

<h2>☕ Support</h2>

<p>If you find value in these experiments, feel free to show some love on <a href="https://ko-fi.com/ishanmanjrekar/tip" target="_blank" rel="noopener">Ko-fi</a>.</p>

<p>You can also subscribe to my blog, <a href="https://gamedesignbites.substack.com/" target="_blank" rel="noopener">Game Design Bites</a>, where I write about game mechanics, interactive design, and AI-assisted workflows.</p>

<hr>

<p>I'd love to hear your thoughts! Please feel free to leave a comment below with any feedback, bug reports, or level suggestions.</p>
```
