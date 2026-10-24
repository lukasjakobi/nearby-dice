import { Category } from '../enums';
import type { Dice } from '../roll';
import { DEFAULT_RULES, PRESETS, PresetId, YATZY_BONUS } from '../rules';
import type { Rules } from '../rules';
import { writeScore } from '../scoring';
import { emptySheet } from '../sheet';
import type { Sheet } from '../sheet';
import { playerTotal, sheetTotal, upperBonus } from '../totals';

const CLASSIC = DEFAULT_RULES;
const YATZY = PRESETS[PresetId.Yatzy];

const d = (...values: number[]) => values as unknown as Dice;
const sheetWith = (rules: Rules, fields: Partial<Record<Category, number>>): Sheet => {
  const sheet = emptySheet(rules);

  return { fields: { ...sheet.fields, ...fields }, extraYatzys: 0 };
};

test('Yatzy upper bonus is 50', () => {
  const sheet = sheetWith(YATZY, {
    [Category.Sixes]: 30,
    [Category.Fives]: 25,
    [Category.Fours]: 8,
  });
  expect(upperBonus(sheet, YATZY)).toBe(50);
});

test('upper bonus +35 at 63', () => {
  const at63 = sheetWith(CLASSIC, {
    [Category.Ones]: 3,
    [Category.Twos]: 6,
    [Category.Threes]: 9,
    [Category.Fours]: 12,
    [Category.Fives]: 15,
    [Category.Sixes]: 18,
  });
  expect(upperBonus(at63, CLASSIC)).toBe(35);
  expect(sheetTotal(at63, CLASSIC)).toBe(63 + 35);
  expect(upperBonus(at63, { ...CLASSIC, upperBonus: false })).toBe(0);
});

test('Classic XL keeps the 35-point upper bonus and the extra Yatzy bonus', () => {
  const rules = PRESETS[PresetId.ClassicXl];
  const sheet = sheetWith(rules, {
    [Category.Sixes]: 30,
    [Category.Fives]: 25,
    [Category.Fours]: 8,
    [Category.Yatzy]: 50,
  });
  const after = writeScore(sheet, Category.Even, d(6, 6, 6, 6, 6), rules, null);
  expect(upperBonus(after, rules)).toBe(35);
  expect(after.extraYatzys).toBe(1);
  expect(sheetTotal(after, rules)).toBe(63 + 35 + 50 + 30 + YATZY_BONUS);
});

test('three sheets count ×1, ×2, ×3', () => {
  const rules = PRESETS[PresetId.Triple];
  const ten = sheetWith(rules, { [Category.Chance]: 10 });
  expect(playerTotal([ten, ten, ten], rules)).toBe(60);
});
