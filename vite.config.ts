import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { stripCrossoriginPlugin } from './vite-plugin-crossorigin';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    stripCrossoriginPlugin(),
  ],
});
