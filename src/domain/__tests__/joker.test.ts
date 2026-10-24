import { Category, Joker } from '../enums';
import type { Dice } from '../roll';
import { DEFAULT_RULES, PRESETS, PresetId } from '../rules';
import type { Rules } from '../rules';
import { allowedCategories, score, writeScore } from '../scoring';
import { emptySheet, lowerCategories } from '../sheet';
import type { Sheet } from '../sheet';
import { sheetTotal, yatzyCount } from '../totals';

const CLASSIC = DEFAULT_RULES;

const d = (...values: number[]) => values as unknown as Dice;
const sheetWith = (rules: Rules, fields: Partial<Record<Category, number>>): Sheet => {
  const sheet = emptySheet(rules);

  return { fields: { ...sheet.fields, ...fields }, extraYatzys: 0 };
};

describe.each([PresetId.Classic, PresetId.ClassicXl])('%s joker', (preset) => {
  const classic = PRESETS[preset];
  const official = { ...classic, joker: Joker.Official };
  const yatzyUsed = sheetWith(official, { [Category.Yatzy]: 50 });

  test('official: matching upper field first', () => {
    expect(allowedCategories(d(4, 4, 4, 4, 4), yatzyUsed, official)).toEqual([Category.Fours]);
  });

  test('official: once the upper field is taken, the lower block counts at full value', () => {
    const sheet = sheetWith(official, { [Category.Yatzy]: 50, [Category.Fours]: 12 });
    const allowed = allowedCategories(d(4, 4, 4, 4, 4), sheet, official);
    expect(allowed).not.toContain(Category.Ones);
    expect(allowed).toContain(Category.LargeStraight);
    expect(score(d(4, 4, 4, 4, 4), Category.FullHouse, sheet, official, null)).toBe(25);
    expect(score(d(4, 4, 4, 4, 4), Category.SmallStraight, sheet, official, null)).toBe(30);
    expect(score(d(4, 4, 4, 4, 4), Category.LargeStraight, sheet, official, null)).toBe(40);
  });

  test('official: falls back to any open upper field when the lower block is full', () => {
    const lowerFull = Object.fromEntries(lowerCategories(official).map((c) => [c, 0]));
    const sheet = sheetWith(official, {
      ...lowerFull,
      [Category.Yatzy]: 0,
      [Category.Fours]: 12,
    });
    expect(allowedCategories(d(4, 4, 4, 4, 4), sheet, official)).toEqual([
      Category.Ones,
      Category.Twos,
      Category.Threes,
      Category.Fives,
      Category.Sixes,
    ]);
  });

  test('off: a further yatzy is a normal roll', () => {
    const off = { ...classic, joker: Joker.Off };
    const sheet = sheetWith(off, { [Category.Yatzy]: 50, [Category.Fours]: 12 });
    expect(score(d(4, 4, 4, 4, 4), Category.LargeStraight, sheet, off, null)).toBe(0);
  });
});

test("a joker does not bypass the new fields' scoring conditions", () => {
  const rules = PRESETS[PresetId.ClassicXl];
  const sheet = sheetWith(rules, { [Category.Yatzy]: 50, [Category.Sixes]: 30 });
  const dice = d(6, 6, 6, 6, 6);
  expect(allowedCategories(dice, sheet, rules)).toEqual(
    lowerCategories(rules).filter((category) => category !== Category.Yatzy),
  );
  for (const category of [Category.TwoPairs, Category.Odd, Category.Mini]) {
    expect(score(dice, category, sheet, rules, null)).toBe(0);
  }
});

test('extra yatzy bonus once the yatzy field holds 50', () => {
  const sheet = sheetWith(CLASSIC, { [Category.Yatzy]: 50 });
  const after = writeScore(sheet, Category.Fives, d(5, 5, 5, 5, 5), CLASSIC, null);
  expect(after.extraYatzys).toBe(1);
  expect(sheetTotal(after, CLASSIC)).toBe(50 + 25 + 50);
  expect(yatzyCount([after])).toBe(2);
});

test('no extra bonus when the yatzy field was struck', () => {
  const sheet = sheetWith(CLASSIC, { [Category.Yatzy]: 0 });
  expect(writeScore(sheet, Category.Fives, d(5, 5, 5, 5, 5), CLASSIC, null).extraYatzys).toBe(0);
});
