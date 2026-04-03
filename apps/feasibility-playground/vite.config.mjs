import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
      rollupOptions: {
        input: {
          index: path.resolve(root, 'index.html'),
          docs: path.resolve(root, 'docs.html'),
          boundary: path.resolve(root, 'boundary.html'),
          categoryTheoreticBoundary: path.resolve(root, 'category-theoretic-boundary.html'),
          packageOverview: path.resolve(root, 'package-overview.html'),
          examplesOverview: path.resolve(root, 'examples-overview.html'),
        featureMatrix: path.resolve(root, 'feature-matrix.html'),
      },
    },
  },
});
