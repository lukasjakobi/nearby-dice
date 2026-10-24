import { Category } from './enums';
import { lowerFields } from './fields';
import type { SheetRules } from './fields';
import { isYatzy } from './roll';
import type { Dice } from './roll';
import { isOpen, lowerCategories, upperCategoryFor } from './sheet';
import type { Sheet } from './sheet';

/*
 * The further Yatzy ("joker") rule, the same in every ruleset and preset: once a sheet's Yatzy
 * field holds 50, five equal dice are a further Yatzy. Each one earns the 50 bonus and goes into
 * the matching upper field (50) or any open lower field (that field's maximum). Only when neither
 * is open may it go into another open field, which then scores its normal points. With the Yatzy
 * field crossed out or still open there is no joker.
 */

/** A joker in the matching upper field scores this, in every ruleset. */
const JOKER_UPPER_POINTS = 50;

/** Five equal dice while this sheet's Yatzy field holds 50. */
export function isJoker(dice: Dice, sheet: Sheet): boolean {
  return isYatzy(dice) && sheet.fields[Category.Yatzy] === 50;
}

/**
 * The fields a joker may go into: the matching upper field (if open) and every open lower field.
 * `null` when the dice are no joker or neither kind is open: then every open field is allowed.
 */
export function jokerFields(dice: Dice, sheet: Sheet, rules: SheetRules): Category[] | null {
  if (!isJoker(dice, sheet)) return null;
  const fields = [upperCategoryFor(dice[0]), ...lowerCategories(rules)].filter((category) =>
    isOpen(sheet, category),
  );

  return fields.length > 0 ? fields : null;
}

/**
 * What a joker scores in `category`: 50 in the matching upper field, the maximum of a lower field.
 * `null` for any other field, which scores its normal points. Call it only for a joker.
 */
export function jokerPoints(dice: Dice, category: Category, rules: SheetRules): number | null {
  if (category === upperCategoryFor(dice[0])) return JOKER_UPPER_POINTS;

  return lowerFields(rules).find((field) => field.category === category)?.max ?? null;
}
