import { act, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { DEFAULT_RULES } from '@/domain/rules';
import type { Rules } from '@/domain/rules';
import { renderScreen, fakeSession } from '@/test/render';
import { ActionType, JONAS, LUKAS, game, play, snapshot, withDice } from '@/test/fixtures';

import { GameScreen } from '../GameScreen';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

const TIMED: Rules = { ...DEFAULT_RULES, secondsPerTurn: 30 };
const players = [LUKAS, JONAS];

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test("another player's turn shows their rolls and the time bar next to the status", async () => {
  const jonasTurn = withDice(
    play(game(players, TIMED), { type: ActionType.Skip, playerId: LUKAS.id }),
    [1, 2, 3, 4, 5],
  );
  const snap = snapshot({ players, game: jonasTurn });
  await renderScreen(<GameScreen />, { session: fakeSession(snap), snapshot: snap });

  expect(screen.getByText('Jonas ist dran')).toBeTruthy();
  expect(screen.getByText('2\u00a0Würfe übrig')).toBeTruthy();
  expect(screen.getByLabelText('Jonas: 2\u00a0Würfe übrig')).toBeTruthy();
  expect(screen.getByLabelText('Verbleibende Zeit')).toBeTruthy();
  // Nothing to press: the roll button only exists on my own turn.
  expect(screen.queryByText('Nochmal würfeln')).toBeNull();
});

test('without a time limit there is no time bar, on any turn', async () => {
  const jonasTurn = play(game(players), { type: ActionType.Skip, playerId: LUKAS.id });
  const snap = snapshot({ players, game: jonasTurn });
  await renderScreen(<GameScreen />, { session: fakeSession(snap), snapshot: snap });

  expect(screen.getByLabelText('Jonas: 3\u00a0Würfe übrig')).toBeTruthy();
  expect(screen.queryByLabelText('Verbleibende Zeit')).toBeNull();
});

test("another player's running-out time gives no sound or vibration", async () => {
  jest.useFakeTimers({ now: 0 });
  const jonasTurn = play(game(players, TIMED), { type: ActionType.Skip, playerId: LUKAS.id });
  const snap = snapshot({ players, game: jonasTurn });
  await renderScreen(<GameScreen />, { session: fakeSession(snap), snapshot: snap });

  expect(screen.getByLabelText('Verbleibende Zeit')).toBeTruthy();
  await act(() => jest.advanceTimersByTime(31_000));
  expect(Haptics.impactAsync).not.toHaveBeenCalled();
  expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  expect(Haptics.selectionAsync).not.toHaveBeenCalled();
});
