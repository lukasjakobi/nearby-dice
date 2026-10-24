import { Category, Ruleset } from './enums';
import type { Roll } from './roll';
import { LUCKY_NUMBER_POINTS } from './rules';
import type { Rules } from './rules';

/** Round facts a field's points may depend on, besides the dice. */
export type FieldContext = {
  /** A further Yatzy counts as a joker: Full House and the straights score at full value. */
  joker: boolean;
  /** This round's lucky number, or `null` without the lucky-number rule. */
  luckyNumber: number | null;
};

/** The points rolled dice score in a field. */
export type FieldPoints = (roll: Roll, context: FieldContext) => number;

/** One field of the score sheet: its category and how its points are worked out. */
export type Field = { category: Category; points: FieldPoints };

/** The rules that decide which fields a sheet has. */
export type SheetRules = Pick<Rules, 'ruleset' | 'luckyNumber'>;

const field = (category: Category, points: FieldPoints): Field => ({ category, points });

/** The highest face shown by at least `n` dice; 0 when no face is shown that often. */
const highestOfAKind = (counts: readonly number[], n: number): number => {
  for (let face = 6; face >= 1; face--) if (counts[face] >= n) return face;

  return 0;
};

/** Every face from `from` up to `from + length - 1` is shown. */
const hasRun = (counts: readonly number[], from: number, length: number): boolean => {
  for (let face = from; face < from + length; face++) if (counts[face] === 0) return false;

  return true;
};

const isFullHouse = (counts: readonly number[]): boolean =>
  counts.includes(3) && counts.includes(2);

/** The sum of the dice showing one of `faces`. */
const sumOfFaces = (counts: readonly number[], faces: readonly number[]): number =>
  faces.reduce((sum, face) => sum + counts[face] * face, 0);

/** Two pairs score both faces twice over. `pairs` lists the repeated faces, highest first. */
const twoPairsPoints = (pairs: readonly number[]): number =>
  pairs.length >= 2 ? (pairs[0] + pairs[1]) * 2 : 0;

/** The upper block is the same in every ruleset: each field sums the dice showing its face. */
const upper = (category: Category, face: number): Field =>
  field(category, ({ counts }) => counts[face] * face);

export const UPPER_FIELDS: readonly Field[] = [
  upper(Category.Ones, 1),
  upper(Category.Twos, 2),
  upper(Category.Threes, 3),
  upper(Category.Fours, 4),
  upper(Category.Fives, 5),
  upper(Category.Sixes, 6),
];

/** The lucky-number field, appended to the lower block while its rule is on. */
const LUCKY_NUMBER_FIELD = field(Category.LuckyNumber, (roll, { luckyNumber }) =>
  roll.sum === luckyNumber ? LUCKY_NUMBER_POINTS : 0,
);

/** Classic: the lower block, top to bottom. */
const CLASSIC_LOWER: readonly Field[] = [
  field(Category.ThreeOfAKind, ({ most, sum }) => (most >= 3 ? sum : 0)),
  field(Category.FourOfAKind, ({ most, sum }) => (most >= 4 ? sum : 0)),
  field(Category.FullHouse, ({ counts }, { joker }) => (isFullHouse(counts) || joker ? 25 : 0)),
  field(Category.SmallStraight, ({ counts }, { joker }) =>
    joker || hasRun(counts, 1, 4) || hasRun(counts, 2, 4) || hasRun(counts, 3, 4) ? 30 : 0,
  ),
  field(Category.LargeStraight, ({ counts }, { joker }) =>
    joker || hasRun(counts, 1, 5) || hasRun(counts, 2, 5) ? 40 : 0,
  ),
  field(Category.Yatzy, ({ most }) => (most === 5 ? 50 : 0)),
  field(Category.Chance, ({ sum }) => sum),
];

/** Classic XL: the four extra fields come first, then the Classic lower block. */
const CLASSIC_XL_LOWER: readonly Field[] = [
  field(Category.TwoPairs, ({ pairs }) => twoPairsPoints(pairs)),
  field(Category.Even, ({ counts }) => sumOfFaces(counts, [2, 4, 6])),
  field(Category.Odd, ({ counts }) => sumOfFaces(counts, [1, 3, 5])),
  field(Category.Mini, ({ sum }) => (sum <= 10 ? 30 : 0)),
  ...CLASSIC_LOWER,
];

/** Scandinavian Yatzy: the lower block, top to bottom. */
const YATZY_LOWER: readonly Field[] = [
  field(Category.OnePair, ({ counts }) => highestOfAKind(counts, 2) * 2),
  field(Category.TwoPairs, ({ pairs }) => twoPairsPoints(pairs)),
  field(Category.ThreeOfAKind, ({ counts }) => highestOfAKind(counts, 3) * 3),
  field(Category.FourOfAKind, ({ counts }) => highestOfAKind(counts, 4) * 4),
  field(Category.SmallStraight, ({ counts }) => (hasRun(counts, 1, 5) ? 15 : 0)),
  field(Category.LargeStraight, ({ counts }) => (hasRun(counts, 2, 5) ? 20 : 0)),
  field(Category.FullHouse, ({ counts, sum }) => (isFullHouse(counts) ? sum : 0)),
  field(Category.Chance, ({ sum }) => sum),
  field(Category.Yatzy, ({ most }) => (most === 5 ? 50 : 0)),
];

/** The lower block of each ruleset, top to bottom, without the lucky-number field. */
const LOWER_FIELDS: Record<Ruleset, readonly Field[]> = {
  [Ruleset.Classic]: CLASSIC_LOWER,
  [Ruleset.ClassicXl]: CLASSIC_XL_LOWER,
  [Ruleset.Yatzy]: YATZY_LOWER,
};

/** The lower block: the ruleset's fields, then the lucky-number field while that rule is on. */
export function lowerFields(rules: SheetRules): readonly Field[] {
  const lower = LOWER_FIELDS[rules.ruleset];

  return rules.luckyNumber ? [...lower, LUCKY_NUMBER_FIELD] : lower;
}

/** Every field of a sheet, top to bottom. */
export function sheetFields(rules: SheetRules): readonly Field[] {
  return [...UPPER_FIELDS, ...lowerFields(rules)];
}
