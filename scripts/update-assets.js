import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const androidIconPath = path.join(rootDir, 'android-assets', 'icon.png');
const publicIconPath = path.join(rootDir, 'public', 'icon.png');
const destDir = path.join(rootDir, 'public', 'assets');
const destPath = path.join(destDir, 'icon.png');
const splashWebpPath = path.join(rootDir, 'public', 'splash.webp');
const generateIconsScript = path.join(__dirname, 'generate-icons.py');

console.log('--- Game Icon & Splash Asset Sync ---');

// Run generate-icons.py if splash.webp is missing, android-assets/icon.png needs backup,
// or android-assets/icon.png is newer than public/icon.png
const shouldGenerateIcons =
  (!fs.existsSync(androidIconPath) && fs.existsSync(publicIconPath)) ||
  !fs.existsSync(splashWebpPath) ||
  (fs.existsSync(androidIconPath) &&
    (!fs.existsSync(publicIconPath) ||
      fs.statSync(androidIconPath).mtimeMs > fs.statSync(publicIconPath).mtimeMs));

if (shouldGenerateIcons) {
  try {
    execSync(`python "${generateIconsScript}"`, { stdio: 'inherit' });
  } catch (err) {
    console.warn('Warning running generate-icons.py:', err.message);
  }
}

const sourcePath = fs.existsSync(publicIconPath) ? publicIconPath : androidIconPath;
if (fs.existsSync(sourcePath)) {
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Successfully synchronized icon to web assets: ${destPath}`);
  } catch (error) {
    console.error('Failed to copy game icon asset:', error.message);
  }
} else {
  console.log(`No custom icon found at ${sourcePath} yet. Skipping icon sync.`);
}
console.log('-------------------------------------');
