import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let warnings = 0;
let errors = 0;

console.log('=== Running Pre-Build Harness Verification ===');

// 1. Check package.json "name" (prevent "temp-game" artifact exports)
const pkgPath = path.join(rootDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const folderName = path.basename(rootDir).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  if (!pkg.name || pkg.name === 'temp-game' || pkg.name === 'vite-project') {
    console.log(`[Auto-Fix] Updating package.json name from "${pkg.name}" to "${folderName}"`);
    pkg.name = folderName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
}

// 2. Check index.html for viewport-fit=cover and temp-game title
const indexHtmlPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  let modified = false;

  if (!html.includes('viewport-fit=cover')) {
    console.log('[Auto-Fix] Adding viewport-fit=cover to index.html <meta name="viewport"> for mobile safe areas.');
    html = html.replace(
      /<meta\s+name=["']viewport["']\s+content=["']([^"']*)["']\s*\/?>/i,
      (match, content) => `<meta name="viewport" content="${content}, viewport-fit=cover" />`
    );
    modified = true;
  }

  if (html.includes('<title>temp-game</title>') || html.includes('<title>Vite + React + TS</title>')) {
    const folderTitle = path.basename(rootDir);
    console.log(`[Auto-Fix] Updating placeholder <title> in index.html to "${folderTitle}"`);
    html = html.replace(/<title>.*?<\/title>/i, `<title>${folderTitle}</title>`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
  }
}

// 3. Scan src/ for unprefixed root-relative asset paths that break on Itch.io
function scanDirForBrokenPaths(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirForBrokenPaths(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const relFile = path.relative(rootDir, fullPath);

      // Check for literal src="/..." or url(/...) referencing public assets
      const brokenSrcMatch = content.match(/src=["']\/(?!\/)[^"']+["']/g);
      const brokenUrlMatch = content.match(/url\(["']?\/(?!\/)[^"')]+["']?\)/g);

      if (brokenSrcMatch) {
        console.warn(
          `[Warning] ${relFile}: Found root-relative src (${brokenSrcMatch.join(', ')}). Use AssetLoader.resolvePath() or import.meta.env.BASE_URL so Itch.io builds do not 404.`
        );
        warnings++;
      }
      if (brokenUrlMatch) {
        console.warn(
          `[Warning] ${relFile}: Found root-relative CSS url (${brokenUrlMatch.join(', ')}). Use import.meta.env.BASE_URL or relative paths for Itch.io compatibility.`
        );
        warnings++;
      }
    }
  }
}

scanDirForBrokenPaths(path.join(rootDir, 'src'));

// 4. Verify docs/ cross-linking in docs/game-design.md
const docsDir = path.join(rootDir, 'docs');
const gameDesignDoc = path.join(docsDir, 'game-design.md');
if (fs.existsSync(docsDir) && fs.existsSync(gameDesignDoc)) {
  const gdContent = fs.readFileSync(gameDesignDoc, 'utf8');
  const mdFiles = fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'game-design.md');

  for (const mdFile of mdFiles) {
    if (!gdContent.includes(mdFile)) {
      console.warn(
        `[Warning] docs/${mdFile} is not linked inside docs/game-design.md! Keep the Related Documents section in docs/game-design.md updated.`
      );
      warnings++;
    }
  }
}

if (errors > 0) {
  console.error(`=== Verification failed with ${errors} error(s) and ${warnings} warning(s). ===`);
  process.exit(1);
} else {
  console.log(`=== Verification passed (${warnings} warning(s)). ===`);
}

