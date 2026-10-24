import { ranking } from '@/domain';
import { LUKAS, ANTONIA, savedGame } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { buildSavedGame } from '../view';

test('a saved game shows its ranking, every field and the history, newest first', () => {
  const saved = savedGame([LUKAS, ANTONIA], LUKAS);
  const { game } = saved;
  const view = buildSavedGame(t, saved);

  expect(view.title).toBe('Klassisch');
  expect(view.rows.map((row) => row.points)).toEqual(ranking(game).map((p) => p.total));
  expect(view.rows.find((row) => row.isMe)!.name).toBe('Lukas');
  expect(view.compare.at(-1)!.cells.map((cell) => cell.value)).toEqual(
    view.rows.map((row) => String(row.points)),
  );
  expect(view.history.map((row) => row.seq)).toEqual(
    game.history.map((entry) => entry.seq).reverse(),
  );
});
