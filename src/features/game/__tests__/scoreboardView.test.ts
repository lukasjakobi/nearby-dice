import { Category } from '@/domain/enums';
import { DEFAULT_RULES, PRESETS, PresetId } from '@/domain/rules';
import type { GameState } from '@/domain/engine';
import { LUKAS, ANTONIA, game, snapshot } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { CellState, buildScoreboard } from '../view';

/** Changes Lukas's or Antonia's sheets. */
const withSheets = (
  state: GameState,
  playerId: string,
  change: (sheet: GameState['players'][number]['sheets'][number]) => object,
): GameState => ({
  ...state,
  players: state.players.map((p) =>
    p.id === playerId ? { ...p, sheets: p.sheets.map((s) => ({ ...s, ...change(s) })) } : p,
  ),
});

const board = (state = game([LUKAS, ANTONIA])) => buildScoreboard(t, snapshot({ game: state }))!;

const antoniaAhead = () =>
  withSheets(game([LUKAS, ANTONIA]), ANTONIA.id, (s) => ({
    fields: { ...s.fields, [Category.Chance]: 20 },
  }));

describe('standings', () => {
  test('highest total first, with place and lead', () => {
    const view = board(antoniaAhead());
    expect(view.players.map((p) => [p.name, p.place, p.leading, p.total])).toEqual([
      ['Antonia', 1, true, '20'],
      ['Lukas', 2, false, '0'],
    ]);
  });

  test('nobody leads before the first points', () => {
    expect(board().players.map((p) => [p.place, p.leading])).toEqual([
      [1, false],
      [1, false],
    ]);
  });

  test('my own player is flagged', () => {
    expect(board(antoniaAhead()).players.map((p) => p.me)).toEqual([false, true]);
  });

  test('read out with place and points', () => {
    expect(board(antoniaAhead()).players[0].accessibilityLabel).toBe('1. Antonia, 20 Punkte');
  });
});

describe('sheets', () => {
  test('one scorecard per player with entries only, no previews', () => {
    const [antonia] = board(antoniaAhead()).players;
    expect(antonia.sheets).toHaveLength(1);
    const cells = [...antonia.sheets[0].upper, ...antonia.sheets[0].lower];
    expect(new Set(cells.map((cell) => cell.state))).toEqual(
      new Set([CellState.Filled, CellState.Open]),
    );
    expect(cells.every((cell) => !cell.pickable)).toBe(true);
    expect(antonia.sheets[0].tabs).toBeNull();
  });

  test('three sheets: one scorecard each, with the ×1 ×2 ×3 tabs', () => {
    const view = board(game([LUKAS, ANTONIA], PRESETS[PresetId.Triple]));
    const { sheets } = view.players[0];
    expect(sheets.map((sheet) => sheet.selectedTab)).toEqual([0, 1, 2]);
    expect(sheets[0].tabs).toEqual(['×1', '×2', '×3']);
  });

  test('upper bonus progress follows the rules', () => {
    expect(board().players[0].sheets[0].bonus).toMatchObject({ progress: '0 / 63' });
    const off = game([LUKAS, ANTONIA], { ...DEFAULT_RULES, upperBonus: false });
    expect(board(off).players[0].sheets[0].bonus).toBeNull();
  });
});

describe('extra Yatzy bonus', () => {
  test('only for a player who has earned one', () => {
    const view = board(withSheets(game([LUKAS, ANTONIA]), LUKAS.id, () => ({ extraYatzys: 2 })));
    const lukas = view.players.find((p) => p.id === LUKAS.id)!;
    const antonia = view.players.find((p) => p.id === ANTONIA.id)!;
    expect(lukas.yatzyBonus).toEqual(['Yatzy-Bonus +100']);
    expect(antonia.yatzyBonus).toEqual([null]);
  });
});
