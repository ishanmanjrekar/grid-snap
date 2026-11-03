# UI References (`ui-refs/`)

Drop your UI reference screenshots, wireframes, or exported HTML/Tailwind prototypes (such as **Google Stitch** exports) into this folder.

## Rules for AI Agents Converting `ui-refs/` into Game Views
1. **Fit Inside `<BoundingBox>`**: Never copy `100vh`, `100dvh`, `min-h-screen`, or `w-screen` wrappers from exported HTML prototypes. All views render inside `<BoundingBox>` (`width: 100%; height: 100%`).
2. **Strip Viewport Media Queries (`sm:`, `md:`, `lg:`)**: Exported HTML often includes Tailwind viewport breakpoints (`sm:text-base`, `lg:p-8`). Because desktop browsers have a wide window even when `<BoundingBox>` is `450px` wide, viewport breakpoints will misfire on desktop. Convert them to fixed/elastic container layouts (`flex-1 min-h-0`) or container queries (`cqw`, `cqh`, `clamp(...)`).
3. **Use Safe Asset Paths**: Prefix any `public/` image or icon paths with `AssetLoader.resolvePath(...)` or `import.meta.env.BASE_URL` so they work on Itch.io.

