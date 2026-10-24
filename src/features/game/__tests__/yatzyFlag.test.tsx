/**
 * Five equal dice wave "YATZY!" across every phone once they land, with the roller's
 * name and a fanfare. Only my own Yatzy vibrates.
 */
import { act, cleanup, fireEvent, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import type { GameState } from '@/domain/engine';
import { Role } from '@/session/types';
import { Sound, playSound } from '@/shared/audio';
import { ActionType, ANTONIA, LUKAS, game, play, snapshot, withDice } from '@/test/fixtures';
import { renderLiveSession } from '@/test/render';

import { GameScreen } from '../GameScreen';

jest.mock('@/shared/audio', () => ({
  ...jest.requireActual<typeof import('@/shared/audio')>('@/shared/audio'),
  playSound: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

/** The dice shake this long before the new faces land. */
const SHAKE_MS = 320;
/** The flag's whole run, from fading in to fading out. */
const FLAG_MS = 3160;

const players = [LUKAS, ANTONIA];
const myTurn = withDice(game(players), [1, 2, 3, 4, 5]);
const antoniasTurn = withDice(
  play(game(players), { type: ActionType.Skip, playerId: LUKAS.id }),
  [1, 2, 3, 4, 5],
);

/** The next roll of the turn, landing on `dice`. */
const rolled = (state: GameState, dice: number[]): GameState => ({
  ...state,
  turn: {
    ...state.turn,
    dice: dice as unknown as GameState['turn']['dice'],
    rollsUsed: state.turn.rollsUsed + 1,
    rollSeq: state.turn.rollSeq + 1,
  },
});

const flagShown = () => screen.queryByLabelText('YATZY! Antonia') !== null;
const fanfares = () => jest.mocked(playSound).mock.calls.filter(([s]) => s === Sound.Fanfare);

beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  // Unmount while the clock is still fake, so no wave keeps running on real timers.
  await cleanup();
  jest.useRealTimers();
  jest.clearAllMocks();
});

test("another player's Yatzy waves the flag on my phone once the dice land", async () => {
  const { update } = await renderLiveSession(<GameScreen />, snapshot({ game: antoniasTurn }));

  await update(snapshot({ game: rolled(antoniasTurn, [4, 4, 4, 4, 4]) }));
  expect(flagShown()).toBe(false);

  await act(() => jest.advanceTimersByTime(SHAKE_MS));
  expect(flagShown()).toBe(true);
  expect(fanfares()).toHaveLength(1);
  expect(Haptics.notificationAsync).not.toHaveBeenCalled();

  await act(() => jest.advanceTimersByTime(FLAG_MS));
  expect(flagShown()).toBe(false);
});

test('my own Yatzy shows my name and vibrates', async () => {
  const { update } = await renderLiveSession(<GameScreen />, snapshot({ game: myTurn }));

  await update(snapshot({ game: rolled(myTurn, [6, 6, 6, 6, 6]) }));
  await act(() => jest.advanceTimersByTime(SHAKE_MS));
  expect(screen.getByLabelText('YATZY! Lukas')).toBeTruthy();
  expect(fanfares()).toHaveLength(1);
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
});

test('a tap closes the flag early', async () => {
  const { update } = await renderLiveSession(
    <GameScreen />,
    snapshot({ game: antoniasTurn, myId: ANTONIA.id, role: Role.Guest }),
  );
  await update(
    snapshot({ game: rolled(antoniasTurn, [2, 2, 2, 2, 2]), myId: ANTONIA.id, role: Role.Guest }),
  );
  await act(() => jest.advanceTimersByTime(SHAKE_MS));

  await fireEvent.press(screen.getByLabelText('YATZY! Antonia'));
  await act(() => jest.advanceTimersByTime(250));
  expect(flagShown()).toBe(false);
});

test('no flag for other rolls, or for a Yatzy already on the table', async () => {
  const onTable = withDice(antoniasTurn, [5, 5, 5, 5, 5]);
  const { update } = await renderLiveSession(<GameScreen />, snapshot({ game: onTable }));
  await act(() => jest.advanceTimersByTime(SHAKE_MS));
  expect(flagShown()).toBe(false);

  await update(snapshot({ game: rolled(onTable, [5, 5, 5, 5, 1]) }));
  await act(() => jest.advanceTimersByTime(SHAKE_MS));
  expect(flagShown()).toBe(false);
  expect(fanfares()).toHaveLength(0);
});
