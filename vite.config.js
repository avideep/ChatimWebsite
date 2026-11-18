import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';
import path from 'node:path';

// Build output lives outside the project: cloud-sync folders (OneDrive) rename
// directories mid-build and break the bundle. Keep in sync with server/index.js.
const outDir = process.env.BUILD_DIR || path.join(os.homedir(), '.chatim-collections', 'dist');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080', '/uploads': 'http://localhost:8080' },
  },
  build: { outDir, emptyOutDir: true, chunkSizeWarningLimit: 900 },
});
