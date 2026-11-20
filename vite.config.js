import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'Frontend',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    fs: {
      allow: ['..']
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
