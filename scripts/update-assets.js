import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'android-assets', 'icon.png');
const destDir = path.join(rootDir, 'public', 'assets');
const destPath = path.join(destDir, 'icon.png');

console.log('--- Game Icon Asset Sync ---');
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
console.log('----------------------------');

