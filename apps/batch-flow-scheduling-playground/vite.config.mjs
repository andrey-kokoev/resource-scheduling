import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default {
  root: appDir,
  base: './',
  server: {
    fs: {
      allow: [appDir, repoRoot],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
};
