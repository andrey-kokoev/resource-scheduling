import fs from 'node:fs/promises';
import path from 'node:path';

const siteDir = path.resolve(import.meta.dirname);
const staffingDist = path.resolve(siteDir, '../staffing-scheduling-playground/dist');
const batchFlowDist = path.resolve(siteDir, '../batch-flow-scheduling-playground/dist');
const distDir = path.resolve(siteDir, 'dist');

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

await removeDirIfPresent(distDir);
await fs.mkdir(distDir, { recursive: true });
await fs.copyFile(path.resolve(siteDir, 'index.html'), path.join(distDir, 'index.html'));
await copyDir(staffingDist, path.join(distDir, 'staffing'));
await copyDir(batchFlowDist, path.join(distDir, 'batch-flow'));

console.log('Staged staffing and batch-flow apps into resource-scheduling-site/dist.');
