/**
 * "Spielstand": the standings as tiles, and below them the picked player's scorecard as
 * the game screen shows it, with only their entries.
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { PRESETS, PresetId } from '@/domain/rules';
import type { Rules } from '@/domain/rules';
import { PlayerColor } from '@/domain/player';
import type { PlayerInfo } from '@/session/types';
import { ANTONIA, JONAS, LUKAS, game, snapshot } from '@/test/fixtures';
import { t } from '@/test/i18n';
import { renderScreen } from '@/test/render';

import { ScoreboardSheet } from '../components';
import { buildScoreboard } from '../view';

const guest = (name: string, color: PlayerColor): PlayerInfo => ({
  ...ANTONIA,
  id: name.toLowerCase(),
  name,
  color,
});
const SIX = [
  LUKAS,
  ANTONIA,
  JONAS,
  guest('Maximilian', PlayerColor.Mint),
  guest('Sophie', PlayerColor.Lilac),
  guest('Emil', PlayerColor.Yellow),
];

async function showBoard(players: PlayerInfo[], rules?: Rules) {
  const board = buildScoreboard(t, snapshot({ players, game: game(players, rules) }))!;
  await renderScreen(<ScoreboardSheet visible board={board} onClose={() => {}} />);
}

const tile = (name: string, checked?: boolean) =>
  screen.getByRole('radio', { name: new RegExp(`^\\d+\\. ${name},`), checked });

test('opens on my own scorecard', async () => {
  await showBoard([ANTONIA, LUKAS]);
  expect(tile('Lukas', true)).toBeTruthy();
  expect(screen.getByLabelText('Kleine Straße, noch offen')).toBeTruthy();
});

test('picking another player shows their scorecard', async () => {
  await showBoard([LUKAS, ANTONIA]);
  await fireEvent.press(tile('Antonia'));
  expect(tile('Antonia', true)).toBeTruthy();
  expect(tile('Lukas', false)).toBeTruthy();
});

test('six players each get a tile', async () => {
  await showBoard(SIX);
  for (const { name } of SIX) {
    expect(tile(name)).toBeTruthy();
  }
});

test('with three sheets the scorecard switches between them', async () => {
  await showBoard([LUKAS, ANTONIA], PRESETS[PresetId.Triple]);
  await fireEvent.press(screen.getByRole('radio', { name: '×2' }));
  expect(screen.getByRole('radio', { name: '×2', checked: true })).toBeTruthy();
});
