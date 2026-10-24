import { Category, GameLength } from './enums';
import { UPPER_FIELDS, lowerFields, sheetFields } from './fields';
import type { SheetRules } from './fields';
import { SHORT_GAME_TURNS } from './rules';
import type { Rules } from './rules';

export type Face = 1 | 2 | 3 | 4 | 5 | 6;

/** The upper block, top to bottom: the field for one, two … six. */
export const UPPER_CATEGORIES: readonly Category[] = UPPER_FIELDS.map(({ category }) => category);

/** The lower block: the ruleset's fields, then "Glückszahl" when that rule is on. */
export function lowerCategories(rules: SheetRules): readonly Category[] {
  return lowerFields(rules).map(({ category }) => category);
}

/** All fields of a sheet, top to bottom. */
export function categoriesFor(rules: SheetRules): Category[] {
  return sheetFields(rules).map(({ category }) => category);
}

/** The face an upper-block category counts, or `undefined` for the lower block. */
export function faceOf(category: Category): Face | undefined {
  const index = UPPER_CATEGORIES.indexOf(category);

  return index === -1 ? undefined : ((index + 1) as Face);
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
