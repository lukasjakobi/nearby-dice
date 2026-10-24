import { Ruleset } from '@/domain/enums';
import { DEFAULT_RULES, PRESETS, PresetId } from '@/domain/rules';
import type { GameState } from '@/domain/engine';
import { LUKAS, ANTONIA, game, snapshot } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { BoardRowKind, buildScoreboard } from '../view';

/** Gives Lukas's sheets the given number of extra Yatzys. */
const withExtraYatzys = (state: GameState, extra: number): GameState => ({
  ...state,
  players: state.players.map((p) =>
    p.id === LUKAS.id ? { ...p, sheets: p.sheets.map((s) => ({ ...s, extraYatzys: extra })) } : p,
  ),
});

const board = (rules = DEFAULT_RULES, state = game([LUKAS, ANTONIA], rules)) =>
  buildScoreboard(t, snapshot({ game: state }))!;

const keys = (view: ReturnType<typeof board>) => view.rows.map((row) => row.key);

describe('upper bonus row', () => {
  test('sits between the upper and the lower block', () => {
    expect(keys(board())).toContain('bonus');
    expect(keys(board())[6]).toBe('bonus');
  });

  test('left out when the rules switch the upper bonus off', () => {
    const rules = { ...DEFAULT_RULES, upperBonus: false };
    expect(keys(board(rules))).not.toContain('bonus');
  });
});

describe('extra Yatzy bonus row', () => {
  test('one value per sheet, right before the total', () => {
    const state = withExtraYatzys(game([LUKAS, ANTONIA]), 2);
    const view = board(DEFAULT_RULES, state);
    expect(keys(view).slice(-2)).toEqual(['yatzy-bonus', 'total']);
    expect(view.rows.find((row) => row.key === 'yatzy-bonus')).toEqual({
      key: 'yatzy-bonus',
      kind: BoardRowKind.Bonus,
      label: 'Yatzy-Bonus',
      cells: ['100', '0'],
    });
  });

  test('left out without a bonus per Yatzy', () => {
    const rules = { ...DEFAULT_RULES, yatzyBonus: 0 as const };
    expect(keys(board(rules))).not.toContain('yatzy-bonus');
  });

  test('left out for Yatzy', () => {
    const rules = { ...DEFAULT_RULES, ruleset: Ruleset.Yatzy, yatzyBonus: 50 as const };
    expect(keys(board(rules))).not.toContain('yatzy-bonus');
  });
});

describe('sheet factors', () => {
  test('null with one sheet per player', () => {
    expect(board().sheetFactors).toBeNull();
  });

  test('×1 · ×2 · ×3 with three sheets', () => {
    expect(board(PRESETS[PresetId.Triple]).sheetFactors).toBe('×1 · ×2 · ×3');
  });
});
