import { ActionType } from '@/domain/engine';
import { Link } from '@/domain/enums';
import { DEFAULT_RULES } from '@/domain/rules';
import type { Rules } from '@/domain/rules';
import type { Dice } from '@/domain/roll';
import { Role, SessionPhase } from '@/session/types';
import { JONAS, LUKAS, ANTONIA, game, play, snapshot, withDice } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { ControlKind, buildGameView } from '../view';

const local = (dice: number[] = [0, 0, 0, 0, 0]) => ({
  sheetIndex: 0,
  viewed: null,
  shownDice: dice as unknown as Dice,
  shownRolled: dice.some((d) => d > 0),
  rolling: false,
  rollPending: false,
  scorePending: false,
  selectedCategory: null,
});

const TIMED: Rules = { ...DEFAULT_RULES, secondsPerTurn: 30 };
const players = [LUKAS, JONAS];
/** Jonas is up (the fixtures start every game at time 0, so his deadline is 30 s). */
const jonasTurn = (rules: Rules = TIMED) =>
  play(game(players, rules), { type: ActionType.Skip, playerId: LUKAS.id });

describe("the roll counter on another player's turn", () => {
  test('before their first roll: all rolls left, named for screen readers', () => {
    const view = buildGameView(t, snapshot({ players, game: jonasTurn() }), local())!;
    expect(view.control).toMatchObject({
      kind: ControlKind.Waiting,
      text: 'Jonas ist dran',
      rollsText: '3\u00a0Würfe übrig',
      rollsLabel: 'Jonas: 3\u00a0Würfe übrig',
      rollsLeft: 3,
      rollsTotal: 3,
    });
  });

  test('counts down with their rolls', () => {
    const rolled = withDice(jonasTurn(), [1, 2, 3, 4, 5]);
    const twice = { ...rolled, turn: { ...rolled.turn, rollsUsed: 2 } };
    const view = buildGameView(t, snapshot({ players, game: twice }), local([1, 2, 3, 4, 5]))!;
    expect(view.control).toMatchObject({
      rollsText: '1 Wurf übrig',
      rollsLabel: 'Jonas: 1 Wurf übrig',
      rollsLeft: 1,
    });
  });

  test('no rolls left', () => {
    const rolled = withDice(jonasTurn(), [1, 2, 3, 4, 5]);
    const used = { ...rolled, turn: { ...rolled.turn, rollsUsed: 3 } };
    const view = buildGameView(t, snapshot({ players, game: used }), local([1, 2, 3, 4, 5]))!;
    expect(view.control).toMatchObject({
      rollsText: 'Kein Wurf übrig',
      rollsLabel: 'Jonas: kein Wurf übrig',
      rollsLeft: 0,
    });
  });

  test('follows the rules: two rolls per turn', () => {
    const rules: Rules = { ...DEFAULT_RULES, rollsPerTurn: 2 } as Rules;
    const view = buildGameView(t, snapshot({ players, game: jonasTurn(rules) }), local())!;
    expect(view.control).toMatchObject({ rollsLeft: 2, rollsTotal: 2 });
  });

  test('has the same shape as on my own turn, so the bar does not jump', () => {
    const mine = buildGameView(t, snapshot({ players, game: game(players, TIMED) }), local())!;
    const theirs = buildGameView(t, snapshot({ players, game: jonasTurn() }), local())!;
    const rollFields = ({ rollsText, rollsLeft, rollsTotal }: Record<string, unknown>) => ({
      rollsText,
      rollsLeft,
      rollsTotal,
    });
    expect(rollFields(theirs.control)).toEqual(rollFields(mine.control));
    // On my own turn the label is just the text.
    expect(mine.control.rollsLabel).toBe('3\u00a0Würfe übrig');
  });

  test('also while they are unreachable', () => {
    const lost = players.map((p) => (p.id === JONAS.id ? { ...p, link: Link.Lost } : p));
    const view = buildGameView(t, snapshot({ players: lost, game: jonasTurn() }), local())!;
    expect(view.control).toMatchObject({
      kind: ControlKind.Waiting,
      text: 'Jonas ist nicht erreichbar',
      rollsLabel: 'Jonas: 3\u00a0Würfe übrig',
      rollsLeft: 3,
    });
  });
});

describe("the time bar on another player's turn", () => {
  const timer = { deadline: 30_000, limitMs: 30_000, lowMs: 10_000 };

  test('runs for whoever is up, the same as on my own turn', () => {
    const theirs = buildGameView(t, snapshot({ players, game: jonasTurn() }), local())!;
    expect(theirs.timer).toEqual(timer);
    const mine = buildGameView(t, snapshot({ players, game: game(players, TIMED) }), local())!;
    expect(mine.timer).toEqual(timer);
  });

  test('in local time, on a guest phone too', () => {
    const view = buildGameView(
      t,
      {
        ...snapshot({
          role: Role.Guest,
          myId: ANTONIA.id,
          players: [...players, ANTONIA],
          game: jonasTurn(),
        }),
        clockOffset: 1_500,
      },
      local(),
    )!;
    expect(view.timer).toEqual({ ...timer, deadline: 31_500 });
  });

  test('stays while they are unreachable: the host still scores for them at the deadline', () => {
    const lost = players.map((p) => (p.id === JONAS.id ? { ...p, link: Link.Lost } : p));
    const view = buildGameView(t, snapshot({ players: lost, game: jonasTurn() }), local())!;
    expect(view.timer).toEqual(timer);
  });

  test('none without a time limit', () => {
    const view = buildGameView(t, snapshot({ players, game: jonasTurn(DEFAULT_RULES) }), local())!;
    expect(view.timer).toBeNull();
  });

  test('none outside of play', () => {
    for (const phase of [SessionPhase.Countdown, SessionPhase.Finished]) {
      const view = buildGameView(t, snapshot({ players, phase, game: jonasTurn() }), local())!;
      expect(view.timer).toBeNull();
    }
  });
});
