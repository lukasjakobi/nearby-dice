/** "Verlauf" from the game header: every score so far, newest first. */
import { fireEvent, screen } from '@testing-library/react-native';

import { ANTONIA, LUKAS, game, playedGame, snapshot } from '@/test/fixtures';
import { t } from '@/test/i18n';
import { fakeSession, renderScreen } from '@/test/render';
import { historyRows } from '@/shared';

import { GameScreen } from '../GameScreen';

const PLAYERS = [LUKAS, ANTONIA];

async function openHistory(state = game(PLAYERS)) {
  const snap = snapshot({ players: PLAYERS, game: state });
  await renderScreen(<GameScreen />, { session: fakeSession(snap), snapshot: snap });
  await fireEvent.press(screen.getByRole('button', { name: 'Verlauf' }));
}

test('before the first score the sheet says there is nothing yet', async () => {
  await openHistory();
  expect(screen.getByText('Noch keine Einträge.')).toBeTruthy();
});

test('lists every score, newest first', async () => {
  const state = playedGame(PLAYERS, 5);
  await openHistory(state);
  const titles = historyRows(t, state, PLAYERS).map((row) => `${row.name} · ${row.title}`);
  expect(titles).toHaveLength(5);
  expect(screen.getAllByText(/ · /).map((node) => node.props.children)).toEqual(titles);
});
