import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const levelsFilePath = path.resolve(__dirname, 'src/config/levels.json');

interface LevelsPayloadDisk {
  campaignLoop: number[];
  levels: any[];
}

function readLevelsPayloadFromDisk(): LevelsPayloadDisk {
  if (!fs.existsSync(levelsFilePath)) {
    return { campaignLoop: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15], levels: [] };
  }
  try {
    const raw = fs.readFileSync(levelsFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        campaignLoop: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        levels: parsed,
      };
    }
    return {
      campaignLoop: Array.isArray(parsed.campaignLoop)
        ? parsed.campaignLoop
        : [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      levels: Array.isArray(parsed.levels) ? parsed.levels : [],
    };
  } catch {
    return { campaignLoop: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15], levels: [] };
  }
}

function readLevelsFromDisk(): any[] {
  return readLevelsPayloadFromDisk().levels;
}

function writeLevelsToDisk(levels: any[], campaignLoop?: number[]): void {
  const current = readLevelsPayloadFromDisk();
  const sorted = [...levels].sort((a, b) => Number(a.id) - Number(b.id));
  const payload = {
    campaignLoop: campaignLoop ?? current.campaignLoop,
    levels: sorted,
  };
  fs.mkdirSync(path.dirname(levelsFilePath), { recursive: true });
  fs.writeFileSync(levelsFilePath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
}

export function saveLevelPlugin(): Plugin {
  return {
    name: 'grid-snap-save-level-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        if (req.method === 'GET' && req.url === '/api/levels') {
          const payload = readLevelsPayloadFromDisk();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
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

        if (req.method === 'POST' && req.url === '/api/reorder-levels') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body);
              const list = Array.isArray(incoming.levels) ? incoming.levels : incoming;
              if (!Array.isArray(list)) {
                throw new Error('Expected an array of levels');
              }
              const reindexed = list.map((lvl: any, idx: number) => ({
                ...lvl,
                id: idx + 1,
              }));
              writeLevelsToDisk(reindexed);
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
  cacheDir: path.resolve(__dirname, 'node_modules/.vite-editor'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react(), tailwindcss(), saveLevelPlugin()],
  server: {
    port: 5174,
    watch: {
      ignored: ['**/src/config/**', '**/levels.json'],
    },
    fs: {
      allow: [__dirname],
    },
  },
});

