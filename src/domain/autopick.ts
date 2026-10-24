import { Category } from './enums';
import type { Dice } from './roll';
import { SHEET_FACTORS } from './rules';
import type { Rules } from './rules';
import { allowedCategories, score } from './scoring';
import type { Sheet } from './sheet';

/** Rough average value of each field; decides the "least valuable" field to strike. */
const EXPECTED_VALUE: Record<Category, number> = {
  [Category.Ones]: 2,
  [Category.Twos]: 5,
  [Category.Threes]: 8,
  [Category.Fours]: 11,
  [Category.Fives]: 14,
  [Category.Sixes]: 17,
  [Category.OnePair]: 9,
  [Category.TwoPairs]: 13,
  [Category.ThreeOfAKind]: 15,
  [Category.FourOfAKind]: 10,
  [Category.FullHouse]: 16,
  [Category.SmallStraight]: 19,
  [Category.LargeStraight]: 14,
  [Category.Yatzy]: 12,
  [Category.Chance]: 22,
  [Category.Even]: 9,
  [Category.Odd]: 7,
  [Category.Mini]: 8,
  [Category.LuckyNumber]: 6,
};

export type Pick = { sheet: number; category: Category; points: number };

/**
 * The timeout rule: the highest-scoring allowed field (points × sheet factor),
 * or, when nothing scores, strike the least valuable allowed field.
 */
export function autoPick(
  dice: Dice,
  sheets: readonly Sheet[],
  rules: Rules,
  luckyNumber: number | null,
): Pick | null {
  const options = sheets.flatMap((sheet, sheetIndex) =>
    allowedCategories(dice, sheet, rules).map((category) => {
      const points = score(dice, category, sheet, rules, luckyNumber);
      const factor = SHEET_FACTORS[sheetIndex];

      return {
        pick: { sheet: sheetIndex, category, points },
        weighted: points * factor,
        expected: EXPECTED_VALUE[category] * factor,
      };
    }),
  );
  if (options.length === 0) return null;

  const scoring = options.filter((option) => option.weighted > 0);
  const best =
    scoring.length > 0
      ? scoring.reduce((a, b) => (b.weighted > a.weighted ? b : a))
      : options.reduce((a, b) => (b.expected < a.expected ? b : a));

  return best.pick;
}
