import { Category, GameLength, Ruleset } from './enums';
import { SHORT_GAME_TURNS } from './rules';
import type { Rules } from './rules';

export type Face = 1 | 2 | 3 | 4 | 5 | 6;

export const UPPER_CATEGORIES: readonly Category[] = [
  Category.Ones,
  Category.Twos,
  Category.Threes,
  Category.Fours,
  Category.Fives,
  Category.Sixes,
];

const CLASSIC_LOWER: readonly Category[] = [
  Category.ThreeOfAKind,
  Category.FourOfAKind,
  Category.FullHouse,
  Category.SmallStraight,
  Category.LargeStraight,
  Category.Yatzy,
  Category.Chance,
];

const LOWER_CATEGORIES: Record<Ruleset, readonly Category[]> = {
  [Ruleset.Classic]: CLASSIC_LOWER,
  [Ruleset.ClassicXl]: [
    Category.TwoPairs,
    Category.Even,
    Category.Odd,
    Category.Mini,
    ...CLASSIC_LOWER,
  ],
  [Ruleset.Yatzy]: [
    Category.OnePair,
    Category.TwoPairs,
    Category.ThreeOfAKind,
    Category.FourOfAKind,
    Category.SmallStraight,
    Category.LargeStraight,
    Category.FullHouse,
    Category.Chance,
    Category.Yatzy,
  ],
};

const FACE_OF: Partial<Record<Category, Face>> = {
  [Category.Ones]: 1,
  [Category.Twos]: 2,
  [Category.Threes]: 3,
  [Category.Fours]: 4,
  [Category.Fives]: 5,
  [Category.Sixes]: 6,
};

/** The rules that decide which fields a sheet has. */
export type SheetRules = Pick<Rules, 'ruleset' | 'luckyNumber'>;

/** The lower block: the ruleset's fields, then "Glückszahl" when that rule is on. */
export function lowerCategories(rules: SheetRules): readonly Category[] {
  const lower = LOWER_CATEGORIES[rules.ruleset];

  return rules.luckyNumber ? [...lower, Category.LuckyNumber] : lower;
}

/** All fields of a sheet, top to bottom. */
export function categoriesFor(rules: SheetRules): Category[] {
  return [...UPPER_CATEGORIES, ...lowerCategories(rules)];
}

/** The face an upper-block category counts, or `undefined` for the lower block. */
export function faceOf(category: Category): Face | undefined {
  return FACE_OF[category];
}

export function upperCategoryFor(face: number): Category {
  return UPPER_CATEGORIES[face - 1];
}

/** `null` = open, `0` = struck. Only fields of the active rules are present. */
export type Fields = Partial<Record<Category, number | null>>;

export type Sheet = {
  fields: Fields;
  /** Extra Yatzy bonuses earned on this sheet. */
  extraYatzys: number;
};

export function emptySheet(rules: SheetRules): Sheet {
  const fields: Fields = {};
  for (const category of categoriesFor(rules)) fields[category] = null;

  return { fields, extraYatzys: 0 };
}

export function isOpen(sheet: Sheet, category: Category): boolean {
  return sheet.fields[category] === null;
}

export function openCategories(sheet: Sheet, rules: SheetRules): Category[] {
  return categoriesFor(rules).filter((category) => isOpen(sheet, category));
}

export function fieldCount(rules: SheetRules): number {
  return categoriesFor(rules).length;
}

/** Turns each player takes in a game (also the "Runde n von …" denominator). */
export function turnsPerPlayer(rules: Rules): number {
  if (rules.length === GameLength.Short) return SHORT_GAME_TURNS;

  return fieldCount(rules) * rules.sheets;
}
