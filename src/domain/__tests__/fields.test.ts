import { Category, Ruleset } from '../enums';
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
