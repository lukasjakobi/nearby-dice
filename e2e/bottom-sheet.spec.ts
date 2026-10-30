import { expect, test } from '@playwright/test';

test('a sheet follows its grip, springs back and dismisses after a long drag', async ({ page }) => {
  await page.goto('/?scenario=game-six-players');
  await page.locator('html[data-scenario="ready"]').waitFor({ state: 'attached' });
  await page.getByRole('button', { name: 'Spielstand', exact: true }).click();
  const grip = page.getByTestId('bottom-sheet-handle');
  await expect(grip).toBeVisible();
  const start = (await grip.boundingBox())!;
  const x = start.x + start.width / 2;
  const y = start.y + start.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 100, { steps: 12 });
  await expect.poll(async () => (await grip.boundingBox())!.y).toBeCloseTo(start.y + 100, 0);
  // Pause before release so this is a short drag, not a flick.
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect.poll(async () => (await grip.boundingBox())!.y).toBeCloseTo(start.y, 0);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 450, { steps: 20 });
  await page.mouse.up();
  await expect(grip).toBeHidden();
  // Reopening resets the drag, and tapping the scrim dismisses the sheet.
  await page.getByRole('button', { name: 'Spielstand', exact: true }).click();
  await expect(grip).toBeVisible();
  await expect.poll(async () => (await grip.boundingBox())!.y).toBeCloseTo(start.y, 0);
  await page.mouse.click(x, start.y / 2);
  await expect(grip).toBeHidden();
});
