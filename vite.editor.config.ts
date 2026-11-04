import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const levelsFilePath = path.resolve(__dirname, 'src/config/levels.json');

function readLevelsFromDisk(): any[] {
  if (!fs.existsSync(levelsFilePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(levelsFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLevelsToDisk(levels: any[]): void {
  const sorted = [...levels].sort((a, b) => Number(a.id) - Number(b.id));
  fs.mkdirSync(path.dirname(levelsFilePath), { recursive: true });
  fs.writeFileSync(levelsFilePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

function saveLevelPlugin(): Plugin {
  return {
    name: 'grid-snap-save-level-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        if (req.method === 'GET' && req.url === '/api/levels') {
          const levels = readLevelsFromDisk();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ levels }));
          return;
        }

        if (req.method === 'POST' && req.url === '/api/save-level') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body);
              const levels = readLevelsFromDisk();
              const existingIdx = levels.findIndex((l) => Number(l.id) === Number(incoming.id));
              if (existingIdx >= 0) {
                levels[existingIdx] = incoming;
              } else {
                levels.push(incoming);
              }
              writeLevelsToDisk(levels);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, levels: readLevelsFromDisk() }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: err?.message || 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/insert-level') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body);
              const targetId = Number(incoming.id);
              const levels = readLevelsFromDisk().map((l) => {
                if (Number(l.id) >= targetId) {
                  return { ...l, id: Number(l.id) + 1 };
                }
                return l;
              });
              levels.push(incoming);
              writeLevelsToDisk(levels);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, levels: readLevelsFromDisk() }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: err?.message || 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.method === 'DELETE' && req.url.startsWith('/api/level/')) {
          const idStr = req.url.replace('/api/level/', '');
          const delId = Number(idStr);
          const remaining = readLevelsFromDisk()
            .filter((l) => Number(l.id) !== delId)
            .sort((a, b) => Number(a.id) - Number(b.id))
            .map((l, idx) => ({ ...l, id: idx + 1 }));
          writeLevelsToDisk(remaining);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, levels: remaining }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  root: 'editor',
  plugins: [react(), tailwindcss(), saveLevelPlugin()],
  server: {
    port: 5174,
  },
});

