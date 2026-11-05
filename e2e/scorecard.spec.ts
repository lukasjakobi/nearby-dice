import { expect, test } from '@playwright/test';

for (const scenario of ['game-my-turn', 'game-classic-xl']) {
  test(`${scenario} uses spare phone height and preserves reachable fields when resized`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(`/?scenario=${scenario}&seed=7`);
    await page.locator('html[data-scenario="ready"]').waitFor({ state: 'attached' });
    const row = page.getByRole('button', { name: /^Kleine Straße:/ });
    const chance = page.getByRole('button', { name: /^Chance:/ });
    const roll = page.getByRole('button', { name: 'Würfeln', exact: true });
    await expect.poll(async () => (await row.boundingBox())!.height).toBeGreaterThan(44);
    await expect(chance).toBeInViewport();
    const tallRow = (await row.boundingBox())!;
    const bottom = (await chance.boundingBox())!;
    const tray = (await roll.boundingBox())!;
    expect(bottom.y + bottom.height).toBeLessThan(tray.y);
    // The card occupies the available board rather than leaving a large gap above the dice.
    expect(tray.y - bottom.y - bottom.height).toBeLessThan(180);

    await page.setViewportSize({ width: 320, height: 568 });
    const more = page.getByRole('button', { name: 'Weitere Felder', exact: true });
    await expect(more).toBeVisible();
    await expect
      .poll(async () => {
        const cue = (await more.boundingBox())!;
        const dice = (await page.locator('[aria-label="Würfel"]').boundingBox())!;
        return cue.y + cue.height <= dice.y;
      })
      .toBe(true);
    await more.click();
    await expect(chance).toBeInViewport();
    await expect(roll).toBeInViewport();
    const compactRow = (await row.boundingBox())!;
    expect(compactRow.height).toBeGreaterThanOrEqual(44);
    expect(compactRow.height).toBeLessThan(tallRow.height);
    await expect
      .poll(async () => {
        const field = (await chance.boundingBox())!;
        const button = (await roll.boundingBox())!;
        return field.y + field.height < button.y;
      })
      .toBe(true);
  });
}
