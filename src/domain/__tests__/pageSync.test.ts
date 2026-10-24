import { ActionType, RejectReason, createGame, reduce } from '../engine';
import type { GameAction, GameState } from '../engine';
import { Category, StartingPlayer } from '../enums';
import { seededRng } from '../random';
import { DEFAULT_RULES, PRESETS, PresetId } from '../rules';
import type { Rules } from '../rules';

const ctx = (seed = 1) => ({ now: 0, rng: seededRng(seed) });

function newGame(rules: Rules = PRESETS[PresetId.Triple]): GameState {
  return createGame({
    rules: { ...rules, startingPlayer: StartingPlayer.Host },
    playerIds: ['a', 'b'],
    hostId: 'a',
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

const view = (by: string, sheet: number): GameAction => ({
  type: ActionType.ViewSheet,
  by,
  sheet,
});

describe('the shared page', () => {
  test('every turn starts on the first sheet', () => {
    expect(newGame().turn.page).toBe(0);
  });

  test('the active player turns it, before and after rolling', () => {
    const viewed = apply(newGame(), view('a', 2));
    expect(viewed.turn.page).toBe(2);
    expect(viewed.rev).toBe(newGame().rev + 1);
    const rolled = apply(viewed, { type: ActionType.Roll, by: 'a' });
    expect(rolled.turn.page).toBe(2);
  });

  test('only the player whose turn it is may turn it', () => {
    const result = reduce(newGame(), view('b', 1), ctx());
    expect(result.rejected).toBe(RejectReason.NotYourTurn);
    expect(result.state.turn.page).toBe(0);
  });

  test.each([-1, 3, 1.5, Number.NaN])('rejects sheet %p with three sheets', (sheet) => {
    expect(reduce(newGame(), view('a', sheet), ctx()).rejected).toBe(RejectReason.UnknownSheet);
  });

  test('a single sheet only has page 0', () => {
    const single = newGame(DEFAULT_RULES);
    expect(reduce(single, view('a', 1), ctx()).rejected).toBe(RejectReason.UnknownSheet);
    expect(reduce(single, view('a', 0), ctx()).rejected).toBeUndefined();
  });

  test('the same page again changes nothing', () => {
    const game = newGame();
    expect(reduce(game, view('a', 0), ctx()).state).toBe(game);
  });

  test('selecting a field opens its sheet', () => {
    const rolled = apply(newGame(), { type: ActionType.Roll, by: 'a' });
    const focused = apply(rolled, {
      type: ActionType.Focus,
      by: 'a',
      focus: { category: Category.Chance, sheet: 2 },
    });
    expect(focused.turn.page).toBe(2);
    // Clearing the selection keeps the sheet open.
    const cleared = apply(focused, { type: ActionType.Focus, by: 'a', focus: null });
    expect(cleared.turn.page).toBe(2);
  });

  test('leaving the sheet drops a selection on it', () => {
    const chance = { category: Category.Chance, sheet: 1 };
    const focused = apply(
      newGame(),
      { type: ActionType.Roll, by: 'a' },
      { type: ActionType.Focus, by: 'a', focus: chance },
    );
    expect(apply(focused, view('a', 2)).turn).toMatchObject({ page: 2, focus: null });
    // Staying on it keeps the selection.
    expect(apply(focused, view('a', 1)).turn).toMatchObject({ page: 1, focus: chance });
  });

  test('the next turn starts on the first sheet again', () => {
    const scored = apply(
      newGame(),
      view('a', 2),
      { type: ActionType.Roll, by: 'a' },
      { type: ActionType.Score, by: 'a', category: Category.Chance, sheet: 2 },
    );
    expect(scored.turn).toMatchObject({ playerId: 'b', page: 0 });
  });
});
