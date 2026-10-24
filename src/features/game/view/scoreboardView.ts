/**
 * "Spielstand" (every field of every player) and "Verlauf" (the full score history).
 * Every phone holds the complete game, so both are built locally.
 */
import type { TFunction } from '@/i18n';
import {
  categoriesFor,
  gamePlayer,
  isClassicFamily,
  Link,
  SHEET_FACTORS,
  totalOf,
  UPPER_BONUS_THRESHOLD,
  upperBonus,
  upperBonusPoints,
  upperSum,
} from '@/domain';
import type { Sheet } from '@/domain';
import { playerById } from '@/session';
import type { SessionSnapshot } from '@/session';
import { historyRows } from '@/shared';
import type { HistoryRow } from '@/shared';

export enum BoardRowKind {
  Field = 'field',
  Bonus = 'bonus',
  Total = 'total',
}

export type BoardRow = { key: string; kind: BoardRowKind; label: string; cells: string[] };

export type ScoreboardView = {
  columns: string[];
  rows: BoardRow[];
  /** "×1 · ×2 · ×3" when a player has several sheets, otherwise `null`. */
  sheetFactors: string | null;
  history: HistoryRow[];
};

/** One raw value per sheet; the factors (×1, ×2, ×3) are only labelled, not applied. */
const fieldText = (sheets: Sheet[], read: (sheet: Sheet) => number | null | undefined) =>
  sheets
    .map((sheet) => {
      const value = read(sheet);

      return value === null || value === undefined ? '–' : String(value);
    })
    .join(' · ');

export function buildScoreboard(t: TFunction, snapshot: SessionSnapshot): ScoreboardView | null {
  const game = snapshot.shared.game;
  if (!game) return null;
  const { rules } = game;
  const players = game.turnOrder
    .map((id) => ({ info: playerById(snapshot, id)!, sheets: gamePlayer(game, id)!.sheets }))
    .filter(({ info }) => info.link !== Link.Removed);

  const rows: BoardRow[] = categoriesFor(rules).map((category) => ({
    key: category,
    kind: BoardRowKind.Field,
    label: t(`labels.category.${category}`),
    cells: players.map(({ sheets }) => fieldText(sheets, (s) => s.fields[category])),
  }));
  if (rules.upperBonus) {
    rows.splice(6, 0, {
      key: 'bonus',
      kind: BoardRowKind.Bonus,
      label: t('game.bonus', { points: upperBonusPoints(rules.ruleset) }),
      cells: players.map(({ sheets }) =>
        sheets
          .map((s) =>
            upperBonus(s, rules) > 0
              ? String(upperBonus(s, rules))
              : t('game.bonusProgress', { sum: upperSum(s), threshold: UPPER_BONUS_THRESHOLD }),
          )
          .join(' · '),
      ),
    });
  }

  if (isClassicFamily(rules.ruleset) && rules.yatzyBonus > 0) {
    rows.push({
      key: 'yatzy-bonus',
      kind: BoardRowKind.Bonus,
      label: t('game.yatzyBonusRow'),
      cells: players.map(({ sheets }) =>
        sheets.map((s) => String(s.extraYatzys * rules.yatzyBonus)).join(' · '),
      ),
    });
  }

  rows.push({
    key: 'total',
    kind: BoardRowKind.Total,
    label: t('game.total'),
    cells: players.map(({ info }) => String(totalOf(game, info.id))),
  });

  return {
    columns: players.map(({ info }) => info.name),
    rows,
    sheetFactors:
      rules.sheets > 1
        ? SHEET_FACTORS.slice(0, rules.sheets)
            .map((factor) => t('game.sheetFactor', { factor }))
            .join(' · ')
        : null,
    history: historyRows(t, game, snapshot.shared.players),
  };
}
