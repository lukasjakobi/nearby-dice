/**
 * Every phone hears every move: the other players' rolls, holds, field picks and
 * entries sound on my phone when their snapshot arrives, without vibrating. My own
 * moves sound on tap, so their snapshot echo stays quiet.
 */
import { renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { Category } from '@/domain/enums';
import type { GameState } from '@/domain/engine';
import { Sound, playSound } from '@/shared/audio';
import { ActionType, ANTONIA, LUKAS, game, play, snapshot, withDice } from '@/test/fixtures';
import { AppProviders } from '@/test/render';

import { useGameFeedback } from '../hooks';

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

const players = [LUKAS, ANTONIA];
/** Antonia's turn with a straight on the table, watched from my phone. */
const antoniaRolled = withDice(
  play(game(players), { type: ActionType.Skip, playerId: LUKAS.id }),
  [1, 2, 3, 4, 5],
);

/** Renders my phone on `from`, then lets `to` arrive; returns the sounds it played. */
async function soundsBetween(from: GameState, to: GameState): Promise<Sound[]> {
  const { rerender } = await renderHook(
    ({ state }: { state: GameState }) => useGameFeedback(snapshot({ game: state })),
    {
      wrapper: AppProviders,
      initialProps: { state: from },
    },
  );
  jest.mocked(playSound).mockClear();
  await rerender({ state: to });

  return jest.mocked(playSound).mock.calls.map(([sound]) => sound);
}

const vibrated = () =>
  [Haptics.impactAsync, Haptics.notificationAsync, Haptics.selectionAsync].some(
    (fn) => jest.mocked(fn).mock.calls.length > 0,
  );

afterEach(() => jest.clearAllMocks());

describe("another player's move sounds on my phone, without vibrating", () => {
  test('a roll', async () => {
    expect(
      await soundsBetween(
        antoniaRolled,
        play(antoniaRolled, { type: ActionType.Roll, by: ANTONIA.id }),
      ),
    ).toEqual([Sound.Roll]);
    expect(vibrated()).toBe(false);
  });

  test('holding and releasing a die', async () => {
    const held = play(antoniaRolled, {
      type: ActionType.Hold,
      by: ANTONIA.id,
      held: [true, false, false, false, false],
    });
    expect(await soundsBetween(antoniaRolled, held)).toEqual([Sound.Hold]);

    const released = play(held, {
      type: ActionType.Hold,
      by: ANTONIA.id,
      held: [false, false, false, false, false],
    });
    expect(await soundsBetween(held, released)).toEqual([Sound.Release]);
    expect(vibrated()).toBe(false);
  });

  test('picking a field, but not clearing it again', async () => {
    const picked = play(antoniaRolled, {
      type: ActionType.Focus,
      by: ANTONIA.id,
      focus: { category: Category.Chance, sheet: 0 },
    });
    expect(await soundsBetween(antoniaRolled, picked)).toEqual([Sound.Tap]);

    const cleared = play(picked, { type: ActionType.Focus, by: ANTONIA.id, focus: null });
    expect(await soundsBetween(picked, cleared)).toEqual([]);
  });

  test('a field entered with points', async () => {
    const scored = play(antoniaRolled, {
      type: ActionType.Score,
      by: ANTONIA.id,
      category: Category.Chance,
      sheet: 0,
    });
    // The turn coming back to me nudges as well.
    expect(await soundsBetween(antoniaRolled, scored)).toEqual([Sound.Turn, Sound.Score]);
    expect(jest.mocked(Haptics.notificationAsync).mock.calls).toEqual([['warning']]);
  });

  test('a strike', async () => {
    const struck = play(antoniaRolled, {
      type: ActionType.Score,
      by: ANTONIA.id,
      category: Category.Yatzy,
      sheet: 0,
    });
    expect(await soundsBetween(antoniaRolled, struck)).toContain(Sound.Strike);
  });
});

test('a held die from the last turn makes no release sound when the next one starts', async () => {
  const held = play(antoniaRolled, {
    type: ActionType.Hold,
    by: ANTONIA.id,
    held: [true, true, false, false, false],
  });
  const passed = play(held, {
    type: ActionType.Score,
    by: ANTONIA.id,
    category: Category.Chance,
    sheet: 0,
  });
  expect(await soundsBetween(held, passed)).not.toContain(Sound.Release);
});

describe('my own moves already sounded on tap', () => {
  const myTurn = withDice(game(players), [1, 2, 3, 4, 5]);

  test('their snapshot echo stays quiet', async () => {
    const rolled = play(myTurn, { type: ActionType.Roll, by: LUKAS.id });
    expect(await soundsBetween(myTurn, rolled)).toEqual([]);

    const held = play(myTurn, {
      type: ActionType.Hold,
      by: LUKAS.id,
      held: [true, false, false, false, false],
    });
    expect(await soundsBetween(myTurn, held)).toEqual([]);
  });

  test('my entry sounds and vibrates when the host confirms it', async () => {
    const scored = play(myTurn, {
      type: ActionType.Score,
      by: LUKAS.id,
      category: Category.Chance,
      sheet: 0,
    });
    expect(await soundsBetween(myTurn, scored)).toEqual([Sound.Score]);
    expect(jest.mocked(Haptics.notificationAsync).mock.calls).toEqual([['success']]);
  });
});
