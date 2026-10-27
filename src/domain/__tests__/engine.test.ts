import { botMove } from '@/dev';
import { diceWithSum, withDice } from '@/test/fixtures';

import { autoPick } from '../autopick';
import {
  ActionType,
  HistoryKind,
  lastEntry,
  RejectReason,
  createGame,
  currentRound,
  luckyNumberFor,
  luckyNumberOf,
  ranking,
  reduce,
} from '../engine';
import type { GameAction, GameState, Held } from '../engine';
import { Category, StartingPlayer } from '../enums';
import { seededRng } from '../random';
import { DEFAULT_RULES, PRESET_ORDER, PRESETS, PresetId } from '../rules';
import type { Rules } from '../rules';
import type { Dice } from '../roll';
import { emptySheet, turnsPerPlayer } from '../sheet';

const ctx = (seed = 1) => ({ now: 0, rng: seededRng(seed) });

function newGame(rules: Rules = DEFAULT_RULES, ids = ['a', 'b']): GameState {
  return createGame({
    rules: { ...rules, startingPlayer: StartingPlayer.Host },
    playerIds: ids,
    hostId: ids[0],
    seed: 42,
    ctx: ctx(),
  });
}

function apply(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce((s, action) => {
    const result = reduce(s, action, ctx(s.rev));
    if (result.rejected) throw new Error(`rejected: ${result.rejected}`);

    return result.state;
  }, state);
}

/** Plays every turn with the bot strategy until the game ends. */
function playOut(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < 2000 && !s.finished; i++) {
    const move = botMove(s, s.turn.playerId)!;
    s = apply(s, move);
  }

  return s;
}

describe('focus', () => {
  const chance = { category: Category.Chance, sheet: 0 };

  test('the active player shows a field after rolling; the next roll clears it', () => {
    const rolled = apply(newGame(), { type: ActionType.Roll, by: 'a' });
    const focused = apply(rolled, { type: ActionType.Focus, by: 'a', focus: chance });
    expect(focused.turn.focus).toEqual(chance);
    expect(apply(focused, { type: ActionType.Roll, by: 'a' }).turn.focus).toBeNull();
    expect(apply(focused, { type: ActionType.Focus, by: 'a', focus: null }).turn.focus).toBeNull();
  });

  test('scoring passes the turn without a focus', () => {
    const scored = apply(
      newGame(),
      { type: ActionType.Roll, by: 'a' },
      { type: ActionType.Focus, by: 'a', focus: chance },
      { type: ActionType.Score, by: 'a', ...chance },
    );
    expect(scored.turn).toMatchObject({ playerId: 'b', focus: null });
  });

  test('only a field the player could enter now', () => {
    const focus = (state: GameState, action: GameAction) => reduce(state, action, ctx()).rejected;
    expect(focus(newGame(), { type: ActionType.Focus, by: 'a', focus: chance })).toBe(
      RejectReason.NotRolled,
    );
    const rolled = apply(newGame(), { type: ActionType.Roll, by: 'a' });
    expect(focus(rolled, { type: ActionType.Focus, by: 'b', focus: chance })).toBe(
      RejectReason.NotYourTurn,
    );
    expect(focus(rolled, { type: ActionType.Focus, by: 'a', focus: { ...chance, sheet: 2 } })).toBe(
      RejectReason.UnknownSheet,
    );
  });
});

describe('turns', () => {
  test('the host starts when configured', () => {
    expect(newGame().turn.playerId).toBe('a');
  });

  test('only the active player may act', () => {
    const result = reduce(newGame(), { type: ActionType.Roll, by: 'b' }, ctx());
    expect(result.rejected).toBe(RejectReason.NotYourTurn);
  });

  test('rolls are limited per turn', () => {
    const s = apply(newGame(), ...Array(3).fill({ type: ActionType.Roll, by: 'a' }));
    expect(reduce(s, { type: ActionType.Roll, by: 'a' }, ctx()).rejected).toBe(
      RejectReason.NoRollsLeft,
    );
  });

  test('held dice keep their value', () => {
    const rolled = apply(newGame(), { type: ActionType.Roll, by: 'a' });
    const held: Held = [true, false, true, false, false];
    const again = apply(
      rolled,
      { type: ActionType.Hold, by: 'a', held },
      { type: ActionType.Roll, by: 'a' },
    );
    expect(again.turn.dice[0]).toBe(rolled.turn.dice[0]);
    expect(again.turn.dice[2]).toBe(rolled.turn.dice[2]);
    expect(again.turn.rollSeq).toBe(2);
  });

  test('cannot hold before the first roll or score without rolling', () => {
    const s = newGame();
    expect(
      reduce(s, { type: ActionType.Hold, by: 'a', held: [true, true, true, true, true] }, ctx())
        .rejected,
    ).toBe(RejectReason.CannotHold);
    expect(
      reduce(s, { type: ActionType.Score, by: 'a', category: Category.Chance, sheet: 0 }, ctx())
        .rejected,
    ).toBe(RejectReason.NotRolled);
  });

  test('scoring passes the turn and records the entry', () => {
    const s = apply(
      newGame(),
      { type: ActionType.Roll, by: 'a' },
      { type: ActionType.Score, by: 'a', category: Category.Chance, sheet: 0 },
    );
    expect(s.turn.playerId).toBe('b');
    expect(s.turn.rollsUsed).toBe(0);
    expect(lastEntry(s)).toMatchObject({
      kind: HistoryKind.Scored,
      playerId: 'a',
      category: Category.Chance,
      round: 1,
    });
    expect(currentRound(s)).toBe(1);
  });

  test('time limit sets a deadline', () => {
    const s = newGame(PRESETS[PresetId.Blitz]);
    expect(s.turn.deadline).toBe(30_000);
  });
});

describe('timeout', () => {
  test('rolls if needed and writes the best field automatically', () => {
    const s = apply(newGame(), { type: ActionType.Timeout });
    expect(lastEntry(s)?.kind).toBe(HistoryKind.AutoScored);
    expect(s.turn.playerId).toBe('b');
  });

  test('strikes the least valuable field when nothing scores', () => {
    const sheet = emptySheet(DEFAULT_RULES);
    const onlyHard = {
      fields: Object.fromEntries(
        Object.keys(sheet.fields).map((c) => [
          c,
          c === Category.Yatzy || c === Category.LargeStraight ? null : 5,
        ]),
      ),
      extraYatzys: 0,
    };
    const pick = autoPick([1, 2, 2, 4, 6] as unknown as Dice, [onlyHard], DEFAULT_RULES, null);
    expect(pick).toEqual({ sheet: 0, category: Category.Yatzy, points: 0 });
  });
});

describe('same dice', () => {
  test('every player gets the same first roll in a round', () => {
    const rules = PRESETS[PresetId.SameDice];
    let s = newGame(rules);
    s = apply(s, { type: ActionType.Roll, by: 'a' });
    const first = s.turn.dice;
    s = apply(s, { type: ActionType.Score, by: 'a', category: Category.Chance, sheet: 0 });
    s = apply(s, { type: ActionType.Roll, by: 'b' });
    expect(s.turn.dice).toEqual(first);
  });
});

describe('lucky number', () => {
  const rules = PRESETS[PresetId.LuckyNumber];

  test('deterministic targets cover 8 through 26 across seeds and rounds', () => {
    const seen = new Set<number>();
    for (const seed of [0, 1, 42, -1, 0xffffffff]) {
      for (let round = 1; round <= 100; round++) {
        const target = luckyNumberFor(seed, round);
        expect(Number.isInteger(target)).toBe(true);
        expect(target).toBeGreaterThanOrEqual(8);
        expect(target).toBeLessThanOrEqual(26);
        expect(luckyNumberFor(seed, round)).toBe(target);
        seen.add(target);
      }
    }

    expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: 19 }, (_, i) => i + 8));
  });

  test.each([false, true])('the whole round shares its target with sameDice=%s', (sameDice) => {
    let state = newGame({ ...rules, sameDice }, ['a', 'b', 'c']);
    for (const [index, category] of [Category.Chance, Category.Ones].entries()) {
      for (const player of ['a', 'b', 'c']) {
        expect(state.turn.playerId).toBe(player);
        expect(currentRound(state)).toBe(index + 1);
        expect(luckyNumberOf(state)).toBe(luckyNumberFor(state.seed, index + 1));
        const target = luckyNumberOf(state);
        state = apply(state, { type: ActionType.Roll, by: player });
        expect(luckyNumberOf(state)).toBe(target);
        state = apply(state, { type: ActionType.Score, by: player, category, sheet: 0 });
      }
    }
  });

  test.each([0, 1])('manual scoring records an exact hit or a miss (offset %i)', (offset) => {
    const initial = newGame(rules);
    const dice = diceWithSum(luckyNumberOf(initial)! + offset);
    const state = apply(withDice(initial, [...dice]), {
      type: ActionType.Score,
      by: 'a',
      category: Category.LuckyNumber,
      sheet: 0,
    });
    const points = offset === 0 ? 40 : 0;
    expect(state.players[0].sheets[0].fields[Category.LuckyNumber]).toBe(points);
    expect(lastEntry(state)).toMatchObject({
      kind: HistoryKind.Scored,
      category: Category.LuckyNumber,
      round: 1,
      points,
      dice,
    });
  });

  test('timeout chooses and records the lucky-number hit', () => {
    const initial = newGame({ ...rules, secondsPerTurn: 30 });
    const dice = diceWithSum(luckyNumberOf(initial)!);
    const state = apply(withDice(initial, [...dice]), { type: ActionType.Timeout });
    expect(lastEntry(state)).toMatchObject({
      kind: HistoryKind.AutoScored,
      category: Category.LuckyNumber,
      points: 40,
    });
    expect(state.players[0].sheets[0].fields[Category.LuckyNumber]).toBe(40);
  });

  test('the rule must be on to select or score the field', () => {
    expect(luckyNumberOf(newGame())).toBeNull();
    const rolled = apply(newGame(), { type: ActionType.Roll, by: 'a' });
    expect(
      reduce(
        rolled,
        {
          type: ActionType.Score,
          by: 'a',
          category: Category.LuckyNumber,
          sheet: 0,
        },
        ctx(),
      ).rejected,
    ).toBe(RejectReason.FieldNotAllowed);
  });
});

describe('lost and removed players', () => {
  test('skip passes the turn without using a field', () => {
    const s = apply(newGame(), { type: ActionType.Skip, playerId: 'a' });
    expect(s.turn.playerId).toBe('b');
    expect(s.players[0].turnsTaken).toBe(0);
    expect(lastEntry(s)).toMatchObject({ kind: HistoryKind.Skipped, playerId: 'a' });
  });

  test('a removed player leaves the turn order and the ranking', () => {
    const s = apply(newGame(DEFAULT_RULES, ['a', 'b', 'c']), {
      type: ActionType.Remove,
      playerId: 'a',
    });
    expect(s.turn.playerId).toBe('b');
    expect(ranking(s).map((r) => r.playerId)).not.toContain('a');
  });
});

describe('full games', () => {
  test.each(PRESET_ORDER)('%s plays to the end', (preset) => {
    const rules = PRESETS[preset];
    const end = playOut(newGame(rules, ['a', 'b', 'c']));
    expect(end.finished).toBe(true);
    for (const p of end.players) expect(p.turnsTaken).toBe(turnsPerPlayer(rules));
    expect(end.history).toHaveLength(3 * turnsPerPlayer(rules));
    expect(end.history.map((e) => e.seq)).toEqual(end.history.map((_, i) => i + 1));
    const placements = ranking(end);
    expect(placements).toHaveLength(3);
    expect(placements[0].place).toBe(1);
    expect(placements[0].winner).toBe(true);
  });

  test('ties share first place', () => {
    const s = newGame();
    expect(ranking(s).every((p) => p.place === 1 && p.winner)).toBe(true);
  });
});
