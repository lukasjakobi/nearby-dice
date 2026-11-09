/**
 * The dice animation's rules, run through the pure reducer without rendering: `now` is passed
 * in, and the hook's timers are the `Shake`, `Land` and `GiveUp` events.
 */
import { ActionType, NO_DICE } from '@/domain/engine';
import type { Turn } from '@/domain/engine';
import { Category } from '@/domain/enums';
import { LUKAS, ANTONIA, game, play, withDice } from '@/test/fixtures';

import {
  buildDiceAnimationView,
  diceAnimationReducer,
  DiceEvent,
  initDiceAnimation,
  SHAKE_MS,
} from '../view';
import type { DiceAction, DiceAnimationState } from '../view';

const start = withDice(game([LUKAS, ANTONIA]), [2, 2, 5, 5, 5]);
const first = start.turn;
const rollOf = (turn: Turn, dice: number[]): Turn => ({
  ...turn,
  dice: dice as unknown as Turn['dice'],
  rollsUsed: turn.rollsUsed + 1,
  rollSeq: turn.rollSeq + 1,
});
const reroll = rollOf(first, [6, 6, 6, 1, 1]);
const nextTurn = play(start, {
  type: ActionType.Score,
  by: LUKAS.id,
  category: Category.FullHouse,
  sheet: 0,
}).turn;

const run = (actions: DiceAction[], from = initDiceAnimation(first)) =>
  actions.reduce(diceAnimationReducer, from);
const view = (state: DiceAnimationState, reduceMotion = false) =>
  buildDiceAnimationView(state, state.turn, reduceMotion);
const arrive = (turn: Turn, now: number, reduceMotion = false): DiceAction => ({
  type: DiceEvent.Turn,
  turn,
  now,
  reduceMotion,
});

test('settled: the turn on screen, nothing shakes', () => {
  expect(view(initDiceAnimation(first))).toEqual({
    shownDice: [2, 2, 5, 5, 5],
    shownRolled: true,
    shakeKeys: [0, 0, 0, 0, 0],
    rolling: false,
    rollPending: false,
    rollSeq: first.rollSeq,
    shownSeq: first.rollSeq,
  });
});

describe('my own roll', () => {
  test('shakes on the press and lands at the end of the running shake', () => {
    const requested = run([{ type: DiceEvent.Request, now: 0, reduceMotion: false }]);
    expect(view(requested)).toMatchObject({ rolling: true, rollPending: true });
    expect(requested.shakeKeys).toEqual([1, 1, 1, 1, 1]);
    expect(requested.shakeEndsAt).toBe(SHAKE_MS);

    // The result arrives 100 ms later: no second shake, the old faces stay up.
    const answered = run([arrive(reroll, 100)], requested);
    expect(view(answered)).toMatchObject({
      rolling: true,
      rollPending: false,
      shownDice: [2, 2, 5, 5, 5],
      shownSeq: first.rollSeq,
      rollSeq: reroll.rollSeq,
    });
    expect(answered.shakeKeys).toEqual([1, 1, 1, 1, 1]);
    expect(answered.shakeEndsAt).toBe(SHAKE_MS);

    const landed = run([{ type: DiceEvent.Land }], answered);
    expect(view(landed)).toMatchObject({
      rolling: false,
      shownDice: [6, 6, 6, 1, 1],
      shownSeq: reroll.rollSeq,
    });
    expect(landed.requested).toBeNull();
  });

  test('held dice stay still while the others shake', () => {
    const held = { ...first, held: [true, true, false, false, false] as Turn['held'] };
    const state = run(
      [{ type: DiceEvent.Request, now: 0, reduceMotion: false }],
      initDiceAnimation(held),
    );
    expect(state.shakeKeys).toEqual([0, 0, 1, 1, 1]);
  });

  test('without an answer the dice keep shaking until the request gives up', () => {
    const waiting = run([
      { type: DiceEvent.Request, now: 0, reduceMotion: false },
      { type: DiceEvent.Shake, now: SHAKE_MS },
      { type: DiceEvent.Shake, now: 2 * SHAKE_MS },
    ]);
    expect(waiting.shakeKeys[0]).toBe(3);
    expect(waiting.shakeEndsAt).toBe(3 * SHAKE_MS);
    expect(view(waiting)).toMatchObject({ rolling: true, rollPending: true });

    const gaveUp = run([{ type: DiceEvent.GiveUp }], waiting);
    expect(view(gaveUp)).toMatchObject({ rolling: false, rollPending: false });
  });

  test('a late answer after giving up shakes again like any roll', () => {
    const late = run([
      { type: DiceEvent.Request, now: 0, reduceMotion: false },
      { type: DiceEvent.GiveUp },
      arrive(reroll, 2500),
    ]);
    expect(late.shakeKeys).toEqual([2, 2, 2, 2, 2]);
    expect(late.shakeEndsAt).toBe(2500 + SHAKE_MS);
  });
});

describe("another player's roll", () => {
  test('shakes when it arrives, then lands', () => {
    const shaking = run([arrive(reroll, 1000)]);
    expect(view(shaking)).toMatchObject({
      rolling: true,
      rollPending: false,
      shownDice: [2, 2, 5, 5, 5],
    });
    expect(shaking.shakeKeys).toEqual([1, 1, 1, 1, 1]);
    expect(shaking.shakeEndsAt).toBe(1000 + SHAKE_MS);

    const landed = run([{ type: DiceEvent.Land }], shaking);
    expect(view(landed)).toMatchObject({ rolling: false, shownDice: [6, 6, 6, 1, 1] });
  });

  test('a repeated snapshot of the same roll does not shake twice', () => {
    const held = { ...reroll, held: [true, false, false, false, false] as Turn['held'] };
    const state = run([arrive(reroll, 1000), arrive(held, 1100)]);
    expect(state.shakeKeys).toEqual([1, 1, 1, 1, 1]);
    expect(state.shakeEndsAt).toBe(1000 + SHAKE_MS);
  });
});

describe('a turn change', () => {
  test('mid-shake shows the new turn at once, without the old roll', () => {
    const passed = run([arrive(reroll, 0), arrive(nextTurn, 100)]);
    expect(view(passed)).toMatchObject({ rolling: false, shownRolled: false, shownDice: NO_DICE });
    expect(passed.shakeEndsAt).toBeNull();
  });

  test('before the host answers drops the request at once', () => {
    const state = run([{ type: DiceEvent.Request, now: 0, reduceMotion: false }]);
    // The screen already renders the next turn before the reducer has seen it.
    expect(buildDiceAnimationView(state, nextTurn, false)).toMatchObject({
      rolling: false,
      rollPending: false,
    });
    const passed = run([arrive(nextTurn, 100)], state);
    expect(passed.requested).toBeNull();
    expect(passed.shakeEndsAt).toBeNull();
  });
});

describe('the frame before the reducer sees a new turn', () => {
  test('a new roll keeps the old faces up', () => {
    const state = initDiceAnimation(first);
    expect(buildDiceAnimationView(state, reroll, false)).toMatchObject({
      rolling: true,
      shownDice: [2, 2, 5, 5, 5],
    });
  });

  test('a new turn shows at once', () => {
    const state = run([arrive(reroll, 0)]);
    expect(buildDiceAnimationView(state, nextTurn, false)).toMatchObject({
      rolling: false,
      shownDice: NO_DICE,
    });
  });
});

describe('with reduced motion', () => {
  test('my roll waits without shaking and lands as soon as it arrives', () => {
    const requested = run([{ type: DiceEvent.Request, now: 0, reduceMotion: true }]);
    expect(requested.shakeKeys).toEqual([0, 0, 0, 0, 0]);
    expect(view(requested, true)).toMatchObject({ rolling: false, rollPending: true });

    const landed = run([arrive(reroll, 100, true)], requested);
    expect(view(landed, true)).toMatchObject({
      rolling: false,
      rollPending: false,
      shownDice: [6, 6, 6, 1, 1],
    });
    expect(landed.requested).toBeNull();
  });

  test('switched off while my request waits, the answer still shakes and lands', () => {
    const answered = run([
      { type: DiceEvent.Request, now: 0, reduceMotion: true },
      arrive(first, 50, false),
      arrive(reroll, 100, false),
    ]);
    expect(view(answered)).toMatchObject({ rolling: true, shownDice: [2, 2, 5, 5, 5] });
    expect(answered.shakeKeys).toEqual([1, 1, 1, 1, 1]);
    expect(answered.shakeEndsAt).toBe(100 + SHAKE_MS);
  });

  test("another player's roll lands at once", () => {
    const landed = run([arrive(reroll, 0, true)]);
    expect(landed.shakeKeys).toEqual([0, 0, 0, 0, 0]);
    expect(view(landed, true)).toMatchObject({ rolling: false, shownDice: [6, 6, 6, 1, 1] });
  });
});
