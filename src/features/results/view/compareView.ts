/** "Alle Felder im Vergleich": one row per field, one column per player in ranking order. */
import type { TFunction } from '@/i18n';
import { lowerCategories, UPPER_CATEGORIES, weightedSum, YATZY_BONUS } from '@/domain';
import type { Category, GamePlayer, Rules } from '@/domain';

import { signed } from './rankingView';
import type { RankedPlayer } from './rankingView';

export type CompareCell = { value: string; best: boolean };
export type CompareRow = { label: string; total: boolean; cells: CompareCell[] };

type RowOptions = { total?: boolean; format?: (n: number) => string };

export function buildCompare(
  t: TFunction,
  ranked: readonly RankedPlayer[],
  rules: Rules,
): CompareRow[] {
  // The best value of each row is highlighted when there is someone to beat.
  const row = (
    label: string,
    value: (ranked: RankedPlayer) => number | null,
    { total = false, format = String }: RowOptions = {},
  ): CompareRow => {
    const values = ranked.map(value);
    const max = Math.max(0, ...values.map((v) => v ?? 0));

    return {
      label,
      total,
      cells: values.map((v) => ({
        value: v === null ? '–' : format(v),
        best: ranked.length > 1 && v !== null && v === max && max > 0,
      })),
    };
  };

  const fieldRow = (category: Category) =>
    row(t(`labels.category.${category}`), ({ player }) =>
      player.sheets.some((sheet) => sheet.fields[category] != null)
        ? weightedSum(player.sheets, (sheet) => sheet.fields[category] ?? 0)
        : null,
    );
  const yatzyBonus = (player: GamePlayer) =>
    weightedSum(player.sheets, (sheet) => sheet.extraYatzys * YATZY_BONUS);

  return [
    ...UPPER_CATEGORIES.map(fieldRow),
    ...(rules.upperBonus
      ? [row(t('results.bonus'), ({ row: r }) => r.bonus, { total: true, format: signed })]
      : []),
    ...lowerCategories(rules).map(fieldRow),
    ...(ranked.some(({ player }) => yatzyBonus(player) > 0)
      ? [row(t('game.yatzyBonusRow'), ({ player }) => yatzyBonus(player), { format: signed })]
      : []),
    row(t('game.total'), ({ row: r }) => r.points, { total: true }),
  ];
}
