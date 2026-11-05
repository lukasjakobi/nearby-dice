import { expect, test } from '@playwright/test';

test('Classic and XL use the same score row dimensions', async ({ page }) => {
  const measurements = [];
  for (const scenario of ['game-my-turn', 'game-classic-xl']) {
    await page.goto(`/?scenario=${scenario}`);
    await page.locator('html[data-scenario="ready"]').waitFor({ state: 'attached' });
    const row = page.getByRole('button', { name: /^Kleine Straße:/ });
    await expect(row).toBeVisible();
    const { width, height } = (await row.boundingBox())!;
    measurements.push({ width, height });
  }

  expect(measurements[1]).toEqual(measurements[0]);
});
