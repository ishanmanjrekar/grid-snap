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
* **Warm Arcade Theme (Recommended — Matches in-game palette):**
  * **Background (BG):** `#1E1B18` (Deep arcade charcoal)
  * **Card / Secondary Background (BG 2):** `#F4EFE6` (Vintage warm cream)
  * **Text:** `#F4EFE6` (Cream on dark page) or `#2C2523` (Deep ink on cards)
  * **Link / Accent:** `#F59E0B` (Amber Gold)
  * **Button / Active Accent:** `#22C55E` (Emerald Green)

### Typography / Fonts (Itch.io Theme Customizer Dropdown)
* **Headers Font:** **`Press Start 2P`** *(Matches the in-game arcade pixel title and modal banners)*
  * *Fallback if unavailable in your list:* **`Lucida Console`** or **`Courier New`**
* **Body Font:** **`Open Sans`** or **`Roboto`** *(Clean, relaxed sans-serif for comfortable reading of the long description)*
  * *Alternative:* **`Verdana`**

---

## 2. Short Description / Tagline Options (Itch.io Tagline Field — Under 120 chars)

* **Option 1 (Recommended — 107 chars):**
  > A casual 2D torus puzzle. Shift rows and columns to snap colors into place! Built for GitHub Game Off 2026.
* **Option 2 (Mechanics & Jam — 114 chars):**
  > Shift rows, slide columns, and wrap around edges to snap colors into their frames. Built for GitHub Game Off 2026.
* **Option 3 (Casual & Direct — 105 chars):**
  > A simple 2D torus grid puzzle. Shift rows and columns, wrap around edges, and snap the colors into place.
* **Option 4 (Punchy & Short — 91 chars):**
  > Shift rows, wrap around edges, and snap colored blocks into place. Simple, satisfying flow!

---

## 3. GitHub Repository About Description & Topics

* **About Description:**
  > A casual 2D torus puzzle game built for GitHub Game Off 2026 (Theme: SHIFT). Simple shifting mechanics—slide rows and columns to snap colors into their matching frames on the grid!
* **GitHub Repository Topics:**
  `game-off-2026`, `shift`, `puzzle`, `torus`, `casual`, `game-jam`, `grid-puzzle`, `html5`, `web-game`, `react`, `typescript`, `vite`, `colorblind-friendly`, `gplv3`, `open-source`

---

## 4. Recommended Itch.io Tags

* `game-off-2026`
* `shift`
* `puzzle`
* `casual`
* `tactile`
* `logic`
* `html5`
* `pixel-art`
* `mobile-friendly`
* `colorblind-friendly`
* `open-source`
* `singleplayer`
* `2d`
* `time-attack`
* `satisfying`

---

## 5. Statement on AI Usage (Itch.io Metadata Field)
*(Short, crisp version formatted for the Itch.io project settings dialog)*

### AI-Generated Content Classification (Checkboxes)
* ☑ **Graphics:** Concept art & splash visuals (Gemini)
* ☑ **Sounds:** Audio & music generation assistance (Gemini)
* ☑ **Text & Dialog:** Tutorial copy assistance
* ☑ **Code:** AI pair programming & scaffolding (Google Antigravity & Gemini)

### Statement of AI Usage (Textarea)
> Used Google Antigravity, Gemini, and Google Stitch as collaborative design and coding partners to rapidly prototype this puzzle without a programming background. Focus remained entirely on game feel and mechanics.

---

## 6. Description (HTML Code for Itch.io Editor)
*Copy and paste the HTML block below directly into the Itch.io game page description field in HTML editing mode (`</>` toggle).*

```html
<h1>🎮 Grid Snap 🎮</h1>

<blockquote>A casual 2D torus puzzle where you shift rows and columns to snap colors into their frames on the grid. Built for GitHub Game Off 2026 (Theme: SHIFT).</blockquote>

<h2>📝 Introduction</h2>

<p>I built <strong>Grid Snap</strong> for the <strong><a href="https://itch.io/jam/game-off-2026" target="_blank" rel="noopener">GitHub Game Off 2026</a></strong> game jam (Theme: <strong>SHIFT</strong>). It’s a casual 2D torus puzzle where shifting entire rows and columns wraps tiles seamlessly around the edges. The goal is simple: shift the grid to snap every colored block into its matching target frame before time runs out.</p>

<p>There are no move limits, so you can freely experiment and slide tiles as you hunt for solutions—just solve it within the time limit to collect all 3 stars! Visually, it features a chunky, tactile pixel-art style with crisp outlines, beveled blocks, and snappy retro sound effects. Stages are handcrafted and progressive, supported by an editor that makes authoring and testing new puzzle layouts quick and scalable.</p>

<h2>🕹️ Controls</h2>

<ul>
    <li><strong>Shift Row / Column:</strong> Click, tap, or drag horizontally or vertically along any row or column. Release to snap it into place.</li>
    <li><strong>Wrap Around:</strong> Blocks pushed past an edge wrap seamlessly around to the other side (like a 2D torus).</li>
    <li><strong>Boosters:</strong> Tap the <strong>HINT</strong> or <strong>+5S</strong> buttons at the bottom if you need a quick nudge on a tight stage.</li>
</ul>

<h2>✨ Features</h2>

<ul>
    <li><strong>Chunky &amp; Tactile Pixel-Art Style:</strong> Beveled blocks, physical button clicks, and satisfying snap animations that give every slide a crisp, tangible feel.</li>
    <li><strong>Simple Shifting Mechanics:</strong> Intuitive drag-and-snap controls that feel natural on a desktop mouse or mobile touchscreen.</li>
    <li><strong>Handmade &amp; Scalable Levels:</strong> Thoughtfully handcrafted puzzle stages ranging from quick 3&times;3 introductions to denser 4&times;8 challenge boards, backed by an authoring editor that makes creating and scaling new layouts easy.</li>
    <li><strong>Live Remote Balancing:</strong> Level curves, difficulty tuning, and the coin economy can be updated on the fly via remote config without needing a whole new game update.</li>
    <li><strong>Smart In-Game Hints:</strong> If you get stuck on a tricky matrix, tap the Hint booster to highlight the best next shift.</li>
    <li><strong>No Move Limits:</strong> Experiment freely with shifts without move counters or strike penalties while chasing 3-star clear times.</li>
    <li><strong>Colorblind Accessibility:</strong> Toggle Colorblind Mode in Settings to display distinct geometric shape symbols on blocks and target frames.</li>
</ul>

<h2>📜 Rules / How to Play</h2>

<ul>
    <li><strong>Snap the Colors:</strong> Match every colored target frame on the grid by shifting matching colored blocks into place.</li>
    <li><strong>Cyclic Shifting:</strong> Shifting a row or column moves all blocks in that line together. Blocks that slide off an edge wrap around to the opposite side.</li>
    <li><strong>Anchored Target Frames:</strong> Target frames remain fixed on the grid—only the colored blocks shift around them.</li>
    <li><strong>3-Star Ratings:</strong> Clear the level before the milestone timer runs down to earn up to 3 stars and coins for boosters.</li>
</ul>

<h2>🤖 AI Usage &amp; Prototyping</h2>

<p>I’m a game designer with 16+ years of industry experience, but without a traditional coding background. I built <strong>Grid Snap</strong> as an ongoing experiment in using modern AI tools to bridge the gap between <em>design intent</em> and <em>playable reality</em>.</p>

<p>Rather than using AI as a "slot machine" for single-prompt disposable games, I treat tools like <strong>Google Antigravity</strong> and <strong>Gemini</strong> as collaborative pair programmers. The AI handles code execution and scaffolding, freeing me to focus entirely on the craft of game design: spatial rules, tactile feel, puzzle pacing, and quick playable prototyping.</p>

<p>I write about this process, practical non-coder workflows, and game design philosophy on my Substack: <strong><a href="https://gamedesignbites.substack.com/" target="_blank" rel="noopener">Game Design Bites</a></strong>.</p>

<h2>📂 Source Code (GitHub)</h2>

<p>As part of the GitHub Game Off jam, the project repository is public on GitHub and licensed under the <strong>GNU General Public License v3.0 (GPLv3)</strong>:</p>
<p>👉 <strong><a href="https://github.com/ishanmanjrekar/grid-snap" target="_blank" rel="noopener">https://github.com/ishanmanjrekar/grid-snap</a></strong></p>

<h2>🛠️ Credits &amp; Tech</h2>

<ul>
    <li><strong>AI Pair Programming &amp; IDE:</strong> Built with <strong>Google Antigravity</strong> and <strong>Gemini</strong>.</li>
    <li><strong>UI Design &amp; Interfaces:</strong> Designed with <strong>Google Stitch</strong>.</li>
    <li><strong>Art &amp; Music Assets:</strong> Concept art and background music generated through <strong>Gemini</strong>, paired with procedural in-browser retro sound synthesis.</li>
    <li><strong>Framework &amp; Styling:</strong> React 19, TypeScript, Vite, and Tailwind CSS.</li>
    <li><strong>Typography:</strong> <i>Press Start 2P</i>, <i>Silkscreen</i>, and <i>Space Mono</i>.</li>
</ul>

<p>I hope you enjoy solving these puzzles as much as I enjoyed designing and prototyping them!</p>

<hr>

<h2>☕ Support</h2>

<p>If you find value in these experiments, feel free to show some love on <a href="https://ko-fi.com/ishanmanjrekar/tip" target="_blank" rel="noopener">Ko-fi</a>.</p>

<p>You can also subscribe to my newsletter, <a href="https://gamedesignbites.substack.com/" target="_blank" rel="noopener">Game Design Bites</a>, where I write about game mechanics, interactive design, and AI-assisted workflows.</p>

<hr>

<p>I'd love to hear your thoughts! Please feel free to leave a comment below with any feedback, bug reports, or level suggestions.</p>
```
