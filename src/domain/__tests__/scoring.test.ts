import { Category, Ruleset } from '../enums';
import type { Dice } from '../roll';
import { DEFAULT_RULES, PRESETS, PresetId } from '../rules';
import type { Rules } from '../rules';
import { allowedCategories, score, writeScore } from '../scoring';
import { emptySheet } from '../sheet';
import type { Sheet } from '../sheet';

const CLASSIC = DEFAULT_RULES;
const YATZY = PRESETS[PresetId.Yatzy];

const d = (...values: number[]) => values as unknown as Dice;
const sheetWith = (rules: Rules, fields: Partial<Record<Category, number>>): Sheet => {
  const sheet = emptySheet(rules);

  return { fields: { ...sheet.fields, ...fields }, extraYatzys: 0 };
};

const fresh = (rules: Rules) => emptySheet(rules);

describe('Classic scoring', () => {
  const s = (dice: Dice, category: Category, rules = CLASSIC, sheet = fresh(rules)) =>
    score(dice, category, sheet, rules, null);

  test.each([
    [Category.Ones, d(1, 1, 2, 3, 1), 3],
    [Category.Twos, d(2, 2, 2, 2, 5), 8],
    [Category.Threes, d(1, 2, 4, 5, 6), 0],
    [Category.Fours, d(4, 4, 1, 1, 1), 8],
    [Category.Fives, d(5, 5, 5, 5, 5), 25],
    [Category.Sixes, d(6, 1, 6, 2, 6), 18],
  ])('upper %s', (category, dice, expected) => {
    expect(s(dice, category)).toBe(expected);
  });

  test('three and four of a kind score the sum of all dice', () => {
    expect(s(d(3, 3, 3, 4, 5), Category.ThreeOfAKind)).toBe(18);
    expect(s(d(3, 3, 2, 4, 5), Category.ThreeOfAKind)).toBe(0);
    expect(s(d(6, 6, 6, 6, 1), Category.FourOfAKind)).toBe(25);
    expect(s(d(6, 6, 6, 1, 1), Category.FourOfAKind)).toBe(0);
    expect(s(d(2, 2, 2, 2, 2), Category.FourOfAKind)).toBe(10);
  });

  test('full house', () => {
    expect(s(d(2, 2, 3, 3, 3), Category.FullHouse)).toBe(25);
    expect(s(d(2, 2, 3, 3, 4), Category.FullHouse)).toBe(0);
    expect(s(d(4, 4, 4, 4, 4), Category.FullHouse)).toBe(0);
  });

  test('straights', () => {
    expect(s(d(1, 2, 3, 4, 6), Category.SmallStraight)).toBe(30);
    expect(s(d(3, 4, 5, 6, 6), Category.SmallStraight)).toBe(30);
    expect(s(d(1, 2, 3, 5, 6), Category.SmallStraight)).toBe(0);
    expect(s(d(2, 3, 4, 5, 6), Category.LargeStraight)).toBe(40);
    expect(s(d(1, 2, 3, 4, 5), Category.LargeStraight)).toBe(40);
    expect(s(d(1, 2, 3, 4, 6), Category.LargeStraight)).toBe(0);
  });

  test('yatzy and chance', () => {
    expect(s(d(6, 6, 6, 6, 6), Category.Yatzy)).toBe(50);
    expect(s(d(6, 6, 6, 6, 5), Category.Yatzy)).toBe(0);
    expect(s(d(1, 2, 3, 4, 6), Category.Chance)).toBe(16);
  });

  test('unrolled dice score nothing', () => {
    expect(s(d(0, 0, 0, 0, 0), Category.Chance)).toBe(0);
  });
});

describe('Yatzy scoring', () => {
  const s = (dice: Dice, category: Category) => score(dice, category, fresh(YATZY), YATZY, null);

  test('pairs', () => {
    expect(s(d(3, 3, 5, 5, 1), Category.OnePair)).toBe(10);
    expect(s(d(3, 3, 5, 5, 1), Category.TwoPairs)).toBe(16);
    expect(s(d(3, 3, 3, 3, 1), Category.TwoPairs)).toBe(0);
    expect(s(d(1, 2, 3, 4, 5), Category.OnePair)).toBe(0);
  });

  test('of a kind counts only the matching dice', () => {
    expect(s(d(4, 4, 4, 2, 6), Category.ThreeOfAKind)).toBe(12);
    expect(s(d(4, 4, 4, 4, 6), Category.FourOfAKind)).toBe(16);
  });

  test('straights are fixed: 1–5 and 2–6', () => {
    expect(s(d(1, 2, 3, 4, 5), Category.SmallStraight)).toBe(15);
    expect(s(d(2, 3, 4, 5, 6), Category.SmallStraight)).toBe(0);
    expect(s(d(2, 3, 4, 5, 6), Category.LargeStraight)).toBe(20);
  });

  test('four in a row is no straight in Yatzy (it is in Classic)', () => {
    expect(s(d(3, 4, 5, 6, 6), Category.SmallStraight)).toBe(0);
    expect(s(d(3, 4, 5, 6, 6), Category.LargeStraight)).toBe(0);
    expect(score(d(3, 4, 5, 6, 6), Category.SmallStraight, fresh(CLASSIC), CLASSIC, null)).toBe(30);
  });

  test('full house needs two different faces', () => {
    expect(s(d(4, 4, 4, 4, 4), Category.FullHouse)).toBe(0);
    expect(s(d(4, 4, 4, 4, 4), Category.TwoPairs)).toBe(0);
    expect(s(d(3, 3, 5, 5, 5), Category.TwoPairs)).toBe(16);
  });

  test('full house is the sum; yatzy is 50', () => {
    expect(s(d(2, 2, 6, 6, 6), Category.FullHouse)).toBe(22);
    expect(s(d(5, 5, 5, 5, 5), Category.Yatzy)).toBe(50);
  });
});

describe('Classic XL scoring', () => {
  const rules = PRESETS[PresetId.ClassicXl];

  test.each([
    [Category.TwoPairs, d(2, 2, 5, 5, 6), 14],
    [Category.TwoPairs, d(2, 2, 5, 5, 5), 14],
    [Category.TwoPairs, d(3, 3, 5, 5, 1), 16],
    [Category.TwoPairs, d(6, 6, 5, 5, 1), 22],
    [Category.TwoPairs, d(5, 5, 5, 5, 5), 0],
    [Category.TwoPairs, d(5, 5, 5, 5, 2), 0],
    [Category.TwoPairs, d(4, 4, 4, 4, 4), 0],
    [Category.TwoPairs, d(1, 2, 3, 4, 5), 0],
    [Category.Even, d(2, 4, 6, 2, 4), 18],
    [Category.Even, d(6, 6, 6, 6, 6), 30],
    [Category.Even, d(2, 4, 6, 2, 1), 14],
    [Category.Even, d(5, 1, 6, 6, 2), 14],
    [Category.Even, d(1, 3, 5, 1, 2), 2],
    [Category.Even, d(1, 3, 5, 1, 3), 0],
    [Category.Odd, d(1, 3, 5, 1, 3), 13],
    [Category.Odd, d(5, 5, 5, 5, 5), 25],
    [Category.Odd, d(1, 3, 5, 1, 2), 10],
    [Category.Odd, d(5, 1, 6, 6, 2), 6],
    [Category.Odd, d(2, 4, 6, 2, 1), 1],
    [Category.Odd, d(2, 4, 6, 2, 4), 0],
    [Category.Mini, d(1, 1, 1, 1, 1), 30],
    [Category.Mini, d(1, 1, 1, 1, 5), 30],
    [Category.Mini, d(1, 1, 1, 1, 6), 30],
    [Category.Mini, d(2, 2, 2, 2, 2), 30],
    [Category.Mini, d(2, 2, 2, 2, 3), 0],
    [Category.Mini, d(5, 1, 6, 6, 2), 0],
    [Category.Mini, d(6, 6, 6, 6, 6), 0],
    [Category.Mini, d(0, 0, 0, 0, 0), 0],
  ])('%s with %j scores %i', (category, dice, points) => {
    expect(score(dice, category, fresh(rules), rules, null)).toBe(points);
  });

  test.each([Category.Even, Category.Odd, Category.Mini])(
    '%s scores nothing before all dice are rolled',
    (category) => {
      for (const dice of [d(0, 0, 0, 0, 0), d(1, 2, 0, 0, 0)]) {
        expect(score(dice, category, fresh(rules), rules, null)).toBe(0);
      }
    },
  );
});

describe.each(Object.values(Ruleset))('%s lucky-number field', (ruleset) => {
  const rules = { ...DEFAULT_RULES, ruleset, luckyNumber: true };

  test.each([
    [8, d(1, 1, 1, 1, 4)],
    [17, d(1, 2, 3, 5, 6)],
    [26, d(6, 6, 6, 6, 2)],
  ])('only an exact sum of %i scores 40', (target, dice) => {
    const sheet = fresh(rules);
    expect(score(dice, Category.LuckyNumber, sheet, rules, target)).toBe(40);
    expect(score(dice, Category.LuckyNumber, sheet, rules, target - 1)).toBe(0);
    expect(score(dice, Category.LuckyNumber, sheet, rules, target + 1)).toBe(0);
    expect(score(dice, Category.LuckyNumber, sheet, rules, null)).toBe(0);
    expect(
      writeScore(sheet, Category.LuckyNumber, dice, rules, target).fields[Category.LuckyNumber],
    ).toBe(40);
  });
});

test('writing into a taken field throws', () => {
  const sheet = sheetWith(CLASSIC, { [Category.Chance]: 20 });
  expect(() => writeScore(sheet, Category.Chance, d(1, 1, 1, 1, 1), CLASSIC, null)).toThrow();
});

test('top-to-bottom allows only the next open field', () => {
  const rules = PRESETS[PresetId.TopToBottom];
  const sheet = sheetWith(rules, { [Category.Ones]: 2 });
  expect(allowedCategories(d(6, 6, 6, 6, 6), sheet, rules)).toEqual([Category.Twos]);
});
