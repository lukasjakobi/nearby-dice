/**
 * "Spielstand" (every field of every player) and "Verlauf" (the full score history).
 * Every phone holds the complete game, so both are built locally.
 */
import type { TFunction } from '@/i18n';
import {
  categoriesFor,
  Category,
  faceOf,
  gamePlayer,
  Link,
  Rules,
  SHEET_FACTORS,
  totalOf,
  UPPER_BONUS_THRESHOLD,
  UPPER_CATEGORIES,
  upperBonusPoints,
  upperBonus,
  upperSum,
  YATZY_BONUS,
} from '@/domain';
import type { GameState, Sheet } from '@/domain';
import { playerById } from '@/session';
import type { PlayerInfo, SessionSnapshot } from '@/session';
import { avatarOf, historyRows } from '@/shared';
import type { HistoryRow } from '@/shared';

import { bonusOf } from './sheetView';
import type { BonusView } from './sheetView';

/** One line of a player's sheet: a field, or a bonus. `null` category: no icon. */
export type BoardRow = {
  key: string;
  category: Category | null;
  face: number | null;
  label: string;
  value: string;
};

/** One player's whole sheet, ready to show; the totals are already added up. */
export type PlayerBoard = {
  id: string;
  name: string;
  color: string;
  /** This phone's own player: the one the sheet opens on. */
  me: boolean;
  upper: BoardRow[];
  /** The upper bonus as a progress bar; only with a single sheet, otherwise a row. */
  bonus: BonusView | null;
  lower: BoardRow[];
  total: string;
};

export type ScoreboardView = {
  players: PlayerBoard[];
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

function playerBoard(
  t: TFunction,
  rules: Rules,
  game: GameState,
  info: PlayerInfo,
  sheets: Sheet[],
  me: boolean,
): PlayerBoard {
  const fieldRow = (category: Category): BoardRow => ({
    key: category,
    category,
    face: faceOf(category) ?? null,
    label: t(`labels.category.${category}`),
    value: fieldText(sheets, (sheet) => sheet.fields[category]),
  });
  const categories = categoriesFor(rules);
  const upperCategories = categories.filter((category) => UPPER_CATEGORIES.includes(category));
  const lowerCategories = categories.filter((category) => !UPPER_CATEGORIES.includes(category));
  const single = sheets.length === 1;

  const upperRows = upperCategories.map(fieldRow);
  if (rules.upperBonus && !single) {
    upperRows.push({
      key: 'bonus',
      category: null,
      face: null,
      label: t('game.bonus', { points: upperBonusPoints(rules.ruleset) }),
      value: sheets
        .map((sheet) => {
          const points = upperBonus(sheet, rules);

          return points > 0
            ? String(points)
            : t('game.bonusProgress', {
                sum: upperSum(sheet),
                threshold: UPPER_BONUS_THRESHOLD,
              });
        })
        .join(' · '),
    });
  }

  const lowerRows = lowerCategories.map(fieldRow);
  if (sheets.some((sheet) => sheet.extraYatzys > 0)) {
    lowerRows.push({
      key: 'yatzy-bonus',
      category: null,
      face: null,
      label: t('game.yatzyBonusRow'),
      value: sheets.map((sheet) => String(sheet.extraYatzys * YATZY_BONUS)).join(' · '),
    });
  }

  return {
    id: info.id,
    name: info.name,
    color: avatarOf(info).color,
    me,
    upper: upperRows,
    bonus: single ? bonusOf(t, rules, sheets[0]) : null,
    lower: lowerRows,
    total: String(totalOf(game, info.id)),
  };
}

export function buildScoreboard(t: TFunction, snapshot: SessionSnapshot): ScoreboardView | null {
  const game = snapshot.shared.game;
  if (!game) return null;
  const { rules } = game;
  const players = game.turnOrder
    .map((id) => ({ info: playerById(snapshot, id)!, sheets: gamePlayer(game, id)!.sheets }))
    .filter(({ info }) => info.link !== Link.Removed)
    .map(({ info, sheets }) =>
      playerBoard(t, rules, game, info, sheets, info.id === snapshot.myId),
    );

  return {
    players,
    sheetFactors:
      rules.sheets > 1
        ? SHEET_FACTORS.slice(0, rules.sheets)
            .map((factor) => t('game.sheetFactor', { factor }))
            .join(' · ')
        : null,
    history: historyRows(t, game, snapshot.shared.players),
  };
}
