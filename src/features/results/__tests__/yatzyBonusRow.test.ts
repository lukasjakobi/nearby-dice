/**
 * The "Yatzy-Bonus" row of the results comparison: it appears in every mode once a player has a
 * further Yatzy, worth 50 each, and stays out while nobody has one.
 */
import { PRESET_ORDER, PRESETS, PresetId } from '@/domain/rules';
import type { Rules } from '@/domain/rules';
import type { GameState } from '@/domain/engine';
import { LUKAS, ANTONIA, game } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { buildResults } from '../view';

const finished = (rules: Rules, extraYatzys = 0): GameState => {
  const state = game([LUKAS, ANTONIA], rules);

  return {
    ...state,
    finished: true,
    players: state.players.map((p) => ({
      ...p,
      sheets: p.sheets.map((s) => ({ ...s, extraYatzys: p.id === LUKAS.id ? extraYatzys : 0 })),
    })),
  };
};

const bonusRow = (state: GameState) =>
  buildResults(t, state, [LUKAS, ANTONIA], LUKAS.id).compare.find(
    (row) => row.label === t('game.yatzyBonusRow'),
  );

test.each(PRESET_ORDER)(
  '%s comparison has the bonus row once someone has a further Yatzy',
  (preset) => {
    expect(bonusRow(finished(PRESETS[preset], 1))).toBeDefined();
  },
);

test.each(PRESET_ORDER)(
  '%s comparison has no bonus row while nobody has a further Yatzy',
  (preset) => {
    expect(bonusRow(finished(PRESETS[preset]))).toBeUndefined();
  },
);

test('a further Yatzy is worth 50 in the comparison, even in Blitz', () => {
  const row = bonusRow(finished(PRESETS[PresetId.Blitz], 1));

  expect(row?.cells.map((cell) => cell.value)).toEqual(['+50', '–']);
});
