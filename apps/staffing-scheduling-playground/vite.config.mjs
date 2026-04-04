import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

const pages = {
  index: fileURLToPath(new URL('./index.html', import.meta.url)),
  boundary: fileURLToPath(new URL('./boundary.html', import.meta.url)),
  docs: fileURLToPath(new URL('./docs.html', import.meta.url)),
  categoryTheoreticBoundary: fileURLToPath(new URL('./category-theoretic-boundary.html', import.meta.url)),
  packageOverview: fileURLToPath(new URL('./package-overview.html', import.meta.url)),
  examplesOverview: fileURLToPath(new URL('./examples-overview.html', import.meta.url)),
  featureMatrix: fileURLToPath(new URL('./feature-matrix.html', import.meta.url)),
};

export default defineConfig({
  root: appDir,
  base: './',
  appType: 'mpa',
  server: {
    fs: {
      allow: [appDir, repoRoot],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: pages,
    },
  },
});
