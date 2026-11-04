import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { stripCrossoriginPlugin } from './vite-plugin-crossorigin';
import { saveLevelPlugin } from './vite.editor.config';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    stripCrossoriginPlugin(),
    saveLevelPlugin(),
  ],
});
