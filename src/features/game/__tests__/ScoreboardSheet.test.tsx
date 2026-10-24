/**
 * "Spielstand" with many players: the columns keep their width and the table scrolls
 * sideways as one piece, names and rows together, with the field names pinned.
 */
import { screen, within } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { t } from '@/test/i18n';

import { PlayerColor } from '@/domain/player';
import type { PlayerInfo } from '@/session/types';
import { ANTONIA, JONAS, LUKAS, game, snapshot } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

import { ScoreboardSheet } from '../components';
import { COLUMN_WIDTH, LABEL_WIDTH } from '../components/ScoreTableRow';
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

/** Shows the table on a 320 pt phone at the given system text size. */
async function showBoard(players: PlayerInfo[], fontScale = 1) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 320, height: 568, scale: 2, fontScale });
  const board = buildScoreboard(t, snapshot({ players, game: game(players) }))!;
  await renderScreen(<ScoreboardSheet visible board={board} onClose={() => {}} />);

  return within(screen.getByTestId('score-table'));
}

const styleOf = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as StyleProp<ViewStyle>);

afterEach(() => jest.restoreAllMocks());

test.each([
  ['two', SIX.slice(0, 2)],
  ['six', SIX],
])('with %s players, names and rows scroll sideways together', async (_, players) => {
  const table = await showBoard(players);
  expect(screen.getByTestId('score-table').props.horizontal).toBe(true);
  for (const { name } of players) {
    expect(styleOf(table.getByText(name))?.width).toBe(COLUMN_WIDTH);
  }

  expect(table.getByText('Kleine Straße')).toBeTruthy();
  expect(table.getByText('Gesamt')).toBeTruthy();
});

test('the field names keep their width and move along with the sideways scroll', async () => {
  await showBoard(SIX);
  // The offset itself follows the scroll on the native side, which Jest does not run.
  expect(styleOf(screen.getByText('Kleine Straße').parent!)).toMatchObject({
    minWidth: LABEL_WIDTH,
    transform: [{ translateX: 0 }],
  });
});

test.each([
  [1.3, 1.3],
  [2, 1.3],
])('at text size %s the columns grow by %s', async (fontScale, growth) => {
  await showBoard(SIX, fontScale);
  expect(styleOf(screen.getByText('Jonas'))?.width).toBeCloseTo(COLUMN_WIDTH * growth);
});
