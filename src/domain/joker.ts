import { Category, Joker } from './enums';
import { isYatzy } from './roll';
import type { Dice } from './roll';
import { isClassicFamily } from './rules';
import type { Rules } from './rules';
import { isOpen, lowerCategories, upperCategoryFor } from './sheet';
import type { Sheet } from './sheet';

/** Five equal dice again, while the Yatzy field is used and the official joker rule applies. */
function isFurtherYatzy(dice: Dice, sheet: Sheet, rules: Rules): boolean {
  return (
    isClassicFamily(rules.ruleset) &&
    rules.joker === Joker.Official &&
    isYatzy(dice) &&
    !isOpen(sheet, Category.Yatzy)
  );
}

/** Five of a kind while the Yatzy field is used and the matching upper field is taken. */
export function isJoker(dice: Dice, sheet: Sheet, rules: Rules): boolean {
  return isFurtherYatzy(dice, sheet, rules) && !isOpen(sheet, upperCategoryFor(dice[0]));
}

/**
 * The fields a further Yatzy is limited to: the matching upper field, else the open lower fields.
 * `null` when the joker rule does not limit these dice, so every open field is allowed.
 */
export function jokerFields(dice: Dice, sheet: Sheet, rules: Rules): Category[] | null {
  if (!isFurtherYatzy(dice, sheet, rules)) return null;

  const matchingUpper = upperCategoryFor(dice[0]);
  if (isOpen(sheet, matchingUpper)) return [matchingUpper];
  const openLower = lowerCategories(rules).filter((category) => isOpen(sheet, category));

  return openLower.length > 0 ? openLower : null;
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
