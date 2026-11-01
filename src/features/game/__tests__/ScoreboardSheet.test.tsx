/**
 * "Spielstand": one player's sheet at a time, picked from the player pills; six players
 * wrap onto more lines instead of scrolling sideways.
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { PRESETS, PresetId } from '@/domain/rules';
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

async function showBoard(players: PlayerInfo[], rules?: (typeof PRESETS)[PresetId]) {
  const state = game(players, rules);
  const board = buildScoreboard(t, snapshot({ players, game: state }))!;
  await renderScreen(<ScoreboardSheet visible board={board} onClose={() => {}} />);
}

test('opens on my own sheet', async () => {
  await showBoard([ANTONIA, LUKAS]);
  expect(screen.getByRole('radio', { name: 'Lukas', checked: true })).toBeTruthy();
  expect(screen.getByText('Kleine Straße')).toBeTruthy();
  expect(screen.getByText('Gesamt')).toBeTruthy();
});

test('picking another player shows that player’s sheet', async () => {
  await showBoard([LUKAS, ANTONIA]);
  await fireEvent.press(screen.getByRole('radio', { name: 'Antonia' }));
  expect(screen.getByRole('radio', { name: 'Antonia', checked: true })).toBeTruthy();
  expect(screen.queryByRole('radio', { name: 'Lukas', checked: true })).toBeNull();
});

test('six players each get a pill and the table no longer scrolls sideways', async () => {
  await showBoard(SIX);
  for (const { name } of SIX) {
    expect(screen.getByRole('radio', { name })).toBeTruthy();
  }
});

test('with three sheets the factors head the sheet', async () => {
  await showBoard([LUKAS, ANTONIA], PRESETS[PresetId.Triple]);
  expect(screen.getByText('×1 · ×2 · ×3')).toBeTruthy();
});
