import { expect, test } from '@playwright/test';

import { Phone } from './Phone';

const ROUNDS = 13;

test('a training game runs to the results', async ({ context }) => {
  const me = await Phone.open(context, 'Lukas');
  await me.tap('Training, Allein üben');
  await me.tap('Training starten');

  for (let round = 1; round <= ROUNDS; round++) {
    await me.sees(`Runde ${round} von ${ROUNDS}`);
    await me.playTurn();
  }

  await expect(me.page).toHaveURL(/\/results$/);
});
