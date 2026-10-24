import { Category, FieldOrder } from './enums';
import { sheetFields } from './fields';
import { earnsYatzyBonus, isJoker, jokerFields } from './joker';
import { analyseRoll, isRolled } from './roll';
import type { Dice } from './roll';
import type { Rules } from './rules';
import { isOpen, openCategories } from './sheet';
import type { Sheet } from './sheet';

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
  const field = sheetFields(rules).find((candidate) => candidate.category === category);
  if (!field || !isRolled(dice)) return 0;

  return field.points(analyseRoll(dice), { joker: isJoker(dice, sheet, rules), luckyNumber });
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

/** Fields the player may write into with these dice: field order and the official joker rule. */
export function allowedCategories(dice: Dice, sheet: Sheet, rules: Rules): Category[] {
  const open = openCategories(sheet, rules);
  if (open.length === 0) return [];
  if (rules.fieldOrder === FieldOrder.TopToBottom) return [open[0]];

  return jokerFields(dice, sheet, rules) ?? open;
}
