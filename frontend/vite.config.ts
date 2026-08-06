import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Dev-прокси: запросы к API уходят на локальный backend.
      // Цель читается из env: VITE_API_TARGET=http://localhost:4000 npm run dev
      '/api': process.env.VITE_API_TARGET ?? 'http://localhost:3000',
    },
  },
  build: {
    // Скромная машина сборки: один воркер вместо дефолтных
    minify: 'esbuild',
    sourcemap: false,
  },
});
