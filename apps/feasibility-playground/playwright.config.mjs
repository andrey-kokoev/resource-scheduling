import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  testDir: './e2e',
  outputDir: '/tmp/codex-playwright/feasibility-playground',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    cwd: appDir,
    url: 'http://127.0.0.1:5173',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
