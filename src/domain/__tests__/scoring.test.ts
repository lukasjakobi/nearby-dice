import { Category, Joker, Ruleset } from '../enums';
import { DEFAULT_RULES, PRESETS, PresetId } from '../rules';
import type { Rules } from '../rules';
import {
  allowedCategories,
  yatzyCount,
  playerTotal,
  score,
  sheetTotal,
  upperBonus,
  writeScore,
} from '../scoring';
import type { Dice } from '../scoring';
import {
  UPPER_CATEGORIES,
  categoriesFor,
  emptySheet,
  lowerCategories,
  turnsPerPlayer,
} from '../sheet';
import type { Sheet } from '../sheet';

const CLASSIC = DEFAULT_RULES;
const YATZY = PRESETS[PresetId.Yatzy];

const d = (...values: number[]) => values as unknown as Dice;
const sheetWith = (rules: Rules, fields: Partial<Record<Category, number>>, extra = 0): Sheet => {
  const sheet = emptySheet(rules);

  return { fields: { ...sheet.fields, ...fields }, extraYatzys: extra };
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
    expect(
      s(d(4, 4, 4, 4, 4), Category.FullHouse, { ...CLASSIC, fullHouseFromFiveOfAKind: true }),
    ).toBe(25);
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

  test('upper bonus is 50', () => {
    const sheet = sheetWith(YATZY, {
      [Category.Sixes]: 30,
      [Category.Fives]: 25,
      [Category.Fours]: 8,
    });
    expect(upperBonus(sheet, YATZY)).toBe(50);
  });
});

describe('Classic XL scoring', () => {
  const rules = PRESETS[PresetId.ClassicXl];

  test.each([
    [Category.TwoPairs, d(2, 2, 5, 5, 6), 20],
    [Category.TwoPairs, d(2, 2, 5, 5, 5), 19],
    [Category.TwoPairs, d(5, 5, 5, 5, 5), 0],
    [Category.TwoPairs, d(5, 5, 5, 5, 2), 0],
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

  test('starts the lower block with the XL fields and gives each player 17 turns', () => {
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

  test('keeps the 35-point upper bonus and the extra Yatzy bonus', () => {
    const sheet = sheetWith(rules, {
      [Category.Sixes]: 30,
      [Category.Fives]: 25,
      [Category.Fours]: 8,
      [Category.Yatzy]: 50,
    });
    const after = writeScore(sheet, Category.Even, d(6, 6, 6, 6, 6), rules, null);
    expect(upperBonus(after, rules)).toBe(35);
    expect(after.extraYatzys).toBe(1);
    expect(sheetTotal(after, rules)).toBe(63 + 35 + 50 + 30 + rules.yatzyBonus);
  });

  test("a joker does not bypass the new fields' scoring conditions", () => {
    const sheet = sheetWith(rules, { [Category.Yatzy]: 50, [Category.Sixes]: 30 });
    const dice = d(6, 6, 6, 6, 6);
    expect(allowedCategories(dice, sheet, rules)).toEqual(
      lowerCategories(rules).filter((category) => category !== Category.Yatzy),
    );
    for (const category of [Category.TwoPairs, Category.Odd, Category.Mini]) {
      expect(score(dice, category, sheet, rules, null)).toBe(0);
    }
  });
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

  test('the field is appended only while the rule is enabled', () => {
    const off = { ...rules, luckyNumber: false };
    expect(categoriesFor(rules)).toEqual([...categoriesFor(off), Category.LuckyNumber]);
    expect(lowerCategories(rules).at(-1)).toBe(Category.LuckyNumber);
    expect(fresh(rules).fields[Category.LuckyNumber]).toBeNull();
    expect(fresh(off).fields).not.toHaveProperty(Category.LuckyNumber);
    expect(turnsPerPlayer(rules)).toBe(turnsPerPlayer(off) + 1);
  });
});

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

  test('free: any open field; joker value only once the upper field is taken', () => {
    const free = { ...classic, joker: Joker.Free };
    expect(allowedCategories(d(4, 4, 4, 4, 4), yatzyUsed, free)).toHaveLength(
      categoriesFor(free).length - 1,
    );
    expect(score(d(4, 4, 4, 4, 4), Category.LargeStraight, yatzyUsed, free, null)).toBe(0);
  });

  test('off: a further yatzy is a normal roll', () => {
    const off = { ...classic, joker: Joker.Off };
    const sheet = sheetWith(off, { [Category.Yatzy]: 50, [Category.Fours]: 12 });
    expect(score(d(4, 4, 4, 4, 4), Category.LargeStraight, sheet, off, null)).toBe(0);
  });
});

describe('totals and bonuses', () => {
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

  test('three sheets count ×1, ×2, ×3', () => {
    const rules = PRESETS[PresetId.Triple];
    const ten = sheetWith(rules, { [Category.Chance]: 10 });
    expect(playerTotal([ten, ten, ten], rules)).toBe(60);
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

  test('the yatzy preset has 15 fields', () => {
    expect(Object.keys(emptySheet(YATZY).fields)).toHaveLength(15);
    expect(Object.keys(emptySheet(CLASSIC).fields)).toHaveLength(13);
  });
});
