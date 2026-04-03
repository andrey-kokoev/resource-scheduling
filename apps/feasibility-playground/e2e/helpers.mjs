import { expect } from '@playwright/test';

export async function openPlayground(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Feasibility Playground' })).toBeVisible();
  await expect(page.getByLabel('Sample scenario').locator('option')).toHaveCount(10);
  await expect(page.locator('#status')).toContainText(/^(Feasible|Infeasible):/);
}

export async function loadSample(page, sampleLabel) {
  const select = page.getByLabel('Sample scenario');
  await expect(select.locator('option').filter({ hasText: sampleLabel })).toHaveCount(1);
  await select.selectOption({ label: sampleLabel });
  await expect(page.locator('#status')).toContainText('loaded.');
}

export async function runScenario(page) {
  await page.getByRole('button', { name: 'Run Evaluation' }).click();
  await expect(page.locator('#status')).not.toHaveText('Evaluating scenario...');
}
