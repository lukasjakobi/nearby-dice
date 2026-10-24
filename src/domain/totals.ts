import { Category } from './enums';
import { SHEET_FACTORS, UPPER_BONUS_THRESHOLD, YATZY_BONUS, upperBonusPoints } from './rules';
import type { Rules } from './rules';
import { UPPER_CATEGORIES, categoriesFor } from './sheet';
import type { Sheet } from './sheet';

/** The points of the upper block so far. */
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

  return fields + upperBonus(sheet, rules) + sheet.extraYatzys * YATZY_BONUS;
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
  return weightedSum(sheets, (sheet) => sheetTotal(sheet, rules));
}

/** Yatzy written as 50 plus extra Yatzy bonuses (for statistics). */
export function yatzyCount(sheets: readonly Sheet[]): number {
  return sheets.reduce(
    (total, sheet) => total + (sheet.fields[Category.Yatzy] === 50 ? 1 : 0) + sheet.extraYatzys,
    0,
  );
}
