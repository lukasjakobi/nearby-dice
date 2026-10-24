import { act, renderHook } from '@testing-library/react-native';

import type { Turn } from '@/domain/engine';
import { LUKAS, ANTONIA, game, withDice } from '@/test/fixtures';

import { useDiceAnimation } from '../hooks';

const first = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]).turn;
const rollOf = (turn: Turn, dice: number[]): Turn => ({
  ...turn,
  dice: dice as unknown as Turn['dice'],
  rollsUsed: turn.rollsUsed + 1,
  rollSeq: turn.rollSeq + 1,
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('my roll shakes on press and lands after the shake, not before', async () => {
  const { result, rerender } = await renderHook(
    ({ turn }: { turn: Turn }) => useDiceAnimation(turn),
    {
      initialProps: { turn: first },
    },
  );
  const before = result.current.shakeKeys;

  await act(() => result.current.request());
  expect(result.current.rollPending).toBe(true);
  expect(result.current.rolling).toBe(true);
  expect(result.current.shakeKeys.every((key, i) => key === before[i] + 1)).toBe(true);

  // The result arrives 100 ms later (a guest's round trip): no second shake starts,
  // and the old faces stay until the running shake ends.
  await act(() => jest.advanceTimersByTime(100));
  const next = rollOf(first, [6, 6, 6, 1, 1]);
  await rerender({ turn: next });
  expect(result.current.rollPending).toBe(false);
  expect(result.current.shakeKeys).toEqual(before.map((key) => key + 1));
  expect(result.current.shownDice).toEqual([2, 2, 5, 5, 5]);

  await act(() => jest.advanceTimersByTime(220));
  expect(result.current.rolling).toBe(false);
  expect(result.current.shownDice).toEqual([6, 6, 6, 1, 1]);
});

test('held dice stay still while the others shake', async () => {
  const held = { ...first, held: [true, true, false, false, false] as Turn['held'] };
  const { result } = await renderHook(() => useDiceAnimation(held));
  await act(() => result.current.request());
  expect(result.current.shakeKeys).toEqual([0, 0, 1, 1, 1]);
});

test('without an answer, the dice keep shaking and the button unlocks after 2 s', async () => {
  const { result } = await renderHook(() => useDiceAnimation(first));
  await act(() => result.current.request());
  await act(() => jest.advanceTimersByTime(640));
  expect(result.current.shakeKeys[0]).toBe(3);
  await act(() => jest.advanceTimersByTime(1400));
  expect(result.current.rollPending).toBe(false);
  expect(result.current.rolling).toBe(false);
});
