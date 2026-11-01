import { DEFAULT_RULES, PRESET_ORDER, PRESETS, PresetId } from '@/domain/rules';
import type { GameState } from '@/domain/engine';
import { LUKAS, ANTONIA, game, snapshot } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { buildScoreboard } from '../view';

/** Gives Lukas's sheets the given number of extra Yatzys. */
const withExtraYatzys = (state: GameState, extra: number): GameState => ({
  ...state,
  players: state.players.map((p) =>
    p.id === LUKAS.id ? { ...p, sheets: p.sheets.map((s) => ({ ...s, extraYatzys: extra })) } : p,
  ),
});

const board = (rules = DEFAULT_RULES, state = game([LUKAS, ANTONIA], rules)) =>
  buildScoreboard(t, snapshot({ game: state }))!;

const lukasOf = (view: ReturnType<typeof board>) => view.players.find((p) => p.id === LUKAS.id)!;

describe('player sheets', () => {
  test('one sheet per player in turn order, mine flagged', () => {
    const view = board();
    expect(view.players.map((p) => p.id)).toEqual([LUKAS.id, ANTONIA.id]);
    expect(view.players.map((p) => p.me)).toEqual([true, false]);
  });

  test('the upper block lists the six faces, the lower block the seven illustrated fields', () => {
    const [player] = board().players;
    expect(player.upper.map((row) => row.face)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(player.lower.map((row) => row.face)).toEqual([null, null, null, null, null, null, null]);
    expect(player.lower.every((row) => row.category !== null)).toBe(true);
  });

  test('the total starts at zero', () => {
    expect(board().players[0].total).toBe('0');
  });
});

describe('upper bonus', () => {
  test('a single sheet shows the bonus as a progress bar, not as a row', () => {
    const [player] = board().players;
    expect(player.bonus).toMatchObject({ progress: '0 / 63', reached: false });
    expect(player.upper.map((row) => row.key)).not.toContain('bonus');
  });

  test('left out when the rules switch the upper bonus off', () => {
    const view = board({ ...DEFAULT_RULES, upperBonus: false });
    expect(view.players[0].bonus).toBeNull();
    expect(view.players[0].upper.map((row) => row.key)).not.toContain('bonus');
  });
});

describe('extra Yatzy bonus row', () => {
  test('only listed for a player who has earned one', () => {
    const view = board(DEFAULT_RULES, withExtraYatzys(game([LUKAS, ANTONIA]), 2));
    expect(lukasOf(view).lower.at(-1)).toEqual({
      key: 'yatzy-bonus',
      category: null,
      face: null,
      label: 'Yatzy-Bonus',
      value: '100',
    });
    expect(view.players[1].lower.map((row) => row.key)).not.toContain('yatzy-bonus');
  });

  test.each(PRESET_ORDER)('shown in every mode when earned (%s)', (preset) => {
    const view = board(
      PRESETS[preset],
      withExtraYatzys(game([LUKAS, ANTONIA], PRESETS[preset]), 1),
    );
    expect(lukasOf(view).lower.map((row) => row.key)).toContain('yatzy-bonus');
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
