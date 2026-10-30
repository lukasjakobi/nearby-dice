/**
 * Triple mode on the results screen: per-player sums (fields, bonuses, totals) are
 * weighted by the sheet factors; the best move is a single entry and stays raw.
 */
import { Category } from '@/domain/enums';
import { PRESETS, PresetId } from '@/domain/rules';
import { playerTotal } from '@/domain/totals';
import type { GameState } from '@/domain/engine';
import { LUKAS, ANTONIA, game } from '@/test/fixtures';
import { t } from '@/test/i18n';

import { AwardKind, buildResults } from '../view';

const rules = PRESETS[PresetId.Triple];

const UPPER_63 = {
  [Category.Ones]: 3,
  [Category.Twos]: 6,
  [Category.Threes]: 9,
  [Category.Fours]: 12,
  [Category.Fives]: 15,
  [Category.Sixes]: 18,
};

/** Lukas: Chance 30 on ×1, 63 upper points on ×2, Full House 25 on ×3. Antonia: Chance 30 on ×1. */
function finished(): GameState {
  const state = game([LUKAS, ANTONIA], rules);
  const sheetFields: Record<string, Partial<Record<Category, number>>[]> = {
    [LUKAS.id]: [{ [Category.Chance]: 30 }, UPPER_63, { [Category.FullHouse]: 25 }],
    [ANTONIA.id]: [{ [Category.Chance]: 30 }, {}, {}],
  };

  return {
    ...state,
    finished: true,
    players: state.players.map((p) => ({
      ...p,
      sheets: p.sheets.map((s, i) => ({
        ...s,
        fields: { ...s.fields, ...sheetFields[p.id][i] },
      })),
    })),
  };
}

const results = () => buildResults(t, finished(), [LUKAS, ANTONIA], LUKAS.id);
const compareRow = (label: string) => results().compare.find((r) => r.label === label)!;

test('per-field comparison × the factor of the sheet the field is on', () => {
  expect(compareRow('Full House').cells.map((c) => c.value)).toEqual(['75', '–']);
  expect(compareRow('Sechser').cells.map((c) => c.value)).toEqual(['36', '–']);
  expect(compareRow('Chance').cells.map((c) => c.value)).toEqual(['30', '30']);
});

test('the upper bonus × factor', () => {
  expect(compareRow('Bonus').cells[0].value).toBe('+70');
  expect(results().rows[0]).toMatchObject({ upper: 126, bonus: 70 });
});

test('the best move is the highest raw entry, as written on the card', () => {
  const best = results().awards.find((a) => a.kind === AwardKind.BestMove)!;
  expect(best).toMatchObject({ value: '30', sub: 'Chance' });
  expect(best.who.map((w) => w.id)).toEqual([LUKAS.id, ANTONIA.id]);
});

test('totals are the weighted player total and add up, nothing multiplied twice', () => {
  const state = finished();
  const lukas = results().rows.find((r) => r.id === LUKAS.id)!;
  const expected = 30 * 1 + (63 + 35) * 2 + 25 * 3;
  expect(playerTotal(state.players.find((p) => p.id === LUKAS.id)!.sheets, rules)).toBe(expected);
  expect(lukas.points).toBe(expected);
  expect(lukas.upper + lukas.bonus + lukas.lower).toBe(expected);
  expect(compareRow('Gesamt').cells[0].value).toBe(String(expected));
});
