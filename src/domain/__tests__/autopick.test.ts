import { Category } from '../enums';
import { autoPick } from '../autopick';
import { emptySheet } from '../sheet';
import type { Sheet } from '../sheet';
import type { Dice } from '../roll';
import { PRESETS, PresetId } from '../rules';

const d = (...values: number[]) => values as unknown as Dice;
const FOURS = d(4, 4, 4, 4, 4);

/** A sheet whose Yatzy field holds 50, with `fields` written in. */
function yatzyDone(fields: Partial<Record<Category, number>>): Sheet {
  const rules = PRESETS[PresetId.Classic];
  const sheet = emptySheet(rules);

  return { fields: { ...sheet.fields, [Category.Yatzy]: 50, ...fields }, extraYatzys: 0 };
}

test('the timeout pick takes the highest joker value: large straight 40 in Classic', () => {
  const rules = PRESETS[PresetId.Classic];
  const sheet = yatzyDone({ [Category.Fours]: 12 });

  expect(autoPick(FOURS, [sheet], rules, null)).toEqual({
    sheet: 0,
    category: Category.LargeStraight,
    points: 40,
  });
});

test('the timeout pick takes the matching upper field while it is open (50)', () => {
  const rules = PRESETS[PresetId.Classic];

  expect(autoPick(FOURS, [yatzyDone({})], rules, null)).toEqual({
    sheet: 0,
    category: Category.Fours,
    points: 50,
  });
});
