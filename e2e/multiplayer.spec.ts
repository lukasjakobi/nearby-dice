import { test } from '@playwright/test';

import { Phone } from './Phone';

test('a host and two guests join through the real screens and each play a turn', async ({
  context,
}) => {
  const phones = await Phone.startGame(context, ['Lukas', 'Antonia', 'Jonas']);

  for (let turn = 0; turn < phones.length; turn++) await (await Phone.nextUp(phones)).playTurn();
  for (const phone of phones) await phone.sees('Runde 2 von 13');
});

test('a guest who reloads mid-game resumes the same seat', async ({ context }) => {
  const phones = await Phone.startGame(context, ['Lukas', 'Antonia']);
  const [, antonia] = phones;
  await (await Phone.nextUp(phones)).playTurn();

  await antonia.page.reload();
  await antonia.sees('Unterbrochene Sitzung');
  await antonia.tap('Fortsetzen');
  await antonia.tap('Zurück ins Spiel');

  await (await Phone.nextUp(phones)).playTurn();
  for (const phone of phones) await phone.sees('Runde 2 von 13');
});
