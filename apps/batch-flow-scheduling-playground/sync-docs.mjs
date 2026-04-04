import fs from 'node:fs/promises';
import path from 'node:path';

const appDir = path.resolve(import.meta.dirname);
const sourceDir = path.resolve(appDir, '../../packages/batch-flow-scheduling/dist-docs');
const targetDir = path.resolve(appDir, 'generated-docs');

async function removeDirIfPresent(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

await removeDirIfPresent(targetDir);
await copyDir(sourceDir, targetDir);
console.log('Synced batch-flow generated docs.');
