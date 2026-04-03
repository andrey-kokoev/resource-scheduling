import { expect, test } from '@playwright/test';
import { loadSample, openPlayground, runScenario } from './helpers.mjs';

test('default/base sample renders feasible', async ({ page }) => {
  await openPlayground(page);

  await expect(page.locator('#status')).toHaveText('Feasible: 4 assignments across 3 shifts.');
  await expect(page.getByText('Feasible result')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Line Lead' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Plant A' }).first()).toBeVisible();
});

test('Forklift unavailable renders infeasible', async ({ page }) => {
  await openPlayground(page);
  await loadSample(page, 'Availability conflict');
  await runScenario(page);

  await expect(page.locator('#status')).toHaveText('Infeasible: 2 regrouped explanations.');
  await expect(page.getByText('Infeasible result')).toBeVisible();
  await expect(page.getByText('Failed need n3')).toBeVisible();
  await expect(page.getByText('lift inspection')).toBeVisible();
});

test('Lead missing renders infeasible', async ({ page }) => {
  await openPlayground(page);
  await loadSample(page, 'Qualification gap');
  await runScenario(page);

  await expect(page.locator('#status')).toHaveText('Infeasible: 1 regrouped explanations.');
  await expect(page.getByText('Infeasible result')).toBeVisible();
  await expect(page.getByText('Failed need n2')).toBeVisible();
  await expect(page.locator('.need-card').filter({ hasText: 'Role: Line Lead' }).first()).toBeVisible();
});

test('Coverage rule impossible renders infeasible', async ({ page }) => {
  await openPlayground(page);
  await loadSample(page, 'Coverage conflict');
  await runScenario(page);

  await expect(page.locator('#status')).toHaveText('Infeasible: 7 regrouped explanations.');
  await expect(page.getByText('Infeasible result')).toBeVisible();
  await expect(page.locator('.need-card').filter({ hasText: 'Coverage rule cr-1 is unsatisfied.' }).first()).toBeVisible();
  await expect(page.locator('.need-card').filter({ hasText: 'site-1' }).first()).toBeVisible();
});
