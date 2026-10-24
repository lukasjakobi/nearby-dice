import { Category, Ruleset } from '../enums';
import { sheetFields } from '../fields';
import { analyseRoll } from '../roll';
import type { Dice } from '../roll';
import { DEFAULT_RULES, PRESETS, PresetId } from '../rules';
import {
  categoriesFor,
  emptySheet,
  lowerCategories,
  turnsPerPlayer,
  UPPER_CATEGORIES,
} from '../sheet';

const CLASSIC = DEFAULT_RULES;
const YATZY = PRESETS[PresetId.Yatzy];

test('the yatzy preset has 15 fields', () => {
  expect(Object.keys(emptySheet(YATZY).fields)).toHaveLength(15);
  expect(Object.keys(emptySheet(CLASSIC).fields)).toHaveLength(13);
});

test('starts the lower block with the XL fields and gives each player 17 turns', () => {
  const rules = PRESETS[PresetId.ClassicXl];

  expect(categoriesFor(rules)).toEqual([
    ...UPPER_CATEGORIES,
    Category.TwoPairs,
    Category.Even,
    Category.Odd,
    Category.Mini,
    ...lowerCategories(CLASSIC),
  ]);
  expect(turnsPerPlayer(rules)).toBe(17);
});

describe.each(Object.values(Ruleset))('%s lucky-number field layout', (ruleset) => {
  const rules = { ...DEFAULT_RULES, ruleset, luckyNumber: true };

  test('the field is appended only while the rule is enabled', () => {
    const off = { ...rules, luckyNumber: false };
    expect(categoriesFor(rules)).toEqual([...categoriesFor(off), Category.LuckyNumber]);
    expect(lowerCategories(rules).at(-1)).toBe(Category.LuckyNumber);
    expect(emptySheet(rules).fields[Category.LuckyNumber]).toBeNull();
    expect(emptySheet(off).fields).not.toHaveProperty(Category.LuckyNumber);
    expect(turnsPerPlayer(rules)).toBe(turnsPerPlayer(off) + 1);
  });
});

/** Every roll of five dice: 6⁵ = 7776. */
const ALL_ROLLS = Array.from({ length: 6 ** 5 }, (_, n) =>
  Array.from({ length: 5 }, (_, die) => 1 + (Math.floor(n / 6 ** die) % 6)),
) as unknown as Dice[];

describe.each(Object.values(Ruleset))('%s field maximums', (ruleset) => {
  const rules = { ...DEFAULT_RULES, ruleset, luckyNumber: true };
  const LUCKY = 12;

  test('each field max is the highest score any roll gets there', () => {
    const fields = sheetFields(rules);
    const highest = new Map<Category, number>(fields.map(({ category }) => [category, 0]));
    for (const dice of ALL_ROLLS) {
      const roll = analyseRoll(dice);
      for (const field of fields) {
        const points = field.points(roll, { luckyNumber: LUCKY });
        highest.set(field.category, Math.max(highest.get(field.category)!, points));
      }
    }

    expect(Object.fromEntries(highest)).toEqual(
      Object.fromEntries(fields.map(({ category, max }) => [category, max])),
    );
  });
});
