import { Category, FieldOrder, Joker, Ruleset } from './enums';
import {
  LUCKY_NUMBER_POINTS,
  SHEET_FACTORS,
  UPPER_BONUS_THRESHOLD,
  isClassicFamily,
  upperBonusPoints,
} from './rules';
import type { Rules } from './rules';
import {
  UPPER_CATEGORIES,
  categoriesFor,
  faceOf,
  isOpen,
  lowerCategories,
  openCategories,
  upperCategoryFor,
} from './sheet';
import type { Sheet } from './sheet';

/** Five dice, values 1–6. `0` = not rolled yet. */
export type Dice = readonly [number, number, number, number, number];

/** Everything a scorer needs, computed once per roll. */
type Roll = {
  /** counts[f] = number of dice showing face f (index 0 unused). */
  counts: readonly number[];
  sum: number;
  /** Highest number of equal dice. */
  most: number;
  /** A joker Yatzy scores Full House and the straights at full value. */
  joker: boolean;
  /** This round's lucky number, or `null` without the lucky-number rule. */
  luckyNumber: number | null;
  rules: Rules;
};

type Scorer = (roll: Roll) => number;

const highestOfAKind = (counts: readonly number[], n: number): number => {
  for (let face = 6; face >= 1; face--) if (counts[face] >= n) return face;

  return 0;
};

const hasRun = (counts: readonly number[], from: number, length: number): boolean => {
  for (let face = from; face < from + length; face++) if (counts[face] === 0) return false;

  return true;
};

const isFullHouse = (counts: readonly number[]) => counts.includes(3) && counts.includes(2);

/** Faces shown by at least two dice, highest first. */
const pairFaces = (counts: readonly number[]) =>
  [6, 5, 4, 3, 2, 1].filter((face) => counts[face] >= 2);

const sumFaces = (counts: readonly number[], faces: readonly number[]) =>
  faces.reduce((sum, face) => sum + counts[face] * face, 0);

const upper =
  (face: number): Scorer =>
  ({ counts }) =>
    counts[face] * face;

const UPPER_SCORERS = Object.fromEntries(
  UPPER_CATEGORIES.map((category) => [category, upper(faceOf(category)!)]),
) as Partial<Record<Category, Scorer>>;

/** Available in every ruleset once the lucky-number rule adds the field. */
const LUCKY_NUMBER_SCORER: Partial<Record<Category, Scorer>> = {
  [Category.LuckyNumber]: ({ sum, luckyNumber }) => (sum === luckyNumber ? LUCKY_NUMBER_POINTS : 0),
};

const CLASSIC_SCORERS: Partial<Record<Category, Scorer>> = {
  ...UPPER_SCORERS,
  ...LUCKY_NUMBER_SCORER,
  [Category.ThreeOfAKind]: ({ most, sum }) => (most >= 3 ? sum : 0),
  [Category.FourOfAKind]: ({ most, sum }) => (most >= 4 ? sum : 0),
  [Category.FullHouse]: ({ counts, most, joker, rules }) =>
    isFullHouse(counts) || joker || (rules.fullHouseFromFiveOfAKind && most === 5) ? 25 : 0,
  [Category.SmallStraight]: ({ counts, joker }) =>
    joker || hasRun(counts, 1, 4) || hasRun(counts, 2, 4) || hasRun(counts, 3, 4) ? 30 : 0,
  [Category.LargeStraight]: ({ counts, joker }) =>
    joker || hasRun(counts, 1, 5) || hasRun(counts, 2, 5) ? 40 : 0,
  [Category.Yatzy]: ({ most }) => (most === 5 ? 50 : 0),
  [Category.Chance]: ({ sum }) => sum,
};

const CLASSIC_XL_SCORERS: Partial<Record<Category, Scorer>> = {
  ...CLASSIC_SCORERS,
  [Category.TwoPairs]: ({ counts, sum }) => (pairFaces(counts).length >= 2 ? sum : 0),
  [Category.Even]: ({ counts }) => sumFaces(counts, [2, 4, 6]),
  [Category.Odd]: ({ counts }) => sumFaces(counts, [1, 3, 5]),
  [Category.Mini]: ({ sum }) => (sum <= 10 ? 30 : 0),
};

const YATZY_SCORERS: Partial<Record<Category, Scorer>> = {
  ...UPPER_SCORERS,
  ...LUCKY_NUMBER_SCORER,
  [Category.OnePair]: ({ counts }) => highestOfAKind(counts, 2) * 2,
  [Category.TwoPairs]: ({ counts }) => {
    const pairs = pairFaces(counts);

    return pairs.length >= 2 ? (pairs[0] + pairs[1]) * 2 : 0;
  },
  [Category.ThreeOfAKind]: ({ counts }) => highestOfAKind(counts, 3) * 3,
  [Category.FourOfAKind]: ({ counts }) => highestOfAKind(counts, 4) * 4,
  [Category.SmallStraight]: ({ counts }) => (hasRun(counts, 1, 5) ? 15 : 0),
  [Category.LargeStraight]: ({ counts }) => (hasRun(counts, 2, 5) ? 20 : 0),
  [Category.FullHouse]: ({ counts, sum }) => (isFullHouse(counts) ? sum : 0),
  [Category.Chance]: ({ sum }) => sum,
  [Category.Yatzy]: ({ most }) => (most === 5 ? 50 : 0),
};

const SCORERS: Record<Ruleset, Partial<Record<Category, Scorer>>> = {
  [Ruleset.Classic]: CLASSIC_SCORERS,
  [Ruleset.ClassicXl]: CLASSIC_XL_SCORERS,
  [Ruleset.Yatzy]: YATZY_SCORERS,
};

export function faceCounts(dice: readonly number[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const die of dice) counts[die]++;

  return counts;
}

export function isRolled(dice: readonly number[]): boolean {
  return dice.every((die) => die >= 1 && die <= 6);
}

export function isYatzy(dice: readonly number[]): boolean {
  return isRolled(dice) && dice.every((die) => die === dice[0]);
}

/** Five of a kind while the Yatzy field is used and the matching upper field is taken. */
export function isJoker(dice: Dice, sheet: Sheet, rules: Rules): boolean {
  return (
    isClassicFamily(rules.ruleset) &&
    rules.joker !== Joker.Off &&
    isYatzy(dice) &&
    !isOpen(sheet, Category.Yatzy) &&
    !isOpen(sheet, upperCategoryFor(dice[0]))
  );
}

/**
 * Points `dice` would score in `category` on `sheet`. Same function for previews and validation.
 * `luckyNumber` is this round's lucky number (`luckyNumberOf`), or `null` without that rule.
 */
export function score(
  dice: Dice,
  category: Category,
  sheet: Sheet,
  rules: Rules,
  luckyNumber: number | null,
): number {
  const scorer = SCORERS[rules.ruleset][category];
  if (!scorer || !isRolled(dice)) return 0;
  const counts = faceCounts(dice);

  return scorer({
    counts,
    sum: dice.reduce((a, b) => a + b, 0),
    most: Math.max(...counts.slice(1)),
    joker: isJoker(dice, sheet, rules),
    luckyNumber,
    rules,
  });
}

/** Fields the player may write into with these dice: field order and the official joker rule. */
export function allowedCategories(dice: Dice, sheet: Sheet, rules: Rules): Category[] {
  const open = openCategories(sheet, rules);
  if (open.length === 0) return [];
  if (rules.fieldOrder === FieldOrder.TopToBottom) return [open[0]];

  const forcedJoker =
    isClassicFamily(rules.ruleset) &&
    rules.joker === Joker.Official &&
    isYatzy(dice) &&
    !isOpen(sheet, Category.Yatzy);
  if (!forcedJoker) return open;

  const matchingUpper = upperCategoryFor(dice[0]);
  if (isOpen(sheet, matchingUpper)) return [matchingUpper];
  const openLower = lowerCategories(rules).filter((category) => isOpen(sheet, category));

  return openLower.length > 0 ? openLower : open;
}

/** A further Yatzy earns the bonus once the Yatzy field holds 50, whichever field it goes into. */
export function earnsYatzyBonus(dice: Dice, sheet: Sheet, rules: Rules): boolean {
  return (
    isClassicFamily(rules.ruleset) &&
    rules.yatzyBonus > 0 &&
    isYatzy(dice) &&
    sheet.fields[Category.Yatzy] === 50
  );
}

/** Returns a new sheet with the score written. Throws when the field is not open. */
export function writeScore(
  sheet: Sheet,
  category: Category,
  dice: Dice,
  rules: Rules,
  luckyNumber: number | null,
): Sheet {
  if (!isOpen(sheet, category)) throw new Error(`Field ${category} is not open`);

  return {
    fields: { ...sheet.fields, [category]: score(dice, category, sheet, rules, luckyNumber) },
    extraYatzys: sheet.extraYatzys + (earnsYatzyBonus(dice, sheet, rules) ? 1 : 0),
  };
}

export function upperSum(sheet: Sheet): number {
  return UPPER_CATEGORIES.reduce((total, category) => total + (sheet.fields[category] ?? 0), 0);
}

export function upperBonus(sheet: Sheet, rules: Rules): number {
  return rules.upperBonus && upperSum(sheet) >= UPPER_BONUS_THRESHOLD
    ? upperBonusPoints(rules.ruleset)
    : 0;
}

/** One sheet before its factor: fields + upper bonus + extra Yatzy bonuses. */
export function sheetTotal(sheet: Sheet, rules: Rules): number {
  const fields = categoriesFor(rules).reduce(
    (total, category) => total + (sheet.fields[category] ?? 0),
    0,
  );

  return fields + upperBonus(sheet, rules) + sheet.extraYatzys * rules.yatzyBonus;
}

/** The factor of the sheet at `index` (×1, ×2, ×3); 1 outside the known sheets. */
export function sheetFactor(index: number): number {
  return SHEET_FACTORS[index] ?? 1;
}

/** One value summed over all sheets, each multiplied by its factor (×1, ×2, ×3). */
export function weightedSum(sheets: readonly Sheet[], value: (sheet: Sheet) => number): number {
  return sheets.reduce((total, sheet, i) => total + value(sheet) * sheetFactor(i), 0);
}

/** All sheets, each multiplied by its factor (×1, ×2, ×3). */
export function playerTotal(sheets: readonly Sheet[], rules: Rules): number {
  return sheets.reduce((total, sheet, i) => total + sheetTotal(sheet, rules) * SHEET_FACTORS[i], 0);
}

/** Yatzy written as 50 plus extra Yatzy bonuses (for statistics). */
export function yatzyCount(sheets: readonly Sheet[]): number {
  return sheets.reduce(
    (total, sheet) => total + (sheet.fields[Category.Yatzy] === 50 ? 1 : 0) + sheet.extraYatzys,
    0,
  );
}
