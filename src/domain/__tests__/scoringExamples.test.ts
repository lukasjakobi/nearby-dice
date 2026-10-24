/*
 * The examples below mirror docs/scoring.md: every example roll with its points, the joker
 * examples and the upper bonus example. When that page changes, change this file too, so the
 * documented points stay the points the code scores.
 */
import { Category } from '../enums';
import { allowedCategories, score, writeScore } from '../scoring';
import { PRESETS, PresetId } from '../rules';
import type { Rules } from '../rules';
import type { Dice } from '../roll';
import { categoriesFor, emptySheet, UPPER_CATEGORIES } from '../sheet';
import type { Fields, Sheet } from '../sheet';
import { sheetTotal, upperBonus } from '../totals';

const CLASSIC = PRESETS[PresetId.Classic];
const CLASSIC_XL = PRESETS[PresetId.ClassicXl];
const YATZY = PRESETS[PresetId.Yatzy];
const LUCKY = PRESETS[PresetId.LuckyNumber];

const d = (values: number[]) => values as unknown as Dice;

type Example = { category: Category; dice: number[]; points: number };

const UPPER: Example[] = [
  { category: Category.Ones, dice: [1, 1, 3, 5, 6], points: 2 },
  { category: Category.Twos, dice: [2, 2, 2, 5, 6], points: 6 },
  { category: Category.Threes, dice: [3, 3, 1, 6, 6], points: 6 },
  { category: Category.Fours, dice: [4, 4, 2, 4, 1], points: 12 },
  { category: Category.Fives, dice: [5, 5, 2, 6, 1], points: 10 },
  { category: Category.Sixes, dice: [6, 6, 1, 2, 4], points: 12 },
];

const CLASSIC_LOWER: Example[] = [
  { category: Category.ThreeOfAKind, dice: [4, 4, 4, 2, 6], points: 20 },
  { category: Category.FourOfAKind, dice: [3, 3, 3, 3, 6], points: 18 },
  { category: Category.FullHouse, dice: [2, 2, 5, 5, 5], points: 25 },
  { category: Category.SmallStraight, dice: [1, 3, 4, 5, 6], points: 30 },
  { category: Category.LargeStraight, dice: [2, 3, 4, 5, 6], points: 40 },
  { category: Category.Yatzy, dice: [6, 6, 6, 6, 6], points: 50 },
  { category: Category.Chance, dice: [1, 2, 3, 4, 6], points: 16 },
];

const XL_EXTRA: Example[] = [
  { category: Category.TwoPairs, dice: [6, 6, 5, 5, 2], points: 22 },
  { category: Category.Even, dice: [5, 1, 6, 6, 2], points: 14 },
  { category: Category.Odd, dice: [5, 1, 6, 6, 2], points: 6 },
  { category: Category.Mini, dice: [1, 2, 1, 3, 2], points: 30 },
];

const YATZY_LOWER: Example[] = [
  { category: Category.OnePair, dice: [4, 4, 2, 5, 1], points: 8 },
  { category: Category.TwoPairs, dice: [6, 6, 5, 5, 2], points: 22 },
  { category: Category.ThreeOfAKind, dice: [5, 5, 5, 2, 6], points: 15 },
  { category: Category.FourOfAKind, dice: [3, 3, 3, 3, 6], points: 12 },
  { category: Category.SmallStraight, dice: [1, 2, 3, 4, 5], points: 15 },
  { category: Category.LargeStraight, dice: [2, 3, 4, 5, 6], points: 20 },
  { category: Category.FullHouse, dice: [6, 6, 6, 2, 2], points: 22 },
  { category: Category.Chance, dice: [1, 2, 3, 4, 6], points: 16 },
  { category: Category.Yatzy, dice: [4, 4, 4, 4, 4], points: 50 },
];

const RULESETS: [string, Rules, Example[]][] = [
  ['Classic', CLASSIC, [...UPPER, ...CLASSIC_LOWER]],
  ['Classic XL', CLASSIC_XL, [...UPPER, ...XL_EXTRA, ...CLASSIC_LOWER]],
  ['Yatzy', YATZY, [...UPPER, ...YATZY_LOWER]],
];

describe.each(RULESETS)('%s examples in docs/scoring.md', (_name, rules, examples) => {
  test.each(examples)('$category scores $points for $dice', ({ category, dice, points }) => {
    expect(score(d(dice), category, emptySheet(rules), rules, null)).toBe(points);
  });
});

test('Glückszahl scores 40 when the dice add up to the round target', () => {
  const dice = d([3, 4, 4, 2, 4]);

  expect(score(dice, Category.LuckyNumber, emptySheet(LUCKY), LUCKY, 17)).toBe(40);
  expect(score(dice, Category.LuckyNumber, emptySheet(LUCKY), LUCKY, 18)).toBe(0);
});

/** A sheet whose Yatzy field holds 50, unless `fields` says otherwise. */
const yatzySheet = (rules: Rules, fields: Partial<Fields> = {}): Sheet => {
  const sheet = emptySheet(rules);

  return { fields: { ...sheet.fields, [Category.Yatzy]: 50, ...fields }, extraYatzys: 0 };
};

describe('further Yatzy examples in docs/scoring.md (Classic, four 4s)', () => {
  const FOURS = d([4, 4, 4, 4, 4]);

  test('the matching upper field scores 50 and earns the bonus', () => {
    const sheet = yatzySheet(CLASSIC);

    expect(score(FOURS, Category.Fours, sheet, CLASSIC, null)).toBe(50);
    expect(writeScore(sheet, Category.Fours, FOURS, CLASSIC, null).extraYatzys).toBe(1);
  });

  test('a lower field scores its maximum, not the dice', () => {
    const sheet = yatzySheet(CLASSIC);

    expect(score(FOURS, Category.FullHouse, sheet, CLASSIC, null)).toBe(25);
    expect(score(FOURS, Category.Chance, sheet, CLASSIC, null)).toBe(30);
    expect(allowedCategories(FOURS, sheet, CLASSIC)).toEqual(
      expect.arrayContaining([Category.Fours, Category.FullHouse, Category.Chance]),
    );
  });

  test('with Fours filled, the open lower fields take the joker', () => {
    const sheet = yatzySheet(CLASSIC, { [Category.Fours]: 12 });

    expect(allowedCategories(FOURS, sheet, CLASSIC)).not.toContain(Category.Fours);
    expect(score(FOURS, Category.Chance, sheet, CLASSIC, null)).toBe(30);
  });

  test('with only Ones open, the joker scores normally there and still earns the bonus', () => {
    const others = Object.fromEntries(
      categoriesFor(CLASSIC)
        .filter((category) => category !== Category.Ones && category !== Category.Yatzy)
        .map((category) => [category, 0]),
    );
    const sheet = yatzySheet(CLASSIC, others);

    expect(allowedCategories(FOURS, sheet, CLASSIC)).toEqual([Category.Ones]);
    expect(score(FOURS, Category.Ones, sheet, CLASSIC, null)).toBe(0);
    expect(writeScore(sheet, Category.Ones, FOURS, CLASSIC, null).extraYatzys).toBe(1);
  });

  test('with the Yatzy field struck there is no joker: Chance is the plain sum', () => {
    const sheet = yatzySheet(CLASSIC, { [Category.Yatzy]: 0 });

    expect(score(FOURS, Category.Chance, sheet, CLASSIC, null)).toBe(20);
    expect(writeScore(sheet, Category.Chance, FOURS, CLASSIC, null).extraYatzys).toBe(0);
  });
});

describe('upper bonus examples in docs/scoring.md', () => {
  /** Every upper field holds `count` dice of its face. */
  const threeOfEachFace = (rules: Rules, count: number): Sheet => {
    const sheet = emptySheet(rules);
    const fields = Object.fromEntries(
      UPPER_CATEGORIES.map((category, i) => [category, count * (i + 1)]),
    );

    return { fields: { ...sheet.fields, ...fields }, extraYatzys: 0 };
  };

  test('three of each face reaches 63 and earns +35 in Classic', () => {
    expect(upperBonus(threeOfEachFace(CLASSIC, 3), CLASSIC)).toBe(35);
  });

  test('three of each face earns +50 in Yatzy', () => {
    expect(upperBonus(threeOfEachFace(YATZY, 3), YATZY)).toBe(50);
  });

  test('two of each face (42) earns nothing', () => {
    expect(upperBonus(threeOfEachFace(CLASSIC, 2), CLASSIC)).toBe(0);
  });

  test('the sheet total adds the bonus to the fields', () => {
    expect(sheetTotal(threeOfEachFace(CLASSIC, 3), CLASSIC)).toBe(63 + 35);
  });
});
