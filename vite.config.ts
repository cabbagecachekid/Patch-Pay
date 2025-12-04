import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'web',
  publicDir: '../public',
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
    // Ensure service worker is copied
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'web/index.html'),
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
