import { Category, FieldOrder } from '../enums';
import { lowerFields } from '../fields';
import type { Dice } from '../roll';
import { PRESET_ORDER, PRESETS, PresetId, YATZY_BONUS } from '../rules';
import type { Rules } from '../rules';
import { allowedCategories, score, writeScore } from '../scoring';
import { emptySheet, lowerCategories, openCategories, UPPER_CATEGORIES } from '../sheet';
import type { Sheet } from '../sheet';
import { playerTotal, sheetTotal, yatzyCount } from '../totals';

const d = (...values: number[]) => values as unknown as Dice;
const FOURS = d(4, 4, 4, 4, 4);
const LUCKY = 20;

const sheetWith = (rules: Rules, fields: Partial<Record<Category, number | null>>): Sheet => {
  const sheet = emptySheet(rules);

  return { fields: { ...sheet.fields, ...fields }, extraYatzys: 0 };
};

/** A sheet whose Yatzy field holds 50: the joker rule is on. */
const yatzyDone = (rules: Rules, fields: Partial<Record<Category, number | null>> = {}) =>
  sheetWith(rules, { [Category.Yatzy]: 50, ...fields });

/** Every lower field except Yatzy, which holds the joker's 50. */
const jokerLowerFields = (rules: Rules) =>
  lowerCategories(rules).filter((category) => category !== Category.Yatzy);

/** Fours and every other joker field struck: only the other upper fields stay open. */
const onlyOtherUpperOpen = (rules: Rules): Partial<Record<Category, number>> => ({
  [Category.Fours]: 0,
  ...Object.fromEntries(jokerLowerFields(rules).map((category) => [category, 0])),
});

describe.each(PRESET_ORDER)('%s: further Yatzy', (preset) => {
  const rules = PRESETS[preset];

  test('earns one extra Yatzy bonus, whichever field it goes into', () => {
    const sheet = yatzyDone(rules);
    const target = allowedCategories(FOURS, sheet, rules)[0];
    const after = writeScore(sheet, target, FOURS, rules, LUCKY);

    expect(after.extraYatzys).toBe(1);
    expect(yatzyCount([after])).toBe(2);
    expect(sheetTotal(after, rules) - sheetTotal(sheet, rules)).toBe(
      score(FOURS, target, sheet, rules, LUCKY) + YATZY_BONUS,
    );
  });

  test('a crossed-out Yatzy field means no joker: normal points, no bonus', () => {
    const sheet = sheetWith(rules, { [Category.Yatzy]: 0 });

    expect(score(FOURS, Category.Chance, sheet, rules, LUCKY)).toBe(20);
    expect(allowedCategories(FOURS, sheet, rules)).toEqual(
      rules.fieldOrder === FieldOrder.TopToBottom
        ? [openCategories(sheet, rules)[0]]
        : openCategories(sheet, rules),
    );
    expect(writeScore(sheet, Category.Fours, FOURS, rules, LUCKY).extraYatzys).toBe(0);
  });

  test('an open Yatzy field means no joker either', () => {
    const sheet = sheetWith(rules, {});

    expect(score(FOURS, Category.Chance, sheet, rules, LUCKY)).toBe(20);
    expect(writeScore(sheet, Category.Fours, FOURS, rules, LUCKY).extraYatzys).toBe(0);
  });
});

describe.each(PRESET_ORDER.filter((id) => PRESETS[id].fieldOrder === FieldOrder.Free))(
  '%s: joker in free field order',
  (preset) => {
    const rules = PRESETS[preset];

    test('the matching upper field and every open lower field are allowed', () => {
      const sheet = yatzyDone(rules);

      expect(allowedCategories(FOURS, sheet, rules)).toEqual([
        Category.Fours,
        ...jokerLowerFields(rules),
      ]);
    });

    test('the matching upper field scores 50, a lower field its maximum', () => {
      const sheet = yatzyDone(rules);

      expect(score(FOURS, Category.Fours, sheet, rules, LUCKY)).toBe(50);
      for (const field of lowerFields(rules).filter((f) => f.category !== Category.Yatzy)) {
        expect(score(FOURS, field.category, sheet, rules, LUCKY)).toBe(field.max);
      }
    });

    test('once the matching upper field is taken, only the lower fields are allowed', () => {
      const sheet = yatzyDone(rules, { [Category.Fours]: 12 });

      expect(allowedCategories(FOURS, sheet, rules)).toEqual(jokerLowerFields(rules));
    });

    test('an open upper field other than the matching one is not allowed', () => {
      const sheet = yatzyDone(rules, { [Category.Fours]: 12 });

      expect(allowedCategories(FOURS, sheet, rules)).not.toContain(Category.Ones);
    });

    test('with the matching and lower fields full, another open field is allowed and scores 0', () => {
      const sheet = yatzyDone(rules, onlyOtherUpperOpen(rules));
      const allowed = allowedCategories(FOURS, sheet, rules);

      expect(allowed).toEqual(UPPER_CATEGORIES.filter((category) => category !== Category.Fours));
      expect(score(FOURS, Category.Ones, sheet, rules, LUCKY)).toBe(0);
      expect(writeScore(sheet, Category.Ones, FOURS, rules, LUCKY).extraYatzys).toBe(1);
    });
  },
);

describe('top to bottom: the next open field is the only one, and it scores the joker points', () => {
  const rules = PRESETS[PresetId.TopToBottom];

  test('the next open field, even when it is a lower field', () => {
    const upperDone = Object.fromEntries(UPPER_CATEGORIES.map((category) => [category, 0]));
    const sheet = yatzyDone(rules, upperDone);
    const next = jokerLowerFields(rules)[0];

    expect(allowedCategories(FOURS, sheet, rules)).toEqual([next]);
    const field = lowerFields(rules).find((f) => f.category === next)!;
    expect(score(FOURS, next, sheet, rules, LUCKY)).toBe(field.max);
  });

  test('an open upper field that is not the matching one scores 0', () => {
    const sheet = yatzyDone(rules);

    expect(allowedCategories(FOURS, sheet, rules)).toEqual([Category.Ones]);
    expect(score(FOURS, Category.Ones, sheet, rules, LUCKY)).toBe(0);
  });
});

describe('joker points per ruleset', () => {
  test.each([
    [PresetId.Classic, Category.ThreeOfAKind, 30],
    [PresetId.Classic, Category.FullHouse, 25],
    [PresetId.Classic, Category.SmallStraight, 30],
    [PresetId.Classic, Category.LargeStraight, 40],
    [PresetId.Classic, Category.Chance, 30],
    [PresetId.ClassicXl, Category.TwoPairs, 22],
    [PresetId.ClassicXl, Category.Even, 30],
    [PresetId.ClassicXl, Category.Odd, 25],
    [PresetId.ClassicXl, Category.Mini, 30],
    [PresetId.Yatzy, Category.OnePair, 12],
    [PresetId.Yatzy, Category.FourOfAKind, 24],
    [PresetId.Yatzy, Category.FullHouse, 28],
    [PresetId.Yatzy, Category.SmallStraight, 15],
    [PresetId.Yatzy, Category.LargeStraight, 20],
    [PresetId.LuckyNumber, Category.LuckyNumber, 40],
  ])('%s: %s scores %i with a joker', (preset, category, points) => {
    const rules = PRESETS[preset];
    expect(score(FOURS, category, yatzyDone(rules), rules, LUCKY)).toBe(points);
  });
});

test('Classic XL: with Fours taken, a joker fills Two pairs with its maximum', () => {
  const rules = PRESETS[PresetId.ClassicXl];
  const sheet = yatzyDone(rules, { [Category.Fours]: 12 });

  expect(writeScore(sheet, Category.TwoPairs, FOURS, rules, LUCKY).fields[Category.TwoPairs]).toBe(
    22,
  );
});

test('three sheets: the joker is decided per sheet, and the factor applies in the total', () => {
  const rules = PRESETS[PresetId.Triple];
  const withBonus = yatzyDone(rules);
  const without = sheetWith(rules, { [Category.Yatzy]: 0 });

  expect(writeScore(withBonus, Category.Fours, FOURS, rules, LUCKY).extraYatzys).toBe(1);
  expect(writeScore(without, Category.Fours, FOURS, rules, LUCKY).extraYatzys).toBe(0);
  expect(playerTotal([withBonus, without], rules)).toBe(
    sheetTotal(withBonus, rules) + 2 * sheetTotal(without, rules),
  );
});
